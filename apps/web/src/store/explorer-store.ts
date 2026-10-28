import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Character, CharacterFilters, CharactersResponse } from '@rme/shared';
import { trackEvent } from '@/lib/analytics';
import { fetchCharacterPage } from '@/lib/character-page-client';
import { filtersKey, normalizeFilters } from '@/lib/character-filters';

export const QUERY_TTL_MS = 10 * 60_000;
export const MAX_CACHED_QUERIES = 20;

// Every page loaded so far for one filter set.
export interface CachedQuery {
  characters: Character[];
  nextPage: number | null;
  total: number;
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
  favorites: string[];
  hydrate: (filters: CharacterFilters, firstPage: CharactersResponse) => void;
  setFilters: (filters: CharacterFilters) => Promise<void>;
  resetFilters: () => Promise<void>;
  // Loads the next page of the current filters, or the first one if nothing is cached (retry).
  loadNextPage: () => Promise<void>;
  toggleFavorite: (characterId: string) => void;
}

function isFresh(query: CachedQuery | undefined, now = Date.now()): query is CachedQuery {
  return query !== undefined && now - query.fetchedAt < QUERY_TTL_MS;
}

// Drops expired entries and, past the cap, the oldest ones. The current key is always kept.
function prune(
  queries: Record<string, CachedQuery>,
  keep: string,
  now = Date.now(),
): Record<string, CachedQuery> {
  const entries = Object.entries(queries).filter(([key, q]) => key === keep || isFresh(q, now));
  if (entries.length > MAX_CACHED_QUERIES) {
    entries.sort(([keyA, a], [keyB, b]) => {
      if (keyA === keep) return -1;
      if (keyB === keep) return 1;
      return b.fetchedAt - a.fetchedAt;
    });
    entries.length = MAX_CACHED_QUERIES;
  }
  return Object.fromEntries(entries);
}

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
              queries: prune({ ...s.queries, [key]: query }, filtersKey(s.filters)),
              status: { ...s.status, [key]: 'idle' },
            };
          });
          if (page > 1) trackEvent('characters_page_loaded', { page });
        } catch {
          set((s) => ({ status: { ...s.status, [key]: 'error' } }));
        }
      }

      return {
        filters: {},
        queries: {},
        status: {},
        ready: false,
        favorites: [],

        hydrate: (filters, firstPage) => {
          const normalized = normalizeFilters(filters);
          const key = filtersKey(normalized);
          set((s) => {
            const cached = s.queries[key];
            // Keep a fresh cached entry that already holds more pages than the server render.
            const keepCached =
              isFresh(cached) && cached.characters.length >= firstPage.results.length;
            const queries = keepCached ? s.queries : { ...s.queries, [key]: toQuery(firstPage) };
            return { filters: normalized, queries: prune(queries, key), ready: true };
          });
        },

        setFilters: async (filters) => {
          const normalized = normalizeFilters(filters);
          const key = filtersKey(normalized);
          if (key === filtersKey(get().filters)) return;

          trackEvent('characters_filtered', { ...normalized });
          if (isFresh(get().queries[key])) {
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

        // TODO: implement favorites.
        toggleFavorite: () => {},
      };
    },
    {
      name: 'rme-explorer',
      // Per-tab browser cache: survives reloads, not shared across tabs or sessions.
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ queries: state.queries }),
      // Rehydrated by CharacterExplorer after mount, so the server render and the first client
      // render match.
      skipHydration: true,
    },
  ),
);
