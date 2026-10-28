import { CharacterGridSkeleton } from './character-grid-skeleton';

// Same shape as CharacterExplorer (side panel on lg, toolbar, grid), so streaming it in doesn't
// shift the page.
export function CharacterExplorerSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-8"
    >
      <div className="hidden h-[34rem] animate-pulse rounded-2xl border border-outline-variant bg-surface-container-low lg:block" />

      <div className="flex min-w-0 flex-col gap-6">
        {/* Same box as the explorer's sticky toolbar band */}
        <div className="-mx-4 flex items-center gap-3 border-b border-outline-variant/60 px-4 py-3 md:-mx-6 md:px-6 lg:mx-0 lg:rounded-2xl lg:border lg:p-3">
          <div className="h-11 flex-1 animate-pulse rounded-lg border border-outline-variant bg-surface-container" />
          <div className="size-11 shrink-0 animate-pulse rounded-lg border border-outline-variant bg-surface-container lg:hidden" />
        </div>
        <CharacterGridSkeleton />
      </div>
    </div>
  );
}
