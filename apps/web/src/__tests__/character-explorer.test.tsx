import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Character, CharactersResponse } from '@rme/shared';
import { CharacterExplorer } from '@/components/characters/character-explorer';
import { fetchCharacterPage } from '@/lib/character-page-client';
import { useExplorerStore } from '@/store/explorer-store';

jest.mock('@/lib/character-page-client', () => ({ fetchCharacterPage: jest.fn() }));
jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

const fetchPage = jest.mocked(fetchCharacterPage);

function character(id: number, name = `Character ${id}`): Character {
  return {
    id: String(id),
    name,
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    image: `https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`,
    origin: { id: '1', name: 'Earth (C-137)' },
    location: { id: '3', name: 'Citadel of Ricks' },
  };
}

function page(characters: Character[], next: number | null = null): CharactersResponse {
  return {
    info: { count: characters.length, pages: 1, next, prev: null },
    results: characters,
  };
}

const firstPage = page([character(1, 'Rick Sanchez'), character(2, 'Morty Smith')]);

// The side panel is the first set of controls; the drawer only renders its own while open.
function panel() {
  return within(screen.getByRole('complementary', { name: 'Filters' }));
}

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  useExplorerStore.setState({ filters: {}, queries: {}, status: {}, ready: false });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('CharacterExplorer', () => {
  it('renders the server-rendered first page', () => {
    render(<CharacterExplorer initialFilters={{}} initialData={firstPage} />);

    expect(screen.getByRole('heading', { name: 'Rick Sanchez' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('applies a filter: fetches it, shows the results and writes it to the URL', async () => {
    fetchPage.mockResolvedValueOnce(page([character(3, 'Birdperson')]));
    render(<CharacterExplorer initialFilters={{}} initialData={firstPage} />);

    await userEvent.click(panel().getByRole('radio', { name: 'Dead' }));

    expect(await screen.findByRole('heading', { name: 'Birdperson' })).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledWith({ status: 'Dead' }, 1);
    expect(window.location.search).toBe('?status=Dead');
  });

  it('serves a filter set it has already loaded from the cache', async () => {
    fetchPage.mockResolvedValueOnce(page([character(3, 'Birdperson')]));
    render(<CharacterExplorer initialFilters={{}} initialData={firstPage} />);

    await userEvent.click(panel().getByRole('radio', { name: 'Dead' }));
    await screen.findByRole('heading', { name: 'Birdperson' });
    await userEvent.click(panel().getByRole('radio', { name: 'All' }));

    expect(await screen.findByRole('heading', { name: 'Rick Sanchez' })).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe('');
  });

  it('starts from the filters in the URL', () => {
    render(
      <CharacterExplorer
        initialFilters={{ status: 'Alive', name: 'rick' }}
        initialData={firstPage}
      />,
    );

    expect(panel().getByRole('radio', { name: 'Alive' })).toBeChecked();
    expect(screen.getByRole('searchbox', { name: 'Search characters by name' })).toHaveValue(
      'rick',
    );
  });

  it('shows an icon-only Filters button with no count while no filter is set', () => {
    render(<CharacterExplorer initialFilters={{}} initialData={firstPage} />);

    expect(screen.getByRole('button', { name: 'Filters' })).toHaveTextContent(/^$/);
  });

  it('shows the active filter count as a badge on the Filters button', () => {
    render(<CharacterExplorer initialFilters={{ status: 'Alive' }} initialData={firstPage} />);

    expect(screen.getByRole('button', { name: 'Filters (1)' })).toHaveTextContent(/^1$/);
  });

  it('shows an empty state with a reset when nothing matches', async () => {
    fetchPage.mockResolvedValueOnce(page([]));
    render(<CharacterExplorer initialFilters={{}} initialData={firstPage} />);

    await userEvent.click(panel().getByRole('radio', { name: 'Robot' }));

    expect(await screen.findByText('No characters match these filters.')).toBeInTheDocument();
    // The first Reset filters button is the side panel's; the second is the empty state's.
    const [, emptyStateReset] = screen.getAllByRole('button', { name: 'Reset filters' });
    await userEvent.click(emptyStateReset as HTMLElement);
    expect(await screen.findByRole('heading', { name: 'Rick Sanchez' })).toBeInTheDocument();
  });

  it('shows a retry when the first page of a filter set fails', async () => {
    fetchPage
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(page([character(4, 'Squanchy')]));
    render(<CharacterExplorer initialFilters={{}} initialData={firstPage} />);

    await userEvent.click(panel().getByRole('radio', { name: 'Alien' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load characters.");

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Squanchy' })).toBeInTheDocument();
  });
});
