import Image from 'next/image';
import { Suspense } from 'react';
import { CharacterExplorerSkeleton } from '@/components/characters/character-explorer-skeleton';
import { CharacterGrid } from '@/components/characters/character-grid';
import { CompactHeader } from '@/components/layout/compact-header';

export default function Home({ searchParams }: PageProps<'/'>) {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-10 px-4 py-10 md:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
          Universal registry
        </p>
        {/* Shows a small logo bar at the top once the title has scrolled away */}
        <CompactHeader>
          {/* The logo's alt text keeps the heading's accessible name "Rick & Morty Explorer" */}
          <h1 className="flex flex-wrap items-center gap-x-3 font-headline text-[28px]/9 font-bold tracking-[-0.02em] text-on-surface lg:text-[40px]/12">
            <Image
              src="/rick-and-morty-logo.webp"
              alt="Rick & Morty"
              width={261}
              height={80}
              loading="eager"
              className="h-14 w-auto lg:h-20"
            />{' '}
            <span>Explorer</span>
          </h1>
        </CompactHeader>
        <p className="max-w-xl text-sm/[22px] text-on-surface-variant">
          Characters indexed across the multiverse.
        </p>
      </header>

      <section aria-label="Characters">
        {/* The grid reads the URL filters and the session cookie, so it streams in behind the
            static shell */}
        <Suspense fallback={<CharacterExplorerSkeleton />}>
          <CharacterGrid searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}
