import type { CharacterFilters, CharacterGender, CharacterStatus } from '@rme/shared';

// Filter options and URL (de)serialisation shared by the server (page props, Route Handler) and
// the client (filter controls, store). Keep it free of server-only and browser-only imports.

export const STATUS_OPTIONS: readonly CharacterStatus[] = ['Alive', 'Dead', 'unknown'];

export const GENDER_OPTIONS: readonly CharacterGender[] = [
  'Female',
  'Male',
  'Genderless',
  'unknown',
];

// The upstream API has no endpoint listing species, so these are its canonical values.
export const SPECIES_OPTIONS: readonly string[] = [
  'Human',
  'Alien',
  'Humanoid',
  'Robot',
  'Cronenberg',
  'Mythological Creature',
  'Animal',
  'Disease',
  'Poopybutthole',
  'unknown',
];

// Fixed order, so the same filters always produce the same URL and cache key.
const FILTER_KEYS = ['name', 'status', 'species', 'type', 'gender'] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

type SearchParamsInput = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(params: SearchParamsInput, key: string): string | undefined {
  const raw = params instanceof URLSearchParams ? params.get(key) : params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function pick<T extends string>(options: readonly T[], value: string | undefined): T | undefined {
  return options.find((option) => option === value);
}

// Turns untrusted URL params into filters: trims text, drops empty values and unknown enum values.
// `page` is ignored; pagination is not part of a filter set.
export function parseFilters(params: SearchParamsInput): CharacterFilters {
  const filters: CharacterFilters = {
    name: readParam(params, 'name'),
    status: pick(STATUS_OPTIONS, readParam(params, 'status')),
    species: readParam(params, 'species'),
    type: readParam(params, 'type'),
    gender: pick(GENDER_OPTIONS, readParam(params, 'gender')),
  };
  return normalizeFilters(filters);
}

// Drops unset and blank values and the page, so equal filter sets compare equal.
export function normalizeFilters(filters: CharacterFilters): CharacterFilters {
  const normalized: CharacterFilters = {};
  for (const key of FILTER_KEYS) {
    const value = filters[key]?.trim();
    if (value) (normalized as Record<FilterKey, string>)[key] = value;
  }
  return normalized;
}

export function filtersToSearchParams(filters: CharacterFilters): URLSearchParams {
  const params = new URLSearchParams();
  const normalized = normalizeFilters(filters);
  for (const key of FILTER_KEYS) {
    const value = normalized[key];
    if (value) params.set(key, value);
  }
  return params;
}

// Stable cache key for a filter set; '' means "no filters".
export function filtersKey(filters: CharacterFilters): string {
  return filtersToSearchParams(filters).toString();
}

// Number of active filters, for the "Filters (n)" button. The name search has its own input.
export function countActiveFilters(filters: CharacterFilters): number {
  const { name: _name, ...rest } = normalizeFilters(filters);
  return Object.keys(rest).length;
}
