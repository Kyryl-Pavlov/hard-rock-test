import { act, render, screen } from '@testing-library/react';
import { ExplorerToolbar } from '@/components/characters/explorer-toolbar';

// jsdom has no IntersectionObserver; capture the callback so a test can "scroll" the band.
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

function reportBand(intersectionRatio: number, top: number) {
  act(() => {
    reportIntersection?.(
      [{ intersectionRatio, boundingClientRect: { top } } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

function renderToolbar() {
  render(
    <ExplorerToolbar>
      <button type="button">Filters</button>
    </ExplorerToolbar>,
  );
}

// The logo is aria-hidden, so it's only reachable with `hidden: true`.
function queryLogo() {
  return screen.queryByRole('img', { name: 'Rick & Morty', hidden: true });
}

beforeEach(() => {
  reportIntersection = undefined;
  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

describe('ExplorerToolbar', () => {
  it('renders its children with no logo at first', () => {
    renderToolbar();

    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    expect(queryLogo()).not.toBeInTheDocument();
  });

  it('shows the small logo once the band sticks to the top edge', () => {
    renderToolbar();

    reportBand(0.98, 0);

    expect(queryLogo()).toBeInTheDocument();
  });

  it('hides the logo when the band scrolls back into the page', () => {
    renderToolbar();
    reportBand(0.98, 0);

    reportBand(1, 300);

    expect(queryLogo()).not.toBeInTheDocument();
  });

  it('shows no logo while the band is cut off at the bottom of the viewport', () => {
    renderToolbar();

    reportBand(0.5, 700);

    expect(queryLogo()).not.toBeInTheDocument();
  });

  it('keeps the logo out of the accessibility tree', () => {
    renderToolbar();

    reportBand(0.98, 0);

    expect(queryLogo()).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Rick & Morty' })).not.toBeInTheDocument();
  });
});
