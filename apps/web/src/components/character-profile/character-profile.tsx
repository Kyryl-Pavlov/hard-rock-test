import type { Character, CharacterDetail } from '@rme/shared';
import { BreadcrumbItem } from '@/components/layout/breadcrumb-item';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { AppearanceStats } from './appearance-stats';
import { CharactersCrumbLink } from './characters-crumb-link';
import { EpisodeAppearances } from './episode-appearances';
import { ProfileHero } from './profile-hero';
import { RegistryFacts } from './registry-facts';
import { SkeletonLine } from './skeleton-line';

// The character profile. The server renders it with the full CharacterDetail. While that streams
// in, the client renders it from the explorer store: with a cached profile, or with a list
// Character (the parts only the full profile has show placeholders), or with null (all
// placeholders, the skeleton).
export function CharacterProfile({ character }: { character: Character | CharacterDetail | null }) {
  const detail = character && 'episode' in character ? character : null;

  return (
    <div aria-busy={detail ? undefined : true} className="flex flex-col gap-6">
      <Breadcrumbs>
        <BreadcrumbItem>
          <CharactersCrumbLink />
        </BreadcrumbItem>
        <BreadcrumbItem current>
          {character ? character.name : <SkeletonLine className="h-3 w-24" />}
        </BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <ProfileHero character={character} detail={detail} />
          <AppearanceStats episodes={detail?.episode ?? null} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <RegistryFacts character={character} detail={detail} />
          <EpisodeAppearances episodes={detail?.episode ?? null} />
        </div>
      </div>
    </div>
  );
}
