'use client';

import {
  trackEvent,
  type CommitTrigger,
  type DrawerCloseMethod,
  type ErrorSurface,
} from '@/lib/analytics';

// Ready-made events for each interactive part of the UI. Empty filter values ('' in the controls)
// are sent as 'all' / 'any', so reports never show a blank value.
const presets = {
  search: {
    submitted: (term: string, trigger: CommitTrigger) =>
      trackEvent('search', { search_term: term, trigger }),
    cleared: () => trackEvent('search_cleared', {}),
  },
  filters: {
    statusSelected: (status: string) =>
      trackEvent('filter_status_selected', { status: status || 'all' }),
    speciesSelected: (species: string) =>
      trackEvent('filter_species_selected', { species: species || 'any' }),
    genderSelected: (gender: string) =>
      trackEvent('filter_gender_selected', { gender: gender || 'any' }),
    typeEntered: (type: string, trigger: CommitTrigger) =>
      trackEvent('filter_type_entered', { type, trigger }),
    reset: (source: 'panel' | 'empty_state', activeFilters: number) =>
      trackEvent('filters_reset', { source, active_filters: activeFilters }),
  },
  filterDrawer: {
    opened: (activeFilters: number) =>
      trackEvent('filter_drawer_opened', { active_filters: activeFilters }),
    closed: (method: DrawerCloseMethod) => trackEvent('filter_drawer_closed', { method }),
  },
  list: {
    loadMoreClicked: (loaded: number, total: number) =>
      trackEvent('load_more_clicked', { loaded, total }),
    retryClicked: (context: 'first_page' | 'next_page') =>
      trackEvent('load_retry_clicked', { context }),
  },
  backToTop: {
    // How many screens down the page was when the button was pressed.
    clicked: () =>
      trackEvent('back_to_top_clicked', {
        scroll_depth: Math.round(window.scrollY / Math.max(window.innerHeight, 1)),
      }),
  },
  breadcrumbs: {
    charactersClicked: (mode: 'history_back' | 'link') =>
      trackEvent('breadcrumb_clicked', { target: 'characters', mode }),
  },
  errorBoundary: {
    viewed: (surface: ErrorSurface, digest?: string) =>
      trackEvent('error_viewed', digest ? { surface, digest } : { surface }),
    retryClicked: (surface: ErrorSurface) => trackEvent('error_retry_clicked', { surface }),
  },
};

export type AnalyticsPresets = typeof presets;

// The way components send analytics. The presets are a module constant, so the returned object is
// stable across renders and safe in effect deps.
export function useAnalytics(): AnalyticsPresets {
  return presets;
}
