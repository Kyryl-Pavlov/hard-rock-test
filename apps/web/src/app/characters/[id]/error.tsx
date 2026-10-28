'use client';

import { CharactersCrumbLink } from '@/components/character-profile/characters-crumb-link';
import { BreadcrumbItem } from '@/components/layout/breadcrumb-item';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

export default function CharacterError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      <Breadcrumbs>
        <BreadcrumbItem>
          <CharactersCrumbLink />
        </BreadcrumbItem>
        <BreadcrumbItem current>Unavailable</BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex flex-1 items-center justify-center py-16">
        <div
          role="alert"
          className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container p-8 text-center"
        >
          <h1 className="font-headline text-xl font-semibold text-on-surface">Signal lost</h1>
          <p className="text-sm/[22px] text-on-surface-variant">
            We couldn&apos;t reach this character&apos;s file. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            className="h-11 rounded-lg border border-transparent bg-primary-container px-4 font-semibold text-on-primary-container hover:bg-primary-container/90 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none md:h-10"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
