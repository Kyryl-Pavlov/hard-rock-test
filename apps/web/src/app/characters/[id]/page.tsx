import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CachedCharacterProfile } from '@/components/character-profile/cached-character-profile';
import { CharacterProfileSection } from '@/components/character-profile/character-profile-section';
import { CharacterProfileSkeleton } from '@/components/character-profile/character-profile-skeleton';
import { isCharacterId } from '@/lib/character-profile';
import { getCachedCharacter } from '@/lib/characters';

export async function generateMetadata({
  params,
}: PageProps<'/characters/[id]'>): Promise<Metadata> {
  const { id } = await params;
  try {
    // Shares the page's request-scoped cache entry, so this adds no API call.
    const character = isCharacterId(id) ? await getCachedCharacter(id) : null;
    return { title: character?.name ?? 'Character not found' };
  } catch {
    // The page's error boundary reports the failure; the title just stays generic.
    return { title: 'Character' };
  }
}

export default function CharacterPage({ params }: PageProps<'/characters/[id]'>) {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      {/* The static shell's fallback: useParams in the inner fallback suspends while the shell is
          prerendered, since the id is only known per request */}
      <Suspense fallback={<CharacterProfileSkeleton />}>
        {/* The profile reads the id and the session cookie, so it streams in. Meanwhile the
            fallback renders whatever the explorer store already has for this character */}
        <Suspense fallback={<CachedCharacterProfile />}>
          <CharacterProfileSection params={params} />
        </Suspense>
      </Suspense>
    </main>
  );
}
