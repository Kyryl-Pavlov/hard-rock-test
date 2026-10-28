import { render, screen, within } from '@testing-library/react';
import type { Character, CharacterDetail } from '@rme/shared';
import { CharacterProfile } from '@/components/character-profile/character-profile';

// The breadcrumb's link reads the app router, which jsdom doesn't have.
jest.mock('next/navigation', () => ({ useRouter: () => ({ back: jest.fn() }) }));

const listed: Character = {
  id: '1',
  name: 'Rick Sanchez',
  status: 'Alive',
  species: 'Human',
  type: '',
  gender: 'Male',
  image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
  origin: { id: '1', name: 'Earth (C-137)' },
  location: { id: null, name: 'unknown' },
};

const rick: CharacterDetail = {
  ...listed,
  origin: { id: '1', name: 'Earth (C-137)', type: 'Planet', dimension: 'Dimension C-137' },
  location: { id: null, name: 'unknown', type: '', dimension: '' },
  episode: [
    { id: '1', name: 'Pilot', airDate: 'December 2, 2013', episode: 'S01E01' },
    { id: '2', name: 'Lawnmower Dog', airDate: 'December 9, 2013', episode: 'S01E02' },
    { id: '12', name: 'A Rickle in Time', airDate: 'July 26, 2015', episode: 'S02E01' },
  ],
  created: '2017-11-04T18:48:46.250Z',
};

describe('CharacterProfile', () => {
  it('shows the name as the page heading and as the current breadcrumb', () => {
    render(<CharacterProfile character={rick} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rick Sanchez');
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(nav).getByRole('link', { name: 'Characters' })).toHaveAttribute('href', '/');
    expect(within(nav).getByText('Rick Sanchez')).toHaveAttribute('aria-current', 'page');
  });

  it('shows the portrait, status, species, gender and indexed date', () => {
    render(<CharacterProfile character={rick} />);

    expect(screen.getByRole('img', { name: 'Rick Sanchez' })).toBeInTheDocument();
    expect(screen.getByText('#001')).toBeInTheDocument();
    expect(screen.getByText('Human · Male')).toBeInTheDocument();
    expect(screen.getByText('Indexed Nov 4, 2017')).toBeInTheDocument();
  });

  it('lists every registry field, with the places described', () => {
    render(<CharacterProfile character={rick} />);

    const registry = screen.getByRole('region', { name: 'Registry' });
    expect(within(registry).getByText('Earth (C-137)')).toBeInTheDocument();
    expect(within(registry).getByText('Planet · Dimension C-137')).toBeInTheDocument();
    expect(within(registry).getByText('unknown')).toBeInTheDocument();
    expect(within(registry).getByText('No further records')).toBeInTheDocument();
    expect(within(registry).getByText('None recorded')).toBeInTheDocument();
    expect(within(registry).getByText('Human')).toBeInTheDocument();
    expect(within(registry).getByText('Male')).toBeInTheDocument();
    expect(within(registry).getByText('Alive')).toBeInTheDocument();
  });

  it('shows the type as a chip when the character has one', () => {
    render(<CharacterProfile character={{ ...rick, type: 'Parasite' }} />);

    expect(screen.getAllByText('Parasite')).toHaveLength(2);
  });

  it('sums up the appearances', () => {
    render(<CharacterProfile character={rick} />);

    const stats = screen.getByRole('region', { name: 'Appearances' });
    expect(within(stats).getByText('3')).toBeInTheDocument();
    expect(within(stats).getByText('2')).toBeInTheDocument();
    expect(within(stats).getByText('Seasons 1–2')).toBeInTheDocument();
    expect(within(stats).getByText('S01E01')).toBeInTheDocument();
    expect(within(stats).getByText('Pilot')).toBeInTheDocument();
    expect(within(stats).getByText('S02E01')).toBeInTheDocument();
    expect(within(stats).getByText('A Rickle in Time')).toBeInTheDocument();
  });

  it('lists every episode, grouped by season', () => {
    render(<CharacterProfile character={rick} />);

    const episodes = screen.getByRole('region', { name: 'Episodes' });
    expect(within(episodes).getByRole('heading', { name: /Season 1\s*2 episodes/ })).toBeVisible();
    expect(within(episodes).getByRole('heading', { name: /Season 2\s*1 episode$/ })).toBeVisible();
    expect(within(episodes).getAllByRole('listitem')).toHaveLength(3);
    expect(within(episodes).getByText('Lawnmower Dog')).toBeInTheDocument();
    expect(within(episodes).getByText('December 9, 2013')).toBeInTheDocument();
  });

  it('previews a list character, with placeholders for the rest', () => {
    const { container } = render(<CharacterProfile character={listed} />);

    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rick Sanchez');
    expect(screen.getByText('Earth (C-137)')).toBeInTheDocument();
    expect(screen.queryByText(/^Indexed/)).not.toBeInTheDocument();
    expect(screen.queryByText('Pilot')).not.toBeInTheDocument();
    // The placeholder rows are hidden from assistive tech.
    const episodes = screen.getByRole('region', { name: 'Episodes' });
    expect(within(episodes).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('renders only placeholders without a character', () => {
    const { container } = render(<CharacterProfile character={null} />);

    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Characters' })).toBeInTheDocument();
  });
});
