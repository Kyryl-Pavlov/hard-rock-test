// Contract between apps/web and apps/api.

import type { Character, CharacterDetail, CharacterGender, CharacterStatus } from './rick-morty';

export interface PageInfo {
  count: number;
  pages: number;
  next: number | null;
  prev: number | null;
}

export interface Paginated<T> {
  info: PageInfo;
  results: T[];
}

export interface CharacterFilters {
  name?: string;
  status?: CharacterStatus;
  species?: string;
  type?: string;
  gender?: CharacterGender;
  page?: number;
}

export type CharactersResponse = Paginated<Character>;

export type CharacterResponse = CharacterDetail;

export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface JwtPayload {
  sub: string;
  scope: string[];
}

export interface ApiError {
  error: string;
  message: string;
}
