'use client';

import { useEffect } from 'react';
import type { CharacterDetail } from '@rme/shared';
import { rehydrateExplorerStore, useExplorerStore } from '@/store/explorer-store';

// Saves the server-rendered profile in the explorer store, so the next visit can show it at once.
// Renders nothing.
export function ProfileCacheSeed({ character }: { character: CharacterDetail }) {
  useEffect(() => {
    let cancelled = false;
    // Restore the sessionStorage cache first, so the write doesn't replace profiles saved earlier.
    void rehydrateExplorerStore().then(() => {
      if (!cancelled) useExplorerStore.getState().cacheProfile(character);
    });
    return () => {
      cancelled = true;
    };
  }, [character]);

  return null;
}
