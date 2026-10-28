import type {
  Character,
  CharacterFilters,
  CharacterGender,
  CharactersResponse,
  CharacterStatus,
  LocationRef,
} from '@rme/shared';
import { config } from '../config';
import { UpstreamError, UpstreamTimeoutError } from './errors';

const UPSTREAM_TIMEOUT_MS = 10_000;

export const CHARACTERS_QUERY = /* GraphQL */ `
  query Characters($page: Int, $filter: FilterCharacter) {
    characters(page: $page, filter: $filter) {
      info {
        count
        pages
        next
        prev
      }
      results {
        id
        name
        status
        species
        type
        gender
        image
        origin {
          id
          name
        }
        location {
          id
          name
        }
      }
    }
  }
`;

// Upstream shapes. Every field is optional/nullable because the public API returns nulls freely.
interface UpstreamLocation {
  id?: string | null;
  name?: string | null;
}

interface UpstreamCharacter {
  id?: string | null;
  name?: string | null;
  status?: string | null;
  species?: string | null;
  type?: string | null;
  gender?: string | null;
  image?: string | null;
  origin?: UpstreamLocation | null;
  location?: UpstreamLocation | null;
}

interface UpstreamCharacters {
  info?: {
    count?: number | null;
    pages?: number | null;
    next?: number | null;
    prev?: number | null;
  } | null;
  results?: (UpstreamCharacter | null)[] | null;
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: { message?: string }[];
}

const STATUSES: readonly CharacterStatus[] = ['Alive', 'Dead', 'unknown'];
const GENDERS: readonly CharacterGender[] = ['Female', 'Male', 'Genderless', 'unknown'];

const EMPTY_CHARACTERS: CharactersResponse = {
  info: { count: 0, pages: 0, next: null, prev: null },
  results: [],
};

async function queryGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(config.RICK_MORTY_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') throw new UpstreamTimeoutError();
    throw new UpstreamError('Upstream request failed');
  }

  if (!res.ok) throw new UpstreamError(`Upstream responded with ${res.status}`);

  const body = (await res.json()) as GraphQLResponse<T>;
  if (body.errors?.length) {
    throw new UpstreamError(body.errors[0]?.message ?? 'Upstream returned GraphQL errors');
  }
  if (!body.data) throw new UpstreamError('Upstream returned no data');
  return body.data;
}

function toLocation(loc: UpstreamLocation | null | undefined): LocationRef {
  return { id: loc?.id ?? null, name: loc?.name ?? 'unknown' };
}

function toCharacter(c: UpstreamCharacter): Character | null {
  if (!c.id || !c.name) return null;
  return {
    id: c.id,
    name: c.name,
    status: STATUSES.find((s) => s === c.status) ?? 'unknown',
    species: c.species ?? '',
    type: c.type ?? '',
    gender: GENDERS.find((g) => g === c.gender) ?? 'unknown',
    image: c.image ?? '',
    origin: toLocation(c.origin),
    location: toLocation(c.location),
  };
}

export async function fetchCharacters(filters: CharacterFilters): Promise<CharactersResponse> {
  const { page, ...filter } = filters;
  const data = await queryGraphQL<{ characters?: UpstreamCharacters | null }>(CHARACTERS_QUERY, {
    page,
    filter,
  });

  const characters = data.characters;
  const results = (characters?.results ?? [])
    .map((c) => (c ? toCharacter(c) : null))
    .filter((c): c is Character => c !== null);
  if (!characters?.info || results.length === 0) return EMPTY_CHARACTERS;

  const { info } = characters;
  return {
    info: {
      count: info.count ?? 0,
      pages: info.pages ?? 0,
      next: info.next ?? null,
      prev: info.prev ?? null,
    },
    results,
  };
}
