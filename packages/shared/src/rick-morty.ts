// Domain types mirroring the public Rick & Morty GraphQL schema
// (https://rickandmortyapi.com/graphql). Extend as features are implemented.

export type CharacterStatus = 'Alive' | 'Dead' | 'unknown';

export type CharacterGender = 'Female' | 'Male' | 'Genderless' | 'unknown';

export interface LocationRef {
  id: string | null;
  name: string;
}

export interface Character {
  id: string;
  name: string;
  status: CharacterStatus;
  species: string;
  type: string;
  gender: CharacterGender;
  image: string;
  origin: LocationRef;
  location: LocationRef;
}

export interface Episode {
  id: string;
  name: string;
  airDate: string;
  episode: string;
}

export interface Location {
  id: string;
  name: string;
  type: string;
  dimension: string;
}
