import type { Episode, LocationSummary } from '@rme/shared';

// Profile helpers shared by the server (page, Route Handler) and the client (cards, store, cached
// profile). Keep it free of server-only and browser-only imports.

// Character ids are positive integers; anything else can't exist, so it's a 404 without an API call.
export function isCharacterId(id: string): boolean {
  return /^[1-9]\d*$/.test(id);
}

export function characterPath(id: string): string {
  return `/characters/${id}`;
}

export interface SeasonEpisodes {
  season: number;
  episodes: Episode[];
}

// Groups episodes by the season in their code (S01E02 → 1), keeping the API's air order. Episodes
// without a readable code go in season 0, listed last.
export function groupEpisodesBySeason(episodes: Episode[]): SeasonEpisodes[] {
  const seasons = new Map<number, Episode[]>();
  for (const episode of episodes) {
    const season = Number(/^S(\d+)E\d+$/i.exec(episode.episode)?.[1] ?? 0);
    seasons.set(season, [...(seasons.get(season) ?? []), episode]);
  }
  return [...seasons.entries()]
    .sort(([a], [b]) => (a === 0 ? 1 : b === 0 ? -1 : a - b))
    .map(([season, list]) => ({ season, episodes: list }));
}

// "Season 2", "Seasons 1–5" for a run, or "Seasons 1, 3" with gaps. Expects ascending numbers.
export function describeSeasons(seasons: number[]): string {
  if (seasons.length === 0) return 'No seasons recorded';
  if (seasons.length === 1) return `Season ${seasons[0]}`;
  const first = seasons[0] ?? 0;
  const last = seasons[seasons.length - 1] ?? 0;
  const contiguous = last - first === seasons.length - 1;
  return contiguous ? `Seasons ${first}–${last}` : `Seasons ${seasons.join(', ')}`;
}

// "Planet · Dimension C-137", or a note when the API has nothing more on the place.
export function describePlace(place: LocationSummary): string {
  const parts = [place.type, place.dimension].filter(Boolean);
  return place.id && parts.length > 0 ? parts.join(' · ') : 'No further records';
}

// Fixed locale and time zone, so the server and the browser print the same date.
const INDEXED_DATE = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });

// "Nov 4, 2017" for the API's ISO `created` timestamp, or null when it's missing or invalid.
export function formatIndexedDate(iso: string): string | null {
  const date = new Date(iso);
  return iso && !Number.isNaN(date.getTime()) ? INDEXED_DATE.format(date) : null;
}
