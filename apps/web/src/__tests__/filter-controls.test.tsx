import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterControls } from '@/components/characters/filter-controls';
import { trackEvent } from '@/lib/analytics';
import { TEXT_DEBOUNCE_MS } from '@/lib/use-debounced-text';

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

describe('FilterControls', () => {
  const onChange = jest.fn();
  const onReset = jest.fn();

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('marks the current status and species as selected', () => {
    render(
      <FilterControls
        filters={{ status: 'Dead', species: 'Robot' }}
        onChange={onChange}
        onReset={onReset}
      />,
    );

    const status = screen.getByRole('group', { name: 'Status' });
    expect(status).toContainElement(screen.getByRole('radio', { name: 'Dead' }));
    expect(screen.getByRole('radio', { name: 'Dead' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Robot' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'All' })).not.toBeChecked();
  });

  it('reports a status choice, and clears it with All', async () => {
    const { rerender } = render(
      <FilterControls filters={{}} onChange={onChange} onReset={onReset} />,
    );

    await userEvent.click(screen.getByRole('radio', { name: 'Alive' }));
    expect(onChange).toHaveBeenLastCalledWith({ status: 'Alive' });
    expect(trackEvent).toHaveBeenLastCalledWith('filter_status_selected', { status: 'Alive' });

    rerender(
      <FilterControls filters={{ status: 'Alive' }} onChange={onChange} onReset={onReset} />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'All' }));
    expect(onChange).toHaveBeenLastCalledWith({ status: undefined });
    expect(trackEvent).toHaveBeenLastCalledWith('filter_status_selected', { status: 'all' });
  });

  it('reports a species choice', async () => {
    render(<FilterControls filters={{}} onChange={onChange} onReset={onReset} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Mythological Creature' }));

    expect(onChange).toHaveBeenCalledWith({ species: 'Mythological Creature' });
    expect(trackEvent).toHaveBeenCalledWith('filter_species_selected', {
      species: 'Mythological Creature',
    });
  });

  it('reports a gender choice', async () => {
    render(<FilterControls filters={{}} onChange={onChange} onReset={onReset} />);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Gender' }), 'Genderless');

    expect(onChange).toHaveBeenCalledWith({ gender: 'Genderless' });
    expect(trackEvent).toHaveBeenCalledWith('filter_gender_selected', { gender: 'Genderless' });
  });

  it('commits the type after a pause in typing', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<FilterControls filters={{}} onChange={onChange} onReset={onReset} />);

    await user.type(screen.getByRole('textbox', { name: 'Type' }), 'Clone');
    expect(onChange).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(TEXT_DEBOUNCE_MS));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ type: 'Clone' });
    expect(trackEvent).toHaveBeenCalledWith('filter_type_entered', {
      type: 'Clone',
      trigger: 'typing',
    });
  });

  it('disables Reset filters until a filter is set', async () => {
    const { rerender } = render(
      <FilterControls filters={{}} onChange={onChange} onReset={onReset} />,
    );
    expect(screen.getByRole('button', { name: 'Reset filters' })).toBeDisabled();

    rerender(
      <FilterControls
        filters={{ gender: 'Male', name: 'rick' }}
        onChange={onChange}
        onReset={onReset}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    // The name search counts too, since Reset clears it.
    expect(trackEvent).toHaveBeenCalledWith('filters_reset', {
      source: 'panel',
      active_filters: 2,
    });
  });
});
