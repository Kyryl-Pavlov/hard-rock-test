import { fireEvent, render, screen } from '@testing-library/react';
import type { Character } from '@rme/shared';
import { CharacterCard } from '@/components/characters/character-card';

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
