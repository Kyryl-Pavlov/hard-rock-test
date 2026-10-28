/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import type { CharacterDetail } from '@rme/shared';
import { GET } from '@/app/api/characters/[id]/route';
import { ApiRequestError } from '@/lib/api-client';
import { getCharacter } from '@/lib/characters';

// The real data layer is server-only and reads cookies.
jest.mock('@/lib/characters', () => ({ getCharacter: jest.fn() }));

const getCharacterMock = jest.mocked(getCharacter);

const rick: CharacterDetail = {
  id: '1',
  name: 'Rick Sanchez',
  status: 'Alive',
  species: 'Human',
  type: '',
  gender: 'Male',
  image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
  origin: { id: '1', name: 'Earth (C-137)', type: 'Planet', dimension: 'Dimension C-137' },
  location: { id: '3', name: 'Citadel of Ricks', type: 'Space station', dimension: 'unknown' },
  episode: [{ id: '1', name: 'Pilot', airDate: 'December 2, 2013', episode: 'S01E01' }],
  created: '2017-11-04T18:48:46.250Z',
};

function get(id: string) {
  return GET(new NextRequest(`http://localhost:3000/api/characters/${id}`), {
    params: Promise.resolve({ id }),
  });
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('GET /api/characters/[id]', () => {
  it('returns the profile from the data layer', async () => {
    getCharacterMock.mockResolvedValueOnce(rick);

    const res = await get('1');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(rick);
    expect(getCharacterMock).toHaveBeenCalledWith('1');
  });

  it('lets the browser cache successful responses privately', async () => {
    getCharacterMock.mockResolvedValueOnce(rick);

    const res = await get('1');

    expect(res.headers.get('cache-control')).toBe('private, max-age=300');
  });

  it.each(['0', '-1', '1.5', 'abc'])('rejects id %s with 400', async (id) => {
    const res = await get(id);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(getCharacterMock).not.toHaveBeenCalled();
  });

  it('returns 404 without caching it when no character has the id', async () => {
    getCharacterMock.mockResolvedValueOnce(null);

    const res = await get('999999');

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('not_found');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('passes API errors through without caching them', async () => {
    getCharacterMock.mockRejectedValueOnce(
      new ApiRequestError(502, { error: 'upstream_error', message: 'Upstream failed' }),
    );

    const res = await get('1');

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'upstream_error', message: 'Upstream failed' });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('turns unexpected errors into a 500 without leaking details', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getCharacterMock.mockRejectedValueOnce(new Error('secret detail'));

    const res = await get('1');

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('internal_error');
    expect(body.message).not.toContain('secret');
  });
});
