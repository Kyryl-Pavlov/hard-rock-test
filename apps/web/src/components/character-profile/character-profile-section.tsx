import { notFound } from 'next/navigation';
import { isCharacterId } from '@/lib/character-profile';
import { getCachedCharacter } from '@/lib/characters';
import { CharacterProfile } from './character-profile';
import { ProfileCacheSeed } from './profile-cache-seed';

interface CharacterProfileSectionProps {
  params: PageProps<'/characters/[id]'>['params'];
}

// Server-renders the profile for the id in the URL, and hands it to the explorer store.
export async function CharacterProfileSection({ params }: CharacterProfileSectionProps) {
  const { id } = await params;
  if (!isCharacterId(id)) notFound();

  const character = await getCachedCharacter(id);
  if (!character) notFound();

  return (
    <>
      <CharacterProfile character={character} />
      <ProfileCacheSeed character={character} />
    </>
  );
}
