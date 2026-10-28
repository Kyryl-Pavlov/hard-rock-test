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

// A character's origin or last known location with its details. `id` is null, and `type` and
// `dimension` are empty, when the API doesn't know the place.
export interface LocationSummary extends LocationRef {
  type: string;
  dimension: string;
}

// Everything the API knows about one character.
export interface CharacterDetail extends Character {
  origin: LocationSummary;
  location: LocationSummary;
  // Every episode the character appears in, in air order. Singular, like the schema's field.
  episode: Episode[];
  // When the character was added to the API (ISO 8601).
  created: string;
}

export interface Location {
  id: string;
  name: string;
  type: string;
  dimension: string;
}
