'use client';

import { sendGAEvent } from '@next/third-parties/google';
import type { CharacterFilters } from '@rme/shared';

// How a debounced text input was committed: a pause in typing, or Enter.
export type CommitTrigger = 'typing' | 'enter';

export type ErrorSurface = 'app' | 'profile';

export type DrawerCloseMethod =
  'close_button' | 'show_results' | 'backdrop' | 'escape' | 'viewport';

// Every analytics event the app sends, with its params. Names and params are snake_case, as GA
// expects. Components send them through the presets in use-analytics.ts; non-React code (the
// explorer store) calls trackEvent() directly.
export interface AnalyticsEvents {
  // Search and filters
  search: { search_term: string; trigger: CommitTrigger };
  search_cleared: Record<string, never>;
  filter_status_selected: { status: string };
  filter_species_selected: { species: string };
  filter_gender_selected: { gender: string };
  filter_type_entered: { type: string; trigger: CommitTrigger };
  filters_reset: { source: 'panel' | 'empty_state'; active_filters: number };
  filter_drawer_opened: { active_filters: number };
  filter_drawer_closed: { method: DrawerCloseMethod };
  // Character list (the store sends the filtered, loaded and failed events)
  characters_filtered: CharacterFilters;
  characters_page_loaded: { page: number };
  characters_load_failed: { page: number };
  load_more_clicked: { loaded: number; total: number };
  load_retry_clicked: { context: 'first_page' | 'next_page' };
  character_profile_opened: { id: string };
  character_profile_prefetched: { id: string };
  back_to_top_clicked: { scroll_depth: number };
  // Profile and error pages
  breadcrumb_clicked: { target: 'characters'; mode: 'history_back' | 'link' };
  error_viewed: { surface: ErrorSurface; digest?: string };
  error_retry_clicked: { surface: ErrorSurface };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

// Thin wrapper so the rest of the app does not depend on the GA library directly.
// No-op when GA is not configured.
export function trackEvent<N extends AnalyticsEventName>(
  name: N,
  params: AnalyticsEvents[N],
): void {
  if (!process.env.NEXT_PUBLIC_GA_ID) return;
  sendGAEvent('event', name, params);
}
