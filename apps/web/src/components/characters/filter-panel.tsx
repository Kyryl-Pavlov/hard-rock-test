import type { ReactNode } from 'react';

// Persistent filter side panel for large screens; below `lg` the FilterDrawer takes over.
export function FilterPanel({ children }: { children: ReactNode }) {
  return (
    <aside
      aria-label="Filters"
      // top-18 (the compact header's h-14 plus 16px) lines up with the sticky search bar; on short
      // screens the panel scrolls on its own.
      className="hidden rounded-2xl border border-outline-variant bg-surface-container-low p-5 lg:sticky lg:top-18 lg:block lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain"
    >
      <h2 className="mb-5 font-headline text-base font-semibold text-on-surface">Filters</h2>
      {children}
    </aside>
  );
}
