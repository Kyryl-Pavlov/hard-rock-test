import { API_URL, ApiRequestError, requestToken, searchCharacters } from '@/lib/api-client';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('api-client', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it('requests a token with POST /auth/token', async () => {
    const token = { accessToken: 'jwt', tokenType: 'Bearer', expiresIn: '1h' };
    fetchMock.mockResolvedValue(jsonResponse(token, 201));

    await expect(requestToken()).resolves.toEqual(token);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/auth/token`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends filters as query params and the token as a bearer header', async () => {
    const body = { info: { count: 0, pages: 0, next: null, prev: null }, results: [] };
    fetchMock.mockResolvedValue(jsonResponse(body));

    await expect(
      searchCharacters('jwt', { page: 2, name: 'rick', status: undefined }),
    ).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/characters?page=2&name=rick`,
      expect.objectContaining({ headers: { Authorization: 'Bearer jwt' } }),
    );
  });

  it('throws an ApiRequestError carrying the ApiError body', async () => {
    const error = { error: 'unauthorized', message: 'Invalid or expired token' };
    fetchMock.mockResolvedValue(jsonResponse(error, 401));

    const promise = searchCharacters('expired', {});
    await expect(promise).rejects.toBeInstanceOf(ApiRequestError);
    await expect(promise).rejects.toMatchObject({ status: 401, body: error });
  });
});
