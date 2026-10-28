import type { ReactNode } from 'react';
import type { Character, CharacterDetail, LocationSummary } from '@rme/shared';
import { StatusBadge } from '@/components/characters/status-badge';
import { describePlace } from '@/lib/character-profile';
import { ProfileSectionHeading } from './profile-section-heading';
import { SkeletonLine } from './skeleton-line';

// Every registry field of the character. `character` is null while nothing is known yet, and
// `detail` is null until the full profile (with the places' type and dimension) has loaded.
export function RegistryFacts({
  character,
  detail,
}: {
  character: Character | null;
  detail: CharacterDetail | null;
}) {
  return (
    <section
      aria-labelledby="profile-registry"
      className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container p-5 md:p-6"
    >
      <ProfileSectionHeading id="profile-registry">Registry</ProfileSectionHeading>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Fact
          label="Origin"
          value={character?.origin.name ?? null}
          note={placeNote(detail?.origin)}
        />
        <Fact
          label="Last known location"
          value={character?.location.name ?? null}
          note={placeNote(detail?.location)}
        />
        <Fact label="Species" value={character?.species ?? null} />
        <Fact label="Type" value={character ? character.type || 'None recorded' : null} />
        <Fact label="Gender" value={character?.gender ?? null} />
        <Fact label="Status" value={character ? <StatusBadge status={character.status} /> : null} />
      </dl>
    </section>
  );
}

// The place's type and dimension, or null until the full profile has loaded.
function placeNote(place: LocationSummary | undefined): string | null {
  return place ? describePlace(place) : null;
}

// `value` and `note` show placeholders while null. A fact without a note leaves it out.
function Fact({ label, value, note }: { label: string; value: ReactNode; note?: string | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-outline-variant/60 bg-surface-container-low p-3 md:p-4">
      <dt className="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
        {label}
      </dt>
      <dd className="flex min-h-5 items-center text-sm/5 font-semibold text-on-surface">
        {value === null ? <SkeletonLine className="h-3.5 w-32" /> : value}
      </dd>
      {note === undefined ? null : (
        <dd className="flex min-h-4.5 items-center text-xs/[18px] text-on-surface-variant">
          {note === null ? <SkeletonLine className="h-3 w-40" /> : note}
        </dd>
      )}
    </div>
  );
}
