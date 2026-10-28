'use client';

import { useId } from 'react';
import { Icon } from '@/components/icons/icon';
import { useDebouncedText } from '@/lib/use-debounced-text';

interface SearchInputProps {
  // The committed name filter.
  value: string;
  onCommit: (name: string) => void;
}

// Name search. Commits after a short pause in typing, or right away on Enter or Clear.
export function SearchInput({ value, onCommit }: SearchInputProps) {
  const id = useId();
  const [text, setText] = useDebouncedText(value, onCommit);

  return (
    <div className="relative flex min-w-0 flex-1 items-center">
      <label htmlFor={id} className="sr-only">
        Search characters by name
      </label>
      <span className="pointer-events-none absolute left-3 text-on-surface-variant">
        <Icon name="search" />
      </span>
      <input
        id={id}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setText(text, true);
        }}
        placeholder="Search characters by name…"
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full rounded-lg border text-ellipsis border-outline-variant bg-surface-container pr-11 pl-10 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {text ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setText('', true)}
          className="absolute right-1.5 flex size-8 items-center justify-center rounded-lg border border-transparent text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none"
        >
          <Icon name="close" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
