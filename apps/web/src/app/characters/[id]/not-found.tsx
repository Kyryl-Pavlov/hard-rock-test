import Link from 'next/link';
import { CharactersCrumbLink } from '@/components/character-profile/characters-crumb-link';
import { BreadcrumbItem } from '@/components/layout/breadcrumb-item';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

export default function CharacterNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      <Breadcrumbs>
        <BreadcrumbItem>
          <CharactersCrumbLink />
        </BreadcrumbItem>
        <BreadcrumbItem current>Not found</BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex flex-1 items-center justify-center py-16">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container p-8 text-center">
          <h1 className="font-headline text-xl font-semibold text-on-surface">
            Character not found
          </h1>
          <p className="text-sm/[22px] text-on-surface-variant">
            No one in the registry has this ID. They may exist in another dimension.
          </p>
          <Link
            href="/"
            className="flex h-11 items-center rounded-lg border border-transparent bg-primary-container px-4 font-semibold text-on-primary-container hover:bg-primary-container/90 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none md:h-10"
          >
            Browse characters
          </Link>
        </div>
      </div>
    </main>
  );
}
