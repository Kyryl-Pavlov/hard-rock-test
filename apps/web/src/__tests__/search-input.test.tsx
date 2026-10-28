import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '@/components/characters/search-input';
import { trackEvent } from '@/lib/analytics';
import { TEXT_DEBOUNCE_MS } from '@/lib/use-debounced-text';

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

describe('SearchInput', () => {
  const onCommit = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  function setup(value = '') {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const view = render(<SearchInput value={value} onCommit={onCommit} />);
    const input = screen.getByRole('searchbox', { name: 'Search characters by name' });
    return { user, input, ...view };
  }

  it('commits once, after the user stops typing', async () => {
    const { user, input } = setup();

    await user.type(input, 'rick');
    expect(onCommit).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(TEXT_DEBOUNCE_MS));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('rick');
    expect(trackEvent).toHaveBeenCalledWith('search', { search_term: 'rick', trigger: 'typing' });
  });

  it('commits right away on Enter', async () => {
    const { user, input } = setup();

    await user.type(input, 'morty{Enter}');

    expect(onCommit).toHaveBeenCalledWith('morty');
    act(() => jest.advanceTimersByTime(TEXT_DEBOUNCE_MS));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('search', { search_term: 'morty', trigger: 'enter' });
  });

  it('does not track re-committing the current search as a new one', async () => {
    const { user, input } = setup('rick');

    await user.type(input, '{Enter}');

    expect(onCommit).toHaveBeenCalledWith('rick');
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('clears the search with the Clear button', async () => {
    const { user, input } = setup('rick');
    expect(input).toHaveValue('rick');

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(input).toHaveValue('');
    expect(onCommit).toHaveBeenCalledWith('');
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('search_cleared', {});
  });

  it('follows outside changes such as Reset filters', () => {
    const { input, rerender } = setup('rick');

    rerender(<SearchInput value="" onCommit={onCommit} />);

    expect(input).toHaveValue('');
  });
});
