'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { characterPath } from '@/lib/character-profile';
import { useExplorerStore } from '@/store/explorer-store';

// How long the pointer or focus has to rest on a card before its profile is prefetched, so
// sweeping across the grid doesn't load every card it passes.
const PREFETCH_INTENT_MS = 120;

// The card's link to the profile page. Stretched over the whole card (the card must be
// `relative`), while its accessible name stays the character's name. Resting on the card prefetches
// the profile into the explorer store, so the profile page can render it as soon as it opens.
export function CharacterProfileLink({ id, children }: { id: string; children: ReactNode }) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function schedulePrefetch() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void useExplorerStore.getState().prefetchProfile(id);
    }, PREFETCH_INTENT_MS);
  }

  function cancelPrefetch() {
    clearTimeout(timer.current);
  }

  return (
    <Link
      href={characterPath(id)}
      // Only called for in-app navigations, not for a link opened in a new tab.
      onNavigate={() => {
        useExplorerStore
          .getState()
          .openProfile(id, `${window.location.pathname}${window.location.search}`);
      }}
      onPointerEnter={schedulePrefetch}
      onPointerLeave={cancelPrefetch}
      onFocus={schedulePrefetch}
      onBlur={cancelPrefetch}
      className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}
