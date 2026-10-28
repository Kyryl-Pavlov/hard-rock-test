'use client';

import { useEffect, useRef, useState } from 'react';

export const TEXT_DEBOUNCE_MS = 300;

// Local state for a text input whose value is committed (e.g. to filters) after a pause in typing.
// `change(value, true)` commits right away, for Enter or a clear button; `onCommit` is told which.
export function useDebouncedText(
  committed: string,
  onCommit: (value: string, immediate: boolean) => void,
  delayMs = TEXT_DEBOUNCE_MS,
) {
  const [value, setValue] = useState(committed);
  const [lastCommitted, setLastCommitted] = useState(committed);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Follow outside changes, like "Reset filters". Committed values are trimmed, so a trailing
  // space the user is still typing doesn't count as a change.
  if (committed !== lastCommitted) {
    setLastCommitted(committed);
    if (value.trim() !== committed) setValue(committed);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function change(next: string, immediate = false) {
    setValue(next);
    clearTimeout(timer.current);
    if (immediate) {
      onCommit(next, true);
      return;
    }
    timer.current = setTimeout(() => onCommit(next, false), delayMs);
  }

  return [value, change] as const;
}
