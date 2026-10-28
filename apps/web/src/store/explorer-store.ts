import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Character, CharacterDetail, CharacterFilters, CharactersResponse } from '@rme/shared';
import { trackEvent } from '@/lib/analytics';
import { fetchCharacterPage } from '@/lib/character-page-client';
import { fetchCharacterProfile } from '@/lib/character-profile-client';
import { filtersKey, normalizeFilters } from '@/lib/character-filters';

export const QUERY_TTL_MS = 10 * 60_000;
export const MAX_CACHED_QUERIES = 20;
export const PROFILE_TTL_MS = 10 * 60_000;
export const MAX_CACHED_PROFILES = 50;

// Every page loaded so far for one filter set.
export interface CachedQuery {
  characters: Character[];
  nextPage: number | null;
  total: number;
  fetchedAt: number;
}

// One character's full profile.
export interface CachedProfile {
  character: CharacterDetail;
  fetchedAt: number;
}

export type QueryStatus = 'idle' | 'loading' | 'error';

// Client-only UI state. The API token is NOT kept here: it lives in the httpOnly session cookie
// managed by src/proxy.ts and is only ever read on the Next.js server.
interface ExplorerState {
  // The URL is the source of truth for filters; this mirrors it for client components.
  filters: CharacterFilters;
  // Results cache keyed by filtersKey(). Persisted to sessionStorage.
  queries: Record<string, CachedQuery>;
  status: Record<string, QueryStatus>;
  // False until hydrate() has seeded the store from the server-rendered first page.
  ready: boolean;
  // Profile cache keyed by character id. Persisted to sessionStorage.
  profiles: Record<string, CachedProfile>;
  profileStatus: Record<string, QueryStatus>;
  // The list URL the open profile was reached from by clicking a card, so its breadcrumb can go
  // back in history instead. In memory only: after a reload the breadcrumb is a plain link.
  profileOrigin: string | null;
  favorites: string[];
  hydrate: (filters: CharacterFilters, firstPage: CharactersResponse) => void;
  setFilters: (filters: CharacterFilters) => Promise<void>;
  resetFilters: () => Promise<void>;
  // Loads the next page of the current filters, or the first one if nothing is cached (retry).
  loadNextPage: () => Promise<void>;
  // Stores a profile the server rendered.
  cacheProfile: (character: CharacterDetail) => void;
  // Loads a profile into the cache ahead of navigation, unless a fresh one is already there.
  prefetchProfile: (id: string) => Promise<void>;
  // Records that a card was clicked on the list at `from`.
  openProfile: (id: string, from: string) => void;
  toggleFavorite: (characterId: string) => void;
}

function isFresh<T extends { fetchedAt: number }>(
  entry: T | undefined,
  ttl: number,
  now = Date.now(),
): entry is T {
  return entry !== undefined && now - entry.fetchedAt < ttl;
}

// Drops expired entries and, past the cap, the oldest ones. The `keep` key is always kept.
function prune<T extends { fetchedAt: number }>(
  entries: Record<string, T>,
  keep: string,
  { ttl, max }: { ttl: number; max: number },
  now = Date.now(),
): Record<string, T> {
  const kept = Object.entries(entries).filter(([key, e]) => key === keep || isFresh(e, ttl, now));
  if (kept.length > max) {
    kept.sort(([keyA, a], [keyB, b]) => {
      if (keyA === keep) return -1;
      if (keyB === keep) return 1;
      return b.fetchedAt - a.fetchedAt;
    });
    kept.length = max;
  }
  return Object.fromEntries(kept);
}

const QUERY_LIMITS = { ttl: QUERY_TTL_MS, max: MAX_CACHED_QUERIES };
const PROFILE_LIMITS = { ttl: PROFILE_TTL_MS, max: MAX_CACHED_PROFILES };

function toQuery(page: CharactersResponse, now = Date.now()): CachedQuery {
  return {
    characters: page.results,
    nextPage: page.info.next,
    total: page.info.count,
    fetchedAt: now,
  };
}

export const useExplorerStore = create<ExplorerState>()(
  persist(
    (set, get) => {
      // Results are always written under the key they were requested for, so a slow response for
      // an old filter set can't leak into the current one; it just fills that set's cache.
      async function loadPage(filters: CharacterFilters, page: number) {
        const key = filtersKey(filters);
        if (get().status[key] === 'loading') return;
        set((s) => ({ status: { ...s.status, [key]: 'loading' } }));

        try {
          const result = await fetchCharacterPage(filters, page);
          set((s) => {
            const existing = s.queries[key];
            let query: CachedQuery;
            if (page > 1 && existing) {
              const seen = new Set(existing.characters.map((c) => c.id));
              query = {
                ...existing,
                characters: [
                  ...existing.characters,
                  ...result.results.filter((c) => !seen.has(c.id)),
                ],
                nextPage: result.info.next,
                total: result.info.count,
              };
            } else {
              query = toQuery(result);
            }
            return {
              queries: prune({ ...s.queries, [key]: query }, filtersKey(s.filters), QUERY_LIMITS),
              status: { ...s.status, [key]: 'idle' },
            };
          });
          if (page > 1) trackEvent('characters_page_loaded', { page });
        } catch {
          set((s) => ({ status: { ...s.status, [key]: 'error' } }));
        }
      }

      function storeProfile(character: CharacterDetail) {
        set((s) => ({
          profiles: prune(
            { ...s.profiles, [character.id]: { character, fetchedAt: Date.now() } },
            character.id,
            PROFILE_LIMITS,
          ),
          profileStatus: { ...s.profileStatus, [character.id]: 'idle' },
        }));
      }

      return {
        filters: {},
        queries: {},
        status: {},
        ready: false,
        profiles: {},
        profileStatus: {},
        profileOrigin: null,
        favorites: [],

        hydrate: (filters, firstPage) => {
          const normalized = normalizeFilters(filters);
          const key = filtersKey(normalized);
          set((s) => {
            const cached = s.queries[key];
            // Keep a fresh cached entry that already holds more pages than the server render.
            const keepCached =
              isFresh(cached, QUERY_TTL_MS) && cached.characters.length >= firstPage.results.length;
            const queries = keepCached ? s.queries : { ...s.queries, [key]: toQuery(firstPage) };
            return { filters: normalized, queries: prune(queries, key, QUERY_LIMITS), ready: true };
          });
        },

        setFilters: async (filters) => {
          const normalized = normalizeFilters(filters);
          const key = filtersKey(normalized);
          if (key === filtersKey(get().filters)) return;

          trackEvent('characters_filtered', { ...normalized });
          if (isFresh(get().queries[key], QUERY_TTL_MS)) {
            set({ filters: normalized });
            return;
          }
          // Drop an expired entry so the list shows a loading state, not stale results.
          set((s) => {
            const { [key]: _stale, ...queries } = s.queries;
            return { filters: normalized, queries };
          });
          await loadPage(normalized, 1);
        },

        resetFilters: () => get().setFilters({}),

        loadNextPage: async () => {
          const { filters, queries } = get();
          const query = queries[filtersKey(filters)];
          if (!query) return loadPage(filters, 1);
          if (query.nextPage === null) return;
          await loadPage(filters, query.nextPage);
        },

        cacheProfile: storeProfile,

        prefetchProfile: async (id) => {
          const { profiles, profileStatus } = get();
          if (isFresh(profiles[id], PROFILE_TTL_MS) || profileStatus[id] === 'loading') return;
          set((s) => ({ profileStatus: { ...s.profileStatus, [id]: 'loading' } }));

          try {
            storeProfile(await fetchCharacterProfile(id));
          } catch {
            // Only a head start: the profile page renders from the server either way.
            set((s) => ({ profileStatus: { ...s.profileStatus, [id]: 'error' } }));
          }
        },

        openProfile: (id, from) => {
          set({ profileOrigin: from });
          trackEvent('character_profile_opened', { id });
        },

        // TODO: implement favorites.
        toggleFavorite: () => {},
      };
    },
    {
      name: 'rme-explorer',
      // Per-tab browser cache: survives reloads, not shared across tabs or sessions.
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ queries: state.queries, profiles: state.profiles }),
      // Rehydrated by rehydrateExplorerStore() after mount, so the server render and the first
      // client render match.
      skipHydration: true,
    },
  ),
);

// The best copy of a character the store holds: its full profile (even an expired one, which is
// only shown until the server render replaces it), else its entry in any cached list, else null.
export function selectCachedCharacter(id: string) {
  return (s: ExplorerState): Character | CharacterDetail | null => {
    const profile = s.profiles[id];
    if (profile) return profile.character;
    for (const query of Object.values(s.queries)) {
      const listed = query.characters.find((c) => c.id === id);
      if (listed) return listed;
    }
    return null;
  };
}

// Restores the sessionStorage caches. Call it from an effect, never during render.
export function rehydrateExplorerStore(): Promise<void> {
  return Promise.resolve(useExplorerStore.persist?.rehydrate());
}
