import type { ApiError, CharacterFilters, CharactersResponse, TokenResponse } from '@rme/shared';

// Server-side only: used by src/proxy.ts and the data layer in src/lib. The browser never calls
// the API, so API_URL is a server env var, not NEXT_PUBLIC_*. Don't import this from a client
// component.
export const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError,
  ) {
    super(body.message);
    this.name = 'ApiRequestError';
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T;

  const body = (await res.json().catch(() => null)) as ApiError | null;
  throw new ApiRequestError(
    res.status,
    body ?? { error: 'http_error', message: `API responded with ${res.status}` },
  );
}

export async function requestToken(): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/token`, { method: 'POST', cache: 'no-store' });
  return parseResponse<TokenResponse>(res);
}

export async function searchCharacters(
  token: string,
  filters: CharacterFilters,
): Promise<CharactersResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const query = params.size > 0 ? `?${params}` : '';

  const res = await fetch(`${API_URL}/characters${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return parseResponse<CharactersResponse>(res);
}
