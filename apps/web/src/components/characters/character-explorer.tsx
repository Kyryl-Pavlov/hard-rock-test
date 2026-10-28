'use client';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { CharacterFilters, CharactersResponse } from '@rme/shared';
import { Icon } from '@/components/icons/icon';
import {
  countActiveFilters,
  filtersKey,
  filtersToSearchParams,
  normalizeFilters,
} from '@/lib/character-filters';
import { useExplorerStore } from '@/store/explorer-store';
import { CharacterGridSkeleton } from './character-grid-skeleton';
import { CharacterList } from './character-list';
import { ExplorerToolbar } from './explorer-toolbar';
import { FilterControls } from './filter-controls';
import { FilterDrawer } from './filter-drawer';
import { FilterPanel } from './filter-panel';
import { SearchInput } from './search-input';

interface CharacterExplorerProps {
  // Parsed from the URL and rendered on the server.
  initialFilters: CharacterFilters;
  initialData: CharactersResponse;
}

// Writes the filters to the URL without a server round trip (Next syncs native history calls with
// its router). Replace, not push, so trying filters doesn't flood the back button.
function syncUrl(filters: CharacterFilters) {
  const query = filtersToSearchParams(filters).toString();
  window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
}

// Search, filters and the character list. The first page comes from the server; after mount the
// explorer store takes over, serving repeat queries from its cache (persisted per tab).
export function CharacterExplorer({ initialFilters, initialData }: CharacterExplorerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { ready, storeFilters, queries, status, setFilters, loadNextPage } = useExplorerStore(
    useShallow((s) => ({
      ready: s.ready,
      storeFilters: s.filters,
      queries: s.queries,
      status: s.status,
      setFilters: s.setFilters,
      loadNextPage: s.loadNextPage,
    })),
  );

  useEffect(() => {
    let cancelled = false;
    // Restore the sessionStorage cache first, so hydrate() can keep pages loaded before a reload.
    void Promise.resolve(useExplorerStore.persist?.rehydrate()).then(() => {
      if (!cancelled) useExplorerStore.getState().hydrate(initialFilters, initialData);
    });
    return () => {
      cancelled = true;
    };
  }, [initialFilters, initialData]);

  // Until the store is seeded, render exactly what the server rendered.
  const filters = ready ? storeFilters : normalizeFilters(initialFilters);
  const key = filtersKey(filters);
  const query = ready
    ? queries[key]
    : {
        characters: initialData.results,
        nextPage: initialData.info.next,
        total: initialData.info.count,
      };
  const queryStatus = (ready && status[key]) || 'idle';

  function applyFilters(next: CharacterFilters) {
    const normalized = normalizeFilters(next);
    syncUrl(normalized);
    void setFilters(normalized);
  }

  // Patches are merged with the latest filters, so a debounced commit never overwrites a newer
  // change made in the meantime.
  function updateFilters(patch: CharacterFilters) {
    const state = useExplorerStore.getState();
    applyFilters({ ...(state.ready ? state.filters : initialFilters), ...patch });
  }

  function resetFilters() {
    applyFilters({});
  }

  function renderResults() {
    if (!query) {
      if (queryStatus === 'error') {
        return (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container p-8 text-center"
          >
            <p className="text-sm text-on-surface-variant">Couldn&apos;t load characters.</p>
            <button
              type="button"
              onClick={() => void loadNextPage()}
              className="h-11 rounded-lg border border-outline/50 bg-surface-container px-5 text-sm font-semibold text-on-surface transition-colors hover:border-secondary hover:bg-surface-container-high focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none md:h-10"
            >
              Retry
            </button>
          </div>
        );
      }
      return <CharacterGridSkeleton />;
    }

    if (query.characters.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container p-8 text-center">
          <p className="text-sm text-on-surface-variant">No characters match these filters.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="h-11 rounded-lg border border-outline/50 bg-surface-container px-5 text-sm font-semibold text-on-surface transition-colors hover:border-secondary hover:bg-surface-container-high focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none md:h-10"
          >
            Reset filters
          </button>
        </div>
      );
    }

    return (
      <CharacterList
        // A new filter set starts a fresh list and scroll observer.
        key={key}
        characters={query.characters}
        nextPage={query.nextPage}
        total={query.total}
        status={queryStatus}
        onLoadMore={() => void loadNextPage()}
      />
    );
  }

  const activeCount = countActiveFilters(filters);
  const controls = (
    <FilterControls filters={filters} onChange={updateFilters} onReset={resetFilters} />
  );

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <FilterPanel>{controls}</FilterPanel>

      <div className="flex min-w-0 flex-col gap-6">
        <ExplorerToolbar>
          <SearchInput value={filters.name ?? ''} onCommit={(name) => updateFilters({ name })} />
          {/* Icon-only; the active filter count shows as a badge on the icon */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
            aria-label={activeCount > 0 ? `Filters (${activeCount})` : 'Filters'}
            className="relative flex size-11 shrink-0 items-center justify-center rounded-lg border border-outline/50 bg-surface-container text-on-surface transition-colors hover:border-secondary hover:bg-surface-container-high focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none lg:hidden"
          >
            <Icon name="tune" />
            {activeCount > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary-container text-[11px] font-semibold text-on-primary-container tabular-nums">
                {activeCount}
              </span>
            ) : null}
          </button>
        </ExplorerToolbar>

        {renderResults()}
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        total={query ? query.total : null}
      >
        {controls}
      </FilterDrawer>
    </div>
  );
}
