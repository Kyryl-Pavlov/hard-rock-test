import { CharacterProfile } from './character-profile';

// The profile before anything is known about the character: every part is a placeholder, laid out
// exactly like the real profile. The "Characters" breadcrumb already works.
export function CharacterProfileSkeleton() {
  return <CharacterProfile character={null} />;
}
