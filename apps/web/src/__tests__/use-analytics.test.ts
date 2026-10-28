import { renderHook } from '@testing-library/react';
import { trackEvent } from '@/lib/analytics';
import { useAnalytics } from '@/lib/use-analytics';

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

function setWindowValue(name: 'scrollY' | 'innerHeight', value: number) {
  Object.defineProperty(window, name, { configurable: true, writable: true, value });
}

afterEach(() => {
  jest.resetAllMocks();
});

function analytics() {
  return renderHook(() => useAnalytics()).result.current;
}

describe('useAnalytics', () => {
  it('returns the same presets on every render', () => {
    const { result, rerender } = renderHook(() => useAnalytics());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('sends search events', () => {
    analytics().search.submitted('rick', 'enter');
    analytics().search.cleared();

    expect(trackEvent).toHaveBeenNthCalledWith(1, 'search', {
      search_term: 'rick',
      trigger: 'enter',
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, 'search_cleared', {});
  });

  it('names an empty filter choice instead of sending a blank value', () => {
    const { filters } = analytics();

    filters.statusSelected('');
    filters.speciesSelected('');
    filters.genderSelected('');

    expect(trackEvent).toHaveBeenCalledWith('filter_status_selected', { status: 'all' });
    expect(trackEvent).toHaveBeenCalledWith('filter_species_selected', { species: 'any' });
    expect(trackEvent).toHaveBeenCalledWith('filter_gender_selected', { gender: 'any' });
  });

  it('sends filter, drawer and list events with their params', () => {
    const { filters, filterDrawer, list } = analytics();

    filters.typeEntered('Parasite', 'typing');
    filters.reset('empty_state', 3);
    filterDrawer.opened(1);
    filterDrawer.closed('backdrop');
    list.loadMoreClicked(20, 826);
    list.retryClicked('first_page');

    expect(jest.mocked(trackEvent).mock.calls).toEqual([
      ['filter_type_entered', { type: 'Parasite', trigger: 'typing' }],
      ['filters_reset', { source: 'empty_state', active_filters: 3 }],
      ['filter_drawer_opened', { active_filters: 1 }],
      ['filter_drawer_closed', { method: 'backdrop' }],
      ['load_more_clicked', { loaded: 20, total: 826 }],
      ['load_retry_clicked', { context: 'first_page' }],
    ]);
  });

  it('measures back-to-top scroll depth in screens', () => {
    setWindowValue('innerHeight', 800);
    setWindowValue('scrollY', 2_000);

    analytics().backToTop.clicked();

    expect(trackEvent).toHaveBeenCalledWith('back_to_top_clicked', { scroll_depth: 3 });
  });

  it('sends breadcrumb and error events', () => {
    const { breadcrumbs, errorBoundary } = analytics();

    breadcrumbs.charactersClicked('history_back');
    errorBoundary.viewed('profile', 'abc123');
    errorBoundary.viewed('app');
    errorBoundary.retryClicked('app');

    expect(jest.mocked(trackEvent).mock.calls).toEqual([
      ['breadcrumb_clicked', { target: 'characters', mode: 'history_back' }],
      ['error_viewed', { surface: 'profile', digest: 'abc123' }],
      ['error_viewed', { surface: 'app' }],
      ['error_retry_clicked', { surface: 'app' }],
    ]);
  });
});
