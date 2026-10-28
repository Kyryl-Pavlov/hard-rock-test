import type { Character } from '@rme/shared';
import { CharacterImage } from './character-image';
import { StatusBadge } from './status-badge';

export function CharacterCard({ character }: { character: Character }) {
  const { id, name, image, status, species, gender, origin, location } = character;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container transition-colors duration-200 hover:border-primary/50">
      <div className="relative h-56 w-full overflow-hidden bg-surface-container-high">
        <CharacterImage
          src={image}
          alt={name}
          sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, 50vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-surface-container via-surface-container/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <StatusBadge status={status} />
        </div>
        <span className="absolute top-3 right-3 rounded-lg bg-surface-container-lowest/90 px-2 py-0.5 font-mono text-[11px] text-on-surface-variant">
          #{id.padStart(3, '0')}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-1">
          <h2 className="truncate font-headline text-base font-semibold tracking-tight text-on-surface group-hover:text-primary">
            {name}
          </h2>
          <p className="text-xs/[18px] text-on-surface-variant">
            {species} · {gender}
          </p>
        </div>

        {/* Hidden in the compact 2-column mobile grid */}
        <dl className="mt-auto hidden flex-col gap-1.5 text-xs sm:flex">
          <MetaRow label="Origin" value={origin.name} />
          <MetaRow label="Last loc" value={location.name} />
        </dl>
      </div>
    </article>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low px-2.5 py-1">
      <dt className="text-[11px] text-on-surface-variant">{label}:</dt>
      <dd className="truncate font-medium text-on-surface">{value}</dd>
    </div>
  );
}
