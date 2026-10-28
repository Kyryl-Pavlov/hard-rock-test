import type { ApiError, CharacterFilters, CharactersResponse } from '@rme/shared';
import { filtersToSearchParams } from './character-filters';

// Browser-side fetcher for the /api/characters Route Handler (same origin, never the API itself).
// The default cache mode lets the browser's HTTP cache answer within the route's max-age.
export async function fetchCharacterPage(
  filters: CharacterFilters,
  page: number,
): Promise<CharactersResponse> {
  const params = filtersToSearchParams(filters);
  params.set('page', String(page));

  const res = await fetch(`/api/characters?${params}`);
  if (res.ok) return (await res.json()) as CharactersResponse;

  const body = (await res.json().catch(() => null)) as ApiError | null;
  throw new Error(body?.message ?? `Request failed with ${res.status}`);
}
