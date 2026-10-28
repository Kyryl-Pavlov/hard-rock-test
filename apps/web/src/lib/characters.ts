import 'server-only';
import { cookies } from 'next/headers';
import type { CharacterFilters, CharactersResponse } from '@rme/shared';
import { ApiRequestError, requestToken, searchCharacters } from './api-client';
import { SESSION_COOKIE } from './session';

// Data access for Server Components. The token comes from the session cookie set by src/proxy.ts.
// Server Components can't set cookies, so when the cookie is missing or rejected we fetch a token
// for this render only and let the proxy persist one on the next request.
export async function getCharacters(filters: CharacterFilters): Promise<CharactersResponse> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? (await requestToken()).accessToken;

  try {
    return await searchCharacters(token, filters);
  } catch (err) {
    if (!(err instanceof ApiRequestError && err.status === 401)) throw err;
    const fresh = await requestToken();
    return searchCharacters(fresh.accessToken, filters);
  }
}
