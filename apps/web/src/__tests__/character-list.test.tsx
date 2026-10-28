import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Character } from '@rme/shared';
import { CharacterList } from '@/components/characters/character-list';
import { trackEvent } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

function character(id: number): Character {
  return {
    id: String(id),
    name: `Character ${id}`,
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    image: `https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`,
    origin: { id: '1', name: 'Earth (C-137)' },
    location: { id: '3', name: 'Citadel of Ricks' },
  };
}

// jsdom has no IntersectionObserver; capture the callback so a test can "scroll" to the end.
let reportIntersection: IntersectionObserverCallback | undefined;

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    reportIntersection = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

async function scrollToEnd() {
  await act(async () => {
    reportIntersection?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

beforeEach(() => {
  reportIntersection = undefined;
  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('CharacterList', () => {
  const onLoadMore = jest.fn();

  it('renders the characters and the progress status', () => {
    render(
      <CharacterList
        characters={[1, 2].map(character)}
        nextPage={2}
        total={5}
        status="idle"
        onLoadMore={onLoadMore}
      />,
    );

    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByText('Showing 2 of 5 characters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();
  });

  it('asks for the next page when the end of the list scrolls into view', async () => {
    render(
      <CharacterList
        characters={[1, 2].map(character)}
        nextPage={2}
        total={5}
        status="idle"
        onLoadMore={onLoadMore}
      />,
    );

    await scrollToEnd();

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    // Only the button counts as a click; the scroll load is tracked by the store.
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('asks for the next page from the Load more button', async () => {
    render(
      <CharacterList
        characters={[1, 2].map(character)}
        nextPage={2}
        total={5}
        status="idle"
        onLoadMore={onLoadMore}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('load_more_clicked', { loaded: 2, total: 5 });
  });

  it('shows placeholders and no Load more button while a page is loading', () => {
    render(
      <CharacterList
        characters={[1, 2].map(character)}
        nextPage={2}
        total={5}
        status="loading"
        onLoadMore={onLoadMore}
      />,
    );

    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows the end state and never asks for more when there is no next page', async () => {
    render(
      <CharacterList
        characters={[1, 2].map(character)}
        nextPage={null}
        total={2}
        status="idle"
        onLoadMore={onLoadMore}
      />,
    );

    await scrollToEnd();

    expect(onLoadMore).not.toHaveBeenCalled();
    expect(screen.getByText('All 2 characters loaded')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows an error with a working Retry when a page fails to load', async () => {
    render(
      <CharacterList
        characters={[1, 2].map(character)}
        nextPage={2}
        total={5}
        status="error"
        onLoadMore={onLoadMore}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load more characters.");

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('load_retry_clicked', { context: 'next_page' });
  });
});
