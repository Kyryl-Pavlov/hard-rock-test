import { act, render, screen } from '@testing-library/react';
import { CompactHeader } from '@/components/layout/compact-header';

// jsdom has no IntersectionObserver; capture the callback so a test can "scroll" the title.
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

function reportTitle(isIntersecting: boolean, top: number) {
  act(() => {
    reportIntersection?.(
      [{ isIntersecting, boundingClientRect: { top } } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

function renderHeader() {
  render(
    <CompactHeader>
      <h1>Title</h1>
    </CompactHeader>,
  );
}

// The bar is aria-hidden, so its logo is only reachable with `hidden: true`.
function queryCompactLogo() {
  return screen.queryByRole('img', { name: 'Rick & Morty', hidden: true });
}

beforeEach(() => {
  reportIntersection = undefined;
  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

describe('CompactHeader', () => {
  it('renders the title with no bar at first', () => {
    renderHeader();

    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument();
    expect(queryCompactLogo()).not.toBeInTheDocument();
  });

  it('shows the small logo bar once the title scrolls under the top edge', () => {
    renderHeader();

    reportTitle(false, -100);

    expect(queryCompactLogo()).toBeInTheDocument();
  });

  it('hides the bar when the title scrolls back into view', () => {
    renderHeader();
    reportTitle(false, -100);

    reportTitle(true, 40);

    expect(queryCompactLogo()).not.toBeInTheDocument();
  });

  it('shows no bar while the title is below the viewport', () => {
    renderHeader();

    reportTitle(false, 2000);

    expect(queryCompactLogo()).not.toBeInTheDocument();
  });

  it('keeps the bar out of the accessibility tree', () => {
    renderHeader();

    reportTitle(false, -100);

    expect(queryCompactLogo()).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Rick & Morty' })).not.toBeInTheDocument();
  });
});
