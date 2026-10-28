import { NextResponse, type NextRequest } from 'next/server';
import type { ApiError, CharactersResponse } from '@rme/shared';
import { ApiRequestError } from '@/lib/api-client';
import { parseFilters } from '@/lib/character-filters';
import { getCharacters } from '@/lib/characters';

// Browser-cacheable: the data is token-gated, so only the user's own browser may store it.
const CACHE_CONTROL = 'private, max-age=300';

// Character pages for the client-side list. It's a GET (unlike a Server Action's POST) so the
// browser's HTTP cache can answer repeat queries. The browser still never calls the API directly.
export async function GET(
  request: NextRequest,
): Promise<NextResponse<CharactersResponse | ApiError>> {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? '1');
  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'page must be a positive integer' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const data = await getCharacters({ ...parseFilters(searchParams), page });
    return NextResponse.json(data, { headers: { 'Cache-Control': CACHE_CONTROL } });
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return NextResponse.json(err.body, {
        status: err.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    console.error('Could not load characters', err);
    return NextResponse.json(
      { error: 'internal_error', message: 'Could not load characters' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
