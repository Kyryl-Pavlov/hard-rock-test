import type { Character, CharacterDetail } from '@rme/shared';
import { CharacterImage } from '@/components/characters/character-image';
import { CharacterImageFallback } from '@/components/characters/character-image-fallback';
import { StatusBadge } from '@/components/characters/status-badge';
import { formatIndexedDate } from '@/lib/character-profile';
import { SkeletonLine } from './skeleton-line';

// The portrait card at the top of the profile. `character` is null while nothing is known yet, and
// `detail` is null until the full profile has loaded; their parts show placeholders until then.
export function ProfileHero({
  character,
  detail,
}: {
  character: Character | null;
  detail: CharacterDetail | null;
}) {
  const indexed = detail ? formatIndexedDate(detail.created) : null;

  return (
    <section
      aria-label="Overview"
      className="flex flex-col items-center gap-5 rounded-2xl border border-outline-variant bg-surface-container p-5 text-center md:p-6"
    >
      <div className="flex w-full items-center justify-between gap-2">
        {character ? (
          <StatusBadge status={character.status} />
        ) : (
          <SkeletonLine className="h-5 w-16 rounded-full" />
        )}
        {character ? (
          <span className="rounded-lg bg-surface-container-lowest/90 px-2 py-0.5 font-mono text-[11px] text-on-surface-variant">
            #{character.id.padStart(3, '0')}
          </span>
        ) : (
          <SkeletonLine className="h-5 w-10" />
        )}
      </div>

      <div className="relative size-48 shrink-0 overflow-hidden rounded-full border border-primary/30 bg-surface-container-high ring-4 ring-primary/10 lg:size-56">
        {character ? (
          <CharacterImage
            src={character.image}
            alt={character.name}
            sizes="224px"
            loading="eager"
          />
        ) : (
          <CharacterImageFallback />
        )}
      </div>

      <div className="flex w-full flex-col items-center gap-2">
        {character ? (
          <h1 className="font-headline text-[28px]/9 font-bold tracking-[-0.02em] text-on-surface lg:text-[40px]/12">
            {character.name}
          </h1>
        ) : (
          <div className="flex h-9 items-center lg:h-12">
            <SkeletonLine className="h-6 w-48 lg:h-8" />
          </div>
        )}
        {character ? (
          <p className="text-sm/[22px] text-on-surface-variant">
            {character.species} · {character.gender}
          </p>
        ) : (
          <div className="flex h-5.5 items-center">
            <SkeletonLine className="h-3 w-32" />
          </div>
        )}
        {character?.type ? (
          <span className="rounded-full border border-tertiary/20 bg-tertiary/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-tertiary uppercase">
            {character.type}
          </span>
        ) : null}
      </div>

      {detail ? (
        indexed ? (
          <p className="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
            Indexed {indexed}
          </p>
        ) : null
      ) : (
        <div className="flex h-4 items-center">
          <SkeletonLine className="h-2.5 w-28" />
        </div>
      )}
    </section>
  );
}
