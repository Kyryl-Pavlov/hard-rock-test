import 'server-only';
import { cacheLife } from 'next/cache';
import { cookies } from 'next/headers';
import type { CharacterDetail, CharacterFilters, CharactersResponse } from '@rme/shared';
import { ApiRequestError, fetchCharacter, requestToken, searchCharacters } from './api-client';
import { SESSION_COOKIE } from './session';

// How long the browser's router may reuse a rendered profile without asking the server again.
const PROFILE_STALE_SECONDS = 300;

// Data access for Server Components and Route Handlers. The token comes from the session cookie
// set by src/proxy.ts. Server Components can't set cookies, so when the cookie is missing or
// rejected we fetch a token for this render only and let the proxy persist one on the next request.
async function withSessionToken<T>(call: (token: string) => Promise<T>): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? (await requestToken()).accessToken;

  try {
    return await call(token);
  } catch (err) {
    if (!(err instanceof ApiRequestError && err.status === 401)) throw err;
    const fresh = await requestToken();
    return call(fresh.accessToken);
  }
}

export async function getCharacters(filters: CharacterFilters): Promise<CharactersResponse> {
  return withSessionToken((token) => searchCharacters(token, filters));
}

// Resolves to null when no character has this id.
export async function getCharacter(id: string): Promise<CharacterDetail | null> {
  try {
    return await withSessionToken((token) => fetchCharacter(token, id));
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}

// getCharacter for the profile page. The result is cached in the browser only (the client router
// reuses the rendered profile for PROFILE_STALE_SECONDS), and calls within one request share it, so
// generateMetadata and the page make a single API call. Not-found is a null, not an error, so the
// caller can call notFound() outside the cache scope.
export async function getCachedCharacter(id: string): Promise<CharacterDetail | null> {
  'use cache: private';
  cacheLife({ stale: PROFILE_STALE_SECONDS });
  return getCharacter(id);
}
