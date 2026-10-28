'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import type { Character } from '@rme/shared';
import { useAnalytics } from '@/lib/use-analytics';
import type { QueryStatus } from '@/store/explorer-store';
import { CharacterCard } from './character-card';
import { CharacterCardSkeleton } from './character-card-skeleton';

const LOADING_PLACEHOLDERS = 4;
// Start loading before the end of the list scrolls into view, so the next page is usually ready.
const PREFETCH_MARGIN = '600px';

interface CharacterListProps {
  characters: Character[];
  nextPage: number | null;
  total: number;
  status: QueryStatus;
  onLoadMore: () => void;
}

// Renders the loaded characters and asks for the next page as the user scrolls. Loading and
// caching live in the explorer store; a repeated request while one is in flight is ignored there.
export function CharacterList({
  characters,
  nextPage,
  total,
  status,
  onLoadMore,
}: CharacterListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const analytics = useAnalytics();

  const onSentinelVisible = useEffectEvent(() => onLoadMore());

  // Reconnects after every load; a fresh observer reports the sentinel's current position right
  // away, so a screen taller than the list keeps loading until it's filled.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || nextPage === null || status !== 'idle') return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onSentinelVisible();
      },
      { rootMargin: PREFETCH_MARGIN },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextPage, status]);

  const hasMore = nextPage !== null;

  return (
    <div className="flex flex-col gap-6">
      <ul
        aria-busy={status === 'loading'}
        className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 2xl:grid-cols-4"
      >
        {characters.map((character) => (
          <li key={character.id}>
            <CharacterCard character={character} />
          </li>
        ))}
        {status === 'loading'
          ? Array.from({ length: LOADING_PLACEHOLDERS }, (_, i) => (
              <CharacterCardSkeleton key={i} />
            ))
          : null}
      </ul>

      {hasMore ? <div ref={sentinelRef} aria-hidden="true" /> : null}

      <div className="flex flex-col items-center gap-3">
        <p
          aria-live="polite"
          className="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase"
        >
          {hasMore
            ? `Showing ${characters.length} of ${total} characters`
            : `All ${total} characters loaded`}
        </p>

        {status === 'error' ? (
          <>
            <p role="alert" className="text-sm text-error">
              Couldn&apos;t load more characters.
            </p>
            <LoadButton
              onClick={() => {
                analytics.list.retryClicked('next_page');
                onLoadMore();
              }}
            >
              Retry
            </LoadButton>
          </>
        ) : null}

        {status === 'idle' && hasMore ? (
          <LoadButton
            onClick={() => {
              analytics.list.loadMoreClicked(characters.length, total);
              onLoadMore();
            }}
          >
            Load more
          </LoadButton>
        ) : null}
      </div>
    </div>
  );
}

function LoadButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 rounded-lg border border-outline/50 bg-surface-container px-5 text-sm font-semibold text-on-surface transition-colors hover:border-secondary hover:bg-surface-container-high focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none md:h-10"
    >
      {children}
    </button>
  );
}
