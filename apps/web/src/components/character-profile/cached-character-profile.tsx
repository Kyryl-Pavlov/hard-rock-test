'use client';

import { useParams } from 'next/navigation';
import { selectCachedCharacter, useExplorerStore } from '@/store/explorer-store';
import { CharacterProfile } from './character-profile';

// Fallback while the server renders the profile. On a client navigation the store is already
// loaded, so this shows the profile cached or prefetched earlier, or the list card's data, right
// away. On a page load the store is still empty (on the server and the client alike), so it's the
// skeleton.
export function CachedCharacterProfile() {
  const { id } = useParams<{ id: string }>();
  const character = useExplorerStore(selectCachedCharacter(id));

  return <CharacterProfile character={character} />;
}
