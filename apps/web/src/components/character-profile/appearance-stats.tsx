import type { Episode } from '@rme/shared';
import { describeSeasons, groupEpisodesBySeason } from '@/lib/character-profile';
import { ProfileSectionHeading } from './profile-section-heading';
import { SkeletonLine } from './skeleton-line';

// Stat tiles derived from the character's episodes. `episodes` is null until the full profile has
// loaded.
export function AppearanceStats({ episodes }: { episodes: Episode[] | null }) {
  const seasons = episodes
    ? groupEpisodesBySeason(episodes)
        .map((group) => group.season)
        .filter((season) => season > 0)
    : [];
  const first = episodes?.[0];
  const last = episodes?.at(-1);

  return (
    <section
      aria-labelledby="profile-appearances"
      className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container p-5 md:p-6"
    >
      <ProfileSectionHeading id="profile-appearances">Appearances</ProfileSectionHeading>
      <dl className="grid grid-cols-2 gap-3">
        <StatTile
          label="Episodes"
          value={episodes ? String(episodes.length) : null}
          caption={episodes ? 'Episode appearances' : null}
        />
        <StatTile
          label="Seasons"
          value={episodes ? String(seasons.length) : null}
          caption={episodes ? describeSeasons(seasons) : null}
        />
        <StatTile
          label="First seen"
          code
          value={episodes ? (first?.episode ?? '—') : null}
          caption={episodes ? (first?.name ?? '') : null}
        />
        <StatTile
          label="Last seen"
          code
          value={episodes ? (last?.episode ?? '—') : null}
          caption={episodes ? (last?.name ?? '') : null}
        />
      </dl>
    </section>
  );
}

// `value` and `caption` are null while loading. `code` shows the value as a mono episode code.
function StatTile({
  label,
  value,
  caption,
  code = false,
}: {
  label: string;
  value: string | null;
  caption: string | null;
  code?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-outline-variant/60 bg-surface-container-low p-3 md:p-4">
      <dt className="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
        {label}
      </dt>
      <dd className="flex h-9 items-center">
        {value === null ? (
          <SkeletonLine className="h-6 w-14" />
        ) : (
          <span
            className={
              code
                ? 'font-mono text-xl text-tertiary'
                : 'font-headline text-[28px] font-semibold text-on-surface tabular-nums'
            }
          >
            {value}
          </span>
        )}
      </dd>
      <dd className="flex h-4.5 min-w-0 items-center text-xs text-on-surface-variant">
        {caption === null ? (
          <SkeletonLine className="h-3 w-20" />
        ) : (
          <span className="truncate" title={caption}>
            {caption}
          </span>
        )}
      </dd>
    </div>
  );
}
