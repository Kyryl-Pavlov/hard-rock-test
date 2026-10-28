import { CharacterCardSkeleton } from './character-card-skeleton';

const PLACEHOLDER_COUNT = 8;

export function CharacterGridSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-label="Loading characters"
      className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 2xl:grid-cols-4"
    >
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
        <CharacterCardSkeleton key={i} />
      ))}
    </ul>
  );
}
