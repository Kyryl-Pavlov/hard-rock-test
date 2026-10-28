import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// The grid is an async Server Component that reads cookies; RTL can't render it.
jest.mock('@/components/characters/character-grid', () => ({
  CharacterGrid: () => <ul aria-label="Character list" />,
}));

const props = { params: Promise.resolve({}), searchParams: Promise.resolve({}) };

describe('Home page', () => {
  it('renders the app title with the logo', () => {
    render(<Home {...props} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName('Rick & Morty Explorer');
    expect(screen.getByRole('img', { name: 'Rick & Morty' })).toBeInTheDocument();
  });

  it('renders the characters section', () => {
    render(<Home {...props} />);
    expect(screen.getByRole('region', { name: 'Characters' })).toBeInTheDocument();
  });
});
