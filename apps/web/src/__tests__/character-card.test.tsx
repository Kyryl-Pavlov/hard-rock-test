import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Character } from '@rme/shared';
import { CharacterCard } from '@/components/characters/character-card';
import { trackEvent } from '@/lib/analytics';
import { fetchCharacterProfile } from '@/lib/character-profile-client';
import { useExplorerStore } from '@/store/explorer-store';

jest.mock('@/lib/character-profile-client', () => ({ fetchCharacterProfile: jest.fn() }));
jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

// A Link stand-in that runs onNavigate like an in-app navigation. The real Link needs the app
// router, which jsdom doesn't have.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    onNavigate,
    children,
    ...props
  }: {
    href: string;
    onNavigate?: (event: { preventDefault: () => void }) => void;
    children: ReactNode;
  }) => (
    <a
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onNavigate?.({ preventDefault: () => {} });
      }}
    >
      {children}
    </a>
  ),
}));

const fetchProfile = jest.mocked(fetchCharacterProfile);

const rick: Character = {
  id: '1',
  name: 'Rick Sanchez',
  status: 'Alive',
  species: 'Human',
  type: '',
  gender: 'Male',
  image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
  origin: { id: '1', name: 'Earth (C-137)' },
  location: { id: '3', name: 'Citadel of Ricks' },
};

describe('CharacterCard', () => {
  it('shows the name, image and status', () => {
    render(<CharacterCard character={rick} />);

    expect(screen.getByRole('heading', { name: 'Rick Sanchez' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rick Sanchez' })).toBeInTheDocument();
    expect(screen.getByText('Alive')).toBeInTheDocument();
    expect(screen.getByText('#001')).toBeInTheDocument();
  });

  it('shows origin and last location', () => {
    render(<CharacterCard character={rick} />);

    expect(screen.getByText('Earth (C-137)')).toBeInTheDocument();
    expect(screen.getByText('Citadel of Ricks')).toBeInTheDocument();
  });

  it('falls back to the placeholder icon when there is no image', () => {
    render(<CharacterCard character={{ ...rick, image: '' }} />);

    expect(screen.queryByRole('img', { name: 'Rick Sanchez' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rick Sanchez' })).toBeInTheDocument();
  });

  it('drops the image when it fails to load', () => {
    render(<CharacterCard character={rick} />);

    fireEvent.error(screen.getByRole('img', { name: 'Rick Sanchez' }));

    expect(screen.queryByRole('img', { name: 'Rick Sanchez' })).not.toBeInTheDocument();
  });
});

describe('CharacterCard profile link', () => {
  beforeEach(() => {
    useExplorerStore.setState({ profiles: {}, profileStatus: {}, profileOrigin: null });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('links the name to the profile page', () => {
    render(<CharacterCard character={rick} />);

    expect(screen.getByRole('link', { name: 'Rick Sanchez' })).toHaveAttribute(
      'href',
      '/characters/1',
    );
  });

  it('remembers the list it was opened from and tracks the event', () => {
    window.history.replaceState(null, '', '/?status=Alive');
    render(<CharacterCard character={rick} />);

    fireEvent.click(screen.getByRole('link', { name: 'Rick Sanchez' }));

    expect(useExplorerStore.getState().profileOrigin).toBe('/?status=Alive');
    expect(trackEvent).toHaveBeenCalledWith('character_profile_opened', { id: '1' });
    window.history.replaceState(null, '', '/');
  });

  it('prefetches the profile once the pointer rests on the card', async () => {
    jest.useFakeTimers();
    fetchProfile.mockResolvedValue({
      ...rick,
      origin: { ...rick.origin, type: 'Planet', dimension: 'Dimension C-137' },
      location: { ...rick.location, type: 'Space station', dimension: 'unknown' },
      episode: [],
      created: '',
    });
    render(<CharacterCard character={rick} />);

    fireEvent.pointerEnter(screen.getByRole('link', { name: 'Rick Sanchez' }));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(200);
    });

    expect(fetchProfile).toHaveBeenCalledWith('1');
    expect(useExplorerStore.getState().profiles['1']).toBeDefined();
  });

  it('does not prefetch when the pointer only passes over the card', () => {
    jest.useFakeTimers();
    render(<CharacterCard character={rick} />);

    const link = screen.getByRole('link', { name: 'Rick Sanchez' });
    fireEvent.pointerEnter(link);
    fireEvent.pointerLeave(link);
    jest.advanceTimersByTime(200);

    expect(fetchProfile).not.toHaveBeenCalled();
  });
});
