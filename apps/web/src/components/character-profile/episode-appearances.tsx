import type { Episode } from '@rme/shared';
import { groupEpisodesBySeason } from '@/lib/character-profile';
import { ProfileSectionHeading } from './profile-section-heading';
import { SkeletonLine } from './skeleton-line';

const PLACEHOLDER_ROWS = 6;

// Every episode the character appears in, grouped by season. `episodes` is null until the full
// profile has loaded.
export function EpisodeAppearances({ episodes }: { episodes: Episode[] | null }) {
  function renderEpisodes() {
    if (episodes === null) {
      return (
        <ol aria-hidden="true" className="flex flex-col gap-2">
          {Array.from({ length: PLACEHOLDER_ROWS }, (_, i) => (
            <li
              key={i}
              className="flex h-12 items-center gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-low px-3"
            >
              <SkeletonLine className="h-5 w-16" />
              <SkeletonLine className="h-3.5 w-1/2" />
            </li>
          ))}
        </ol>
      );
    }

    if (episodes.length === 0) {
      return <p className="text-sm text-on-surface-variant">No episode appearances recorded.</p>;
    }

    return groupEpisodesBySeason(episodes).map(({ season, episodes: list }) => (
      <div key={season} className="flex flex-col gap-2">
        <h3 className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
          <span>{season > 0 ? `Season ${season}` : 'Other'}</span>
          <span className="tabular-nums">
            {list.length} {list.length === 1 ? 'episode' : 'episodes'}
          </span>
        </h3>
        <ol className="flex flex-col gap-2">
          {list.map((episode) => (
            <li
              key={episode.id}
              className="flex min-h-12 items-center gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2"
            >
              <span className="shrink-0 rounded-lg border border-tertiary/20 bg-tertiary/10 px-2 py-0.5 font-mono text-[11px] text-tertiary">
                {episode.episode}
              </span>
              <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <p className="truncate text-sm font-medium text-on-surface">{episode.name}</p>
                <p className="shrink-0 text-xs text-on-surface-variant tabular-nums">
                  {episode.airDate}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    ));
  }

  return (
    <section
      aria-labelledby="profile-episodes"
      className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container p-5 md:p-6"
    >
      <ProfileSectionHeading
        id="profile-episodes"
        aside={episodes ? `${episodes.length} logged` : undefined}
      >
        Episodes
      </ProfileSectionHeading>
      {/* Long lists (Rick has 51 episodes) scroll inside the panel. Focusable so keyboard users
          can scroll it too. */}
      <div
        role="region"
        tabIndex={0}
        aria-label="Episode list"
        className="-mr-2 flex max-h-[500px] flex-col gap-4 overflow-y-auto rounded-lg pr-2 focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none"
      >
        {renderEpisodes()}
      </div>
    </section>
  );
}
