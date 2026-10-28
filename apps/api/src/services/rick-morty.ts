import type { CharacterFilters, CharactersResponse } from '@rme/shared';
import { config } from '../config';

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

// TODO: POST CHARACTERS_QUERY to config.RICK_MORTY_GRAPHQL_URL with fetch() and map the result.
export async function fetchCharacters(_filters: CharacterFilters): Promise<CharactersResponse> {
  void config.RICK_MORTY_GRAPHQL_URL;
  throw new Error('Not implemented');
}
