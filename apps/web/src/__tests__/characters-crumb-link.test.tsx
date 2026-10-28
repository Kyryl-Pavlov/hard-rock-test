import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharactersCrumbLink } from '@/components/character-profile/characters-crumb-link';
import { useExplorerStore } from '@/store/explorer-store';

const back = jest.fn();
const push = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ back, push }) }));

// A Link stand-in that runs onNavigate like an in-app navigation, then "navigates" unless it was
// prevented. The real Link needs the app router, which jsdom doesn't have.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    onNavigate,
    children,
    className,
  }: {
    href: string;
    onNavigate?: (event: { preventDefault: () => void }) => void;
    children: ReactNode;
    className?: string;
  }) => (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        let prevented = false;
        onNavigate?.({ preventDefault: () => (prevented = true) });
        if (!prevented) push(href);
      }}
    >
      {children}
    </a>
  ),
}));

beforeEach(() => {
  useExplorerStore.setState({ profileOrigin: null });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('CharactersCrumbLink', () => {
  it('goes back in history when the profile was opened from the list', async () => {
    useExplorerStore.setState({ profileOrigin: '/?status=Dead' });
    render(<CharactersCrumbLink />);

    const link = screen.getByRole('link', { name: 'Characters' });
    expect(link).toHaveAttribute('href', '/?status=Dead');

    await userEvent.click(link);

    expect(back).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it('links to the list after a direct visit', async () => {
    render(<CharactersCrumbLink />);

    const link = screen.getByRole('link', { name: 'Characters' });
    expect(link).toHaveAttribute('href', '/');

    await userEvent.click(link);

    expect(back).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/');
  });
});
