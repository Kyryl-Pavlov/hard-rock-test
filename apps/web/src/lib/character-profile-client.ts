import type { ApiError, CharacterResponse } from '@rme/shared';

// Browser-side fetcher for the /api/characters/[id] Route Handler (same origin, never the API
// itself). The default cache mode lets the browser's HTTP cache answer within the route's max-age.
export async function fetchCharacterProfile(id: string): Promise<CharacterResponse> {
  const res = await fetch(`/api/characters/${encodeURIComponent(id)}`);
  if (res.ok) return (await res.json()) as CharacterResponse;

  const body = (await res.json().catch(() => null)) as ApiError | null;
  throw new Error(body?.message ?? `Request failed with ${res.status}`);
}
