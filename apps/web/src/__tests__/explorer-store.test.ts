import type { Character, CharacterDetail, CharactersResponse } from '@rme/shared';
import { trackEvent } from '@/lib/analytics';
import { fetchCharacterPage } from '@/lib/character-page-client';
import { fetchCharacterProfile } from '@/lib/character-profile-client';
import {
  MAX_CACHED_PROFILES,
  MAX_CACHED_QUERIES,
  PROFILE_TTL_MS,
  QUERY_TTL_MS,
  selectCachedCharacter,
  useExplorerStore,
} from '@/store/explorer-store';

jest.mock('@/lib/character-page-client', () => ({ fetchCharacterPage: jest.fn() }));
jest.mock('@/lib/character-profile-client', () => ({ fetchCharacterProfile: jest.fn() }));
jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

const fetchPage = jest.mocked(fetchCharacterPage);
const fetchProfile = jest.mocked(fetchCharacterProfile);

function character(id: number): Character {
  return {
    id: String(id),
    name: `Character ${id}`,
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    image: '',
    origin: { id: null, name: 'unknown' },
    location: { id: null, name: 'unknown' },
  };
}

function page(ids: number[], next: number | null, count = 10): CharactersResponse {
  return { info: { count, pages: 3, next, prev: null }, results: ids.map(character) };
}

function profile(id: number): CharacterDetail {
  return {
    ...character(id),
    origin: { id: null, name: 'unknown', type: '', dimension: '' },
    location: { id: null, name: 'unknown', type: '', dimension: '' },
    episode: [{ id: '1', name: 'Pilot', airDate: 'December 2, 2013', episode: 'S01E01' }],
    created: '2017-11-04T18:48:46.250Z',
  };
}

const store = () => useExplorerStore.getState();

beforeEach(() => {
  sessionStorage.clear();
  useExplorerStore.setState({
    filters: {},
    queries: {},
    status: {},
    ready: false,
    profiles: {},
    profileStatus: {},
    profileOrigin: null,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetAllMocks();
});

describe('explorer store', () => {
  it('hydrate seeds the filters and the server-rendered first page', () => {
    store().hydrate({ status: 'Alive' }, page([1, 2], 2));

    expect(store().ready).toBe(true);
    expect(store().filters).toEqual({ status: 'Alive' });
    expect(store().queries['status=Alive']?.characters).toHaveLength(2);
  });

  it('hydrate keeps a fresh cached entry that holds more pages', () => {
    store().hydrate({}, page([1, 2, 3, 4], 3));
    store().hydrate({}, page([1, 2], 2));

    expect(store().queries['']?.characters).toHaveLength(4);
  });

  it('fetches page 1 for new filters and caches it under their key', async () => {
    store().hydrate({}, page([1, 2], 2));
    fetchPage.mockResolvedValueOnce(page([3], null, 1));

    await store().setFilters({ name: 'rick' });

    expect(fetchPage).toHaveBeenCalledWith({ name: 'rick' }, 1);
    expect(store().filters).toEqual({ name: 'rick' });
    expect(store().queries['name=rick']?.characters.map((c) => c.id)).toEqual(['3']);
    expect(store().status['name=rick']).toBe('idle');
  });

  it('serves a cached filter set without fetching again', async () => {
    store().hydrate({}, page([1, 2], 2));
    fetchPage.mockResolvedValueOnce(page([3], null, 1));
    await store().setFilters({ name: 'rick' });

    await store().setFilters({});
    await store().setFilters({ name: 'rick' });

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(store().filters).toEqual({ name: 'rick' });
  });

  it('refetches a filter set once its cache entry has expired', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    store().hydrate({}, page([1, 2], 2));
    fetchPage.mockResolvedValue(page([3], null, 1));
    await store().setFilters({ name: 'rick' });
    await store().setFilters({});

    clock.mockReturnValue(now + QUERY_TTL_MS + 1);
    await store().setFilters({ name: 'rick' });

    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('appends the next page and skips characters already listed', async () => {
    store().hydrate({}, page([1, 2], 2));
    fetchPage.mockResolvedValueOnce(page([2, 3], 3));

    await store().loadNextPage();

    expect(fetchPage).toHaveBeenCalledWith({}, 2);
    expect(store().queries['']?.characters.map((c) => c.id)).toEqual(['1', '2', '3']);
    expect(store().queries['']?.nextPage).toBe(3);
  });

  it('does not load past the last page', async () => {
    store().hydrate({}, page([1, 2], null));

    await store().loadNextPage();

    expect(fetchPage).not.toHaveBeenCalled();
  });

  it('ignores a second load while one is in flight', async () => {
    store().hydrate({}, page([1, 2], 2));
    fetchPage.mockResolvedValueOnce(page([3], null));

    await Promise.all([store().loadNextPage(), store().loadNextPage()]);

    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('marks a failed load as an error and retries the first page', async () => {
    store().hydrate({}, page([1], null));
    fetchPage.mockRejectedValueOnce(new Error('boom'));

    await store().setFilters({ status: 'Dead' });
    expect(store().status['status=Dead']).toBe('error');
    expect(store().queries['status=Dead']).toBeUndefined();
    expect(trackEvent).toHaveBeenCalledWith('characters_load_failed', { page: 1 });

    fetchPage.mockResolvedValueOnce(page([9], null, 1));
    await store().loadNextPage();

    expect(fetchPage).toHaveBeenLastCalledWith({ status: 'Dead' }, 1);
    expect(store().queries['status=Dead']?.characters.map((c) => c.id)).toEqual(['9']);
  });

  it('keeps a slow response for old filters out of the current list', async () => {
    store().hydrate({}, page([1], null));
    let resolveSlow: (value: CharactersResponse) => void = () => {};
    fetchPage
      .mockReturnValueOnce(new Promise((resolve) => (resolveSlow = resolve)))
      .mockResolvedValueOnce(page([20], null, 1));

    const slow = store().setFilters({ name: 'rick' });
    await store().setFilters({ name: 'morty' });
    resolveSlow(page([10], null, 1));
    await slow;

    expect(store().filters).toEqual({ name: 'morty' });
    expect(store().queries['name=morty']?.characters.map((c) => c.id)).toEqual(['20']);
    expect(store().queries['name=rick']?.characters.map((c) => c.id)).toEqual(['10']);
  });

  it(`keeps at most ${MAX_CACHED_QUERIES} filter sets, evicting the oldest`, async () => {
    store().hydrate({}, page([1], null));
    fetchPage.mockImplementation(async (filters) => page([Number(filters.type ?? 0)], null, 1));
    const clock = jest.spyOn(Date, 'now');

    for (let i = 1; i <= MAX_CACHED_QUERIES + 2; i++) {
      clock.mockReturnValue(1_000_000 + i);
      await store().setFilters({ type: String(i) });
    }

    const keys = Object.keys(store().queries);
    expect(keys).toHaveLength(MAX_CACHED_QUERIES);
    expect(keys).toContain(`type=${MAX_CACHED_QUERIES + 2}`);
    expect(keys).not.toContain('type=1');
  });

  it('persists the results and profile caches, not the filters, to sessionStorage', () => {
    store().hydrate({ name: 'rick' }, page([1], null));
    store().cacheProfile(profile(1));

    const saved = JSON.parse(sessionStorage.getItem('rme-explorer') ?? '{}');
    expect(Object.keys(saved.state)).toEqual(['queries', 'profiles']);
    expect(saved.state.queries['name=rick'].characters).toHaveLength(1);
    expect(saved.state.profiles['1'].character.name).toBe('Character 1');
  });
});

describe('explorer store profiles', () => {
  it('cacheProfile stores a server-rendered profile', () => {
    store().cacheProfile(profile(1));

    expect(store().profiles['1']?.character).toEqual(profile(1));
  });

  it('prefetchProfile fetches a profile once and caches it', async () => {
    fetchProfile.mockResolvedValue(profile(1));

    await store().prefetchProfile('1');
    await store().prefetchProfile('1');

    expect(fetchProfile).toHaveBeenCalledTimes(1);
    expect(fetchProfile).toHaveBeenCalledWith('1');
    expect(store().profiles['1']?.character).toEqual(profile(1));
    expect(store().profileStatus['1']).toBe('idle');
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('character_profile_prefetched', { id: '1' });
  });

  it('prefetchProfile skips a profile the server already rendered', async () => {
    store().cacheProfile(profile(1));

    await store().prefetchProfile('1');

    expect(fetchProfile).not.toHaveBeenCalled();
  });

  it('prefetchProfile ignores a second call while one is in flight', async () => {
    fetchProfile.mockResolvedValue(profile(1));

    await Promise.all([store().prefetchProfile('1'), store().prefetchProfile('1')]);

    expect(fetchProfile).toHaveBeenCalledTimes(1);
  });

  it('prefetchProfile refetches once the cached profile has expired', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    fetchProfile.mockResolvedValue(profile(1));
    await store().prefetchProfile('1');

    clock.mockReturnValue(now + PROFILE_TTL_MS + 1);
    await store().prefetchProfile('1');

    expect(fetchProfile).toHaveBeenCalledTimes(2);
  });

  it('prefetchProfile marks a failed load as an error without caching anything', async () => {
    fetchProfile.mockRejectedValueOnce(new Error('boom'));

    await store().prefetchProfile('1');

    expect(store().profileStatus['1']).toBe('error');
    expect(store().profiles['1']).toBeUndefined();
    expect(trackEvent).not.toHaveBeenCalledWith('character_profile_prefetched', { id: '1' });
  });

  it(`keeps at most ${MAX_CACHED_PROFILES} profiles, evicting the oldest`, () => {
    const clock = jest.spyOn(Date, 'now');

    for (let i = 1; i <= MAX_CACHED_PROFILES + 2; i++) {
      clock.mockReturnValue(1_000_000 + i);
      store().cacheProfile(profile(i));
    }

    const ids = Object.keys(store().profiles);
    expect(ids).toHaveLength(MAX_CACHED_PROFILES);
    expect(ids).toContain(String(MAX_CACHED_PROFILES + 2));
    expect(ids).not.toContain('1');
  });

  it('openProfile remembers the list URL and tracks the event', () => {
    store().openProfile('1', '/?status=Dead');

    expect(store().profileOrigin).toBe('/?status=Dead');
    expect(trackEvent).toHaveBeenCalledWith('character_profile_opened', { id: '1' });
  });

  it('does not persist the profile origin', () => {
    store().openProfile('1', '/?status=Dead');
    store().cacheProfile(profile(1));

    const saved = JSON.parse(sessionStorage.getItem('rme-explorer') ?? '{}');
    expect(saved.state.profileOrigin).toBeUndefined();
  });

  it('selectCachedCharacter prefers the profile, then a listed character', () => {
    store().hydrate({}, page([1, 2], null));
    store().cacheProfile(profile(2));

    expect(selectCachedCharacter('1')(store())).toEqual(character(1));
    expect(selectCachedCharacter('2')(store())).toEqual(profile(2));
    expect(selectCachedCharacter('3')(store())).toBeNull();
  });
});
