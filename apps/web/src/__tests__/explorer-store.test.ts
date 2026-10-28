import type { Character, CharactersResponse } from '@rme/shared';
import { fetchCharacterPage } from '@/lib/character-page-client';
import { MAX_CACHED_QUERIES, QUERY_TTL_MS, useExplorerStore } from '@/store/explorer-store';

jest.mock('@/lib/character-page-client', () => ({ fetchCharacterPage: jest.fn() }));
jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

const fetchPage = jest.mocked(fetchCharacterPage);

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

const store = () => useExplorerStore.getState();

beforeEach(() => {
  sessionStorage.clear();
  useExplorerStore.setState({ filters: {}, queries: {}, status: {}, ready: false });
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

  it('persists the results cache, not the filters, to sessionStorage', () => {
    store().hydrate({ name: 'rick' }, page([1], null));

    const saved = JSON.parse(sessionStorage.getItem('rme-explorer') ?? '{}');
    expect(Object.keys(saved.state)).toEqual(['queries']);
    expect(saved.state.queries['name=rick'].characters).toHaveLength(1);
  });
});
