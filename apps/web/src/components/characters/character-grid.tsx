import { parseFilters } from '@/lib/character-filters';
import { getCharacters } from '@/lib/characters';
import { CharacterExplorer } from './character-explorer';

interface CharacterGridProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Server-renders the first page for the filters in the URL; CharacterExplorer handles filter
// changes and the following pages on the client.
export async function CharacterGrid({ searchParams }: CharacterGridProps) {
  const filters = parseFilters(await searchParams);
  const firstPage = await getCharacters({ ...filters, page: 1 });

  return <CharacterExplorer initialFilters={filters} initialData={firstPage} />;
}
