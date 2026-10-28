import { NextResponse, type NextRequest } from 'next/server';
import type { ApiError, CharacterResponse } from '@rme/shared';
import { ApiRequestError } from '@/lib/api-client';
import { isCharacterId } from '@/lib/character-profile';
import { getCharacter } from '@/lib/characters';

// Browser-cacheable: the data is token-gated, so only the user's own browser may store it.
const CACHE_CONTROL = 'private, max-age=300';

// One character's full profile, for prefetching into the explorer store when a card is hovered or
// focused. Like /api/characters, it's a GET so the browser's HTTP cache can answer repeat requests.
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/characters/[id]'>,
): Promise<NextResponse<CharacterResponse | ApiError>> {
  const { id } = await ctx.params;
  if (!isCharacterId(id)) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'id must be a positive integer' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const character = await getCharacter(id);
    if (!character) {
      return NextResponse.json(
        { error: 'not_found', message: `Character ${id} not found` },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.json(character, { headers: { 'Cache-Control': CACHE_CONTROL } });
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return NextResponse.json(err.body, {
        status: err.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    console.error('Could not load character', err);
    return NextResponse.json(
      { error: 'internal_error', message: 'Could not load character' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
