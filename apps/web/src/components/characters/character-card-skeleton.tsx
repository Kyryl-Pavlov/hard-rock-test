import { CharacterImageFallback } from './character-image-fallback';

// Mirrors CharacterCard element for element, with each placeholder sized to the line height of the
// text it stands in for, so swapping a skeleton for a real card doesn't shift the grid.
export function CharacterCardSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="flex h-full animate-pulse flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container"
    >
      <div className="relative h-56 w-full overflow-hidden bg-surface-container-high">
        <CharacterImageFallback />
        <div className="absolute top-3 left-3 h-5 w-16 rounded-full bg-surface-container-lowest/80" />
        <div className="absolute top-3 right-3 h-5 w-10 rounded-lg bg-surface-container-lowest/90" />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-1">
          {/* Name: text-base, 24px line */}
          <div className="flex h-6 items-center">
            <div className="h-4 w-2/3 rounded-lg bg-surface-container-high" />
          </div>
          {/* Species · gender: 18px line */}
          <div className="flex h-4.5 items-center">
            <div className="h-3 w-1/2 rounded-lg bg-surface-container-high" />
          </div>
        </div>

        {/* Origin and last location rows, hidden in the compact mobile grid like the card's */}
        <div className="mt-auto hidden flex-col gap-1.5 sm:flex">
          <MetaRowSkeleton />
          <MetaRowSkeleton />
        </div>
      </div>
    </li>
  );
}

function MetaRowSkeleton() {
  return (
    <div className="flex h-6.5 items-center justify-between gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low px-2.5 py-1">
      <div className="h-2.5 w-12 rounded-lg bg-surface-container-high" />
      <div className="h-3 w-20 rounded-lg bg-surface-container-high" />
    </div>
  );
}
