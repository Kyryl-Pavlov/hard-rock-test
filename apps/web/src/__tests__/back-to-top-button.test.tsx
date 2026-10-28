import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackToTopButton } from '@/components/layout/back-to-top-button';
import { trackEvent } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

const VIEWPORT_HEIGHT = 800;

function setWindowValue(name: 'scrollY' | 'innerHeight', value: number) {
  Object.defineProperty(window, name, { configurable: true, writable: true, value });
}

function scrollWindowTo(y: number) {
  setWindowValue('scrollY', y);
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

const originalScrollTo = window.scrollTo;
const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  setWindowValue('innerHeight', VIEWPORT_HEIGHT);
  setWindowValue('scrollY', 0);
  // jsdom doesn't implement scrolling.
  window.scrollTo = jest.fn();
});

afterEach(() => {
  window.scrollTo = originalScrollTo;
  window.matchMedia = originalMatchMedia;
  jest.mocked(trackEvent).mockReset();
});

describe('BackToTopButton', () => {
  it('is hidden at the top of the page', () => {
    render(<BackToTopButton />);
    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
  });

  it('stays hidden until the window has scrolled more than one screen', () => {
    render(<BackToTopButton />);

    scrollWindowTo(VIEWPORT_HEIGHT);
    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();

    scrollWindowTo(VIEWPORT_HEIGHT + 1);
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
  });

  it('hides again after scrolling back up', () => {
    render(<BackToTopButton />);
    scrollWindowTo(VIEWPORT_HEIGHT * 2);
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();

    scrollWindowTo(100);

    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
  });

  it('re-checks on resize', () => {
    render(<BackToTopButton />);
    scrollWindowTo(VIEWPORT_HEIGHT + 100);
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();

    setWindowValue('innerHeight', VIEWPORT_HEIGHT * 2);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
  });

  it('smooth-scrolls to the top when clicked', async () => {
    render(<BackToTopButton />);
    scrollWindowTo(VIEWPORT_HEIGHT * 2);

    await userEvent.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(trackEvent).toHaveBeenCalledWith('back_to_top_clicked', { scroll_depth: 2 });
  });

  it('jumps without animation when reduced motion is preferred', async () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    render(<BackToTopButton />);
    scrollWindowTo(VIEWPORT_HEIGHT * 2);

    await userEvent.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
