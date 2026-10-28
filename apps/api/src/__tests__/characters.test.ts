import request from 'supertest';
import { createApp } from '../app';
import { signToken } from '../auth/jwt';

const token = signToken({ sub: 'test-user', scope: ['characters:read'] });

const rick = {
  id: '1',
  name: 'Rick Sanchez',
  status: 'Alive',
  species: 'Human',
  type: '',
  gender: 'Male',
  image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
  origin: { id: '1', name: 'Earth (C-137)' },
  location: { id: '3', name: 'Citadel of Ricks' },
};

function graphqlResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function getCharacters(query = '') {
  return request(createApp()).get(`/characters${query}`).set('Authorization', `Bearer ${token}`);
}

describe('GET /characters', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns mapped characters', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      graphqlResponse({
        data: {
          characters: { info: { count: 826, pages: 42, next: 2, prev: null }, results: [rick] },
        },
      }),
    );

    const res = await getCharacters('?page=1&name=rick&status=Alive');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      info: { count: 826, pages: 42, next: 2, prev: null },
      results: [rick],
    });
    const init = fetchSpy.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body)).variables).toEqual({
      page: 1,
      filter: { name: 'rick', status: 'Alive' },
    });
  });

  it('returns an empty page when nothing matches', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      graphqlResponse({
        data: {
          characters: { info: { count: null, pages: null, next: null, prev: null }, results: [] },
        },
      }),
    );

    const res = await getCharacters('?name=nobody');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      info: { count: 0, pages: 0, next: null, prev: null },
      results: [],
    });
  });

  it('forwards the type filter to the upstream query', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      graphqlResponse({
        data: {
          characters: { info: { count: 1, pages: 1, next: null, prev: null }, results: [rick] },
        },
      }),
    );

    const res = await getCharacters('?type=Parasite&gender=Male&species=Human');

    expect(res.status).toBe(200);
    const init = fetchSpy.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body)).variables.filter).toEqual({
      species: 'Human',
      type: 'Parasite',
      gender: 'Male',
    });
  });

  it('rejects an empty type with 400', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    const res = await getCharacters('?type=');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects invalid query params with 400', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    const res = await getCharacters('?page=0&status=Zombie');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns 401 without a token', async () => {
    const res = await request(createApp()).get('/characters');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(createApp())
      .get('/characters')
      .set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns 403 when the token lacks the scope', async () => {
    const res = await request(createApp())
      .get('/characters')
      .set('Authorization', `Bearer ${signToken({ sub: 'test-user', scope: [] })}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden');
  });

  it('returns 502 when the upstream returns GraphQL errors', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(graphqlResponse({ errors: [{ message: 'boom' }], data: null }));

    const res = await getCharacters();

    expect(res.status).toBe(502);
    expect(res.body.error).toBe('upstream_error');
  });

  it('returns 502 when the upstream responds with a non-2xx status', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(graphqlResponse({}, 500));

    const res = await getCharacters();

    expect(res.status).toBe(502);
    expect(res.body.error).toBe('upstream_error');
  });

  it('returns 504 when the upstream times out', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'));

    const res = await getCharacters();

    expect(res.status).toBe(504);
    expect(res.body.error).toBe('upstream_timeout');
  });
});
