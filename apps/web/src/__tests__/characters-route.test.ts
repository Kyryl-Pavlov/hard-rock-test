/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import type { CharactersResponse } from '@rme/shared';
import { GET } from '@/app/api/characters/route';
import { ApiRequestError } from '@/lib/api-client';
import { getCharacters } from '@/lib/characters';

// The real data layer is server-only and reads cookies.
jest.mock('@/lib/characters', () => ({ getCharacters: jest.fn() }));

const getCharactersMock = jest.mocked(getCharacters);

const response: CharactersResponse = {
  info: { count: 1, pages: 1, next: null, prev: null },
  results: [],
};

function get(query: string) {
  return GET(new NextRequest(`http://localhost:3000/api/characters${query}`));
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('GET /api/characters', () => {
  it('passes parsed filters and the page to the data layer', async () => {
    getCharactersMock.mockResolvedValueOnce(response);

    const res = await get('?page=2&name=rick&status=Alive&gender=Nope&type=Clone');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(response);
    expect(getCharactersMock).toHaveBeenCalledWith({
      name: 'rick',
      status: 'Alive',
      type: 'Clone',
      page: 2,
    });
  });

  it('defaults to page 1', async () => {
    getCharactersMock.mockResolvedValueOnce(response);

    await get('');

    expect(getCharactersMock).toHaveBeenCalledWith({ page: 1 });
  });

  it('lets the browser cache successful responses privately', async () => {
    getCharactersMock.mockResolvedValueOnce(response);

    const res = await get('?page=1');

    expect(res.headers.get('cache-control')).toBe('private, max-age=300');
  });

  it.each(['0', '-1', '1.5', 'abc'])('rejects page=%s with 400', async (page) => {
    const res = await get(`?page=${page}`);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(getCharactersMock).not.toHaveBeenCalled();
  });

  it('passes API errors through without caching them', async () => {
    getCharactersMock.mockRejectedValueOnce(
      new ApiRequestError(502, { error: 'upstream_error', message: 'Upstream failed' }),
    );

    const res = await get('?page=1');

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'upstream_error', message: 'Upstream failed' });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('turns unexpected errors into a 500 without leaking details', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getCharactersMock.mockRejectedValueOnce(new Error('secret detail'));

    const res = await get('?page=1');

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('internal_error');
    expect(body.message).not.toContain('secret');
  });
});
