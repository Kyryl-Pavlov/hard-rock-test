import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterDrawer } from '@/components/characters/filter-drawer';

// jsdom doesn't implement modal dialogs; emulate the open attribute and the close event.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

function Harness({ total = 42 }: { total?: number | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Filters
      </button>
      <FilterDrawer open={open} onClose={() => setOpen(false)} total={total}>
        <p>Filter form</p>
      </FilterDrawer>
    </>
  );
}

describe('FilterDrawer', () => {
  it('is closed until the Filters button opens it', async () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(dialog).toHaveTextContent('Filter form');
    expect(screen.getByRole('button', { name: 'Show 42 characters' })).toBeInTheDocument();
  });

  it('closes from the close button', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    await userEvent.click(screen.getByRole('button', { name: 'Close filters' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes from the results button', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    await userEvent.click(screen.getByRole('button', { name: 'Show 42 characters' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on a click outside the sheet', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    await userEvent.click(screen.getByRole('dialog'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays open with its content until the slide-out transition finishes', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    let finishTransition: () => void = () => {};
    const finished = new Promise<void>((resolve) => (finishTransition = resolve));
    // jsdom has no Web Animations API; stand in for the running CSS transition.
    dialog.getAnimations = () => [{ finished } as unknown as Animation];

    await userEvent.click(screen.getByRole('button', { name: 'Close filters' }));

    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('data-closing');
    expect(within(dialog).getByText('Filter form')).toBeInTheDocument();

    finishTransition();

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(dialog).not.toHaveAttribute('data-closing');
    expect(within(dialog).queryByText('Filter form')).not.toBeInTheDocument();
  });

  it('shows a generic results label while the total is unknown', async () => {
    render(<Harness total={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('button', { name: 'Show characters' })).toBeInTheDocument();
  });
});
