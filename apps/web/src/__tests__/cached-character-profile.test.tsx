import { render, screen } from '@testing-library/react';
import type { Character, CharacterDetail } from '@rme/shared';
import { CachedCharacterProfile } from '@/components/character-profile/cached-character-profile';
import { useExplorerStore } from '@/store/explorer-store';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ back: jest.fn() }),
}));

const listed: Character = {
  id: '1',
  name: 'Rick Sanchez',
  status: 'Alive',
  species: 'Human',
  type: '',
  gender: 'Male',
  image: '',
  origin: { id: '1', name: 'Earth (C-137)' },
  location: { id: '3', name: 'Citadel of Ricks' },
};

const rick: CharacterDetail = {
  ...listed,
  origin: { id: '1', name: 'Earth (C-137)', type: 'Planet', dimension: 'Dimension C-137' },
  location: { id: '3', name: 'Citadel of Ricks', type: 'Space station', dimension: 'unknown' },
  episode: [{ id: '1', name: 'Pilot', airDate: 'December 2, 2013', episode: 'S01E01' }],
  created: '2017-11-04T18:48:46.250Z',
};

beforeEach(() => {
  useExplorerStore.setState({ queries: {}, profiles: {} });
});

describe('CachedCharacterProfile', () => {
  it('renders the full profile from the profile cache', () => {
    useExplorerStore.setState({ profiles: { '1': { character: rick, fetchedAt: Date.now() } } });

    render(<CachedCharacterProfile />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rick Sanchez');
    expect(screen.getByText('Planet · Dimension C-137')).toBeInTheDocument();
    expect(screen.getAllByText('Pilot').length).toBeGreaterThan(0);
  });

  it('previews the character from a cached list', () => {
    useExplorerStore.setState({
      queries: {
        'status=Alive': { characters: [listed], nextPage: null, total: 1, fetchedAt: Date.now() },
      },
    });

    render(<CachedCharacterProfile />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rick Sanchez');
    expect(screen.queryByText('Planet · Dimension C-137')).not.toBeInTheDocument();
    expect(screen.queryByText('Pilot')).not.toBeInTheDocument();
  });

  it('falls back to the skeleton when the store has nothing on the character', () => {
    render(<CachedCharacterProfile />);

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });
});
