import type { CharacterFilters, CharactersResponse, TokenResponse } from '@rme/shared';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// TODO: request an access token from POST /auth/token.
export async function getToken(): Promise<TokenResponse> {
  throw new Error('Not implemented');
}

// TODO: call GET /characters with the bearer token and filters as query params.
export async function searchCharacters(
  _token: string,
  _filters: CharacterFilters,
): Promise<CharactersResponse> {
  throw new Error('Not implemented');
}
