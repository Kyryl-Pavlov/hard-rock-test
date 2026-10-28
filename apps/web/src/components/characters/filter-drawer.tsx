'use client';

import { useEffect, useEffectEvent, useId, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/icons/icon';
import type { DrawerCloseMethod } from '@/lib/analytics';
import { useAnalytics } from '@/lib/use-analytics';

// Matches Tailwind's `lg`, where the side panel replaces the drawer.
const SIDE_PANEL_QUERY = '(min-width: 64rem)';

const DIALOG_CLASS = [
  'fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-none w-80 max-w-[85vw] p-0',
  'border-0 border-r border-outline-variant bg-surface-container-low text-on-surface',
  // Slides in from @starting-style when opened, and back out while [data-closing] is set.
  '-translate-x-full transition-transform duration-300 ease-out',
  'open:translate-x-0 starting:open:-translate-x-full',
  'data-closing:-translate-x-full data-closing:duration-200 data-closing:ease-in',
  // The scrim fades along with the sheet.
  'backdrop:bg-background/75 backdrop:opacity-0 backdrop:backdrop-blur-sm',
  'backdrop:transition-opacity backdrop:duration-300 backdrop:ease-out',
  'open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
  'data-closing:backdrop:opacity-0 data-closing:backdrop:duration-200 data-closing:backdrop:ease-in',
  'motion-reduce:transition-none motion-reduce:backdrop:transition-none',
].join(' ');

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  // Matching characters, for the footer button; null while unknown.
  total: number | null;
  children: ReactNode;
}

// Slide-in filter sheet for small screens. A native modal <dialog> gives us the focus trap, Esc to
// close and an inert page behind it.
export function FilterDrawer({ open, onClose, total, children }: FilterDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const analytics = useAnalytics();
  // Keeps the content rendered while the sheet slides out after `open` turns false.
  const [rendered, setRendered] = useState(open);
  if (open && !rendered) setRendered(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      // Reopened mid-close: the slide reverses from where it is.
      delete dialog.dataset.closing;
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;

    // Slide out while the dialog is still modal, then close it. With no transition running
    // (reduced motion, or no Web Animations API as in jsdom) close right away.
    dialog.dataset.closing = '';
    const transitions = dialog.getAnimations?.() ?? [];
    if (transitions.length === 0) {
      dialog.close();
      return;
    }
    let cancelled = false;
    void Promise.allSettled(transitions.map((t) => t.finished)).then(() => {
      if (!cancelled) dialog.close();
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Every way the user can close the sheet. The native close event below runs after these, so it
  // isn't tracked again.
  function closeBy(method: DrawerCloseMethod) {
    analytics.filterDrawer.closed(method);
    onClose();
  }

  const closeForSidePanel = useEffectEvent(() => closeBy('viewport'));

  // Close if the viewport grows into the side-panel layout while the drawer is open.
  useEffect(() => {
    if (!open || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(SIDE_PANEL_QUERY);
    const handleChange = () => {
      if (query.matches) closeForSidePanel();
    };
    handleChange();
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Esc: animate out like the other close paths instead of closing instantly. Browsers may
      // ignore preventDefault on a repeated Esc; the close event below covers that.
      onCancel={(e) => {
        e.preventDefault();
        closeBy('escape');
      }}
      onClose={(e) => {
        delete e.currentTarget.dataset.closing;
        setRendered(false);
        onClose();
      }}
      // The content fills the dialog, so a click on the dialog itself is a click on the backdrop.
      onClick={(e) => {
        if (e.target === e.currentTarget) closeBy('backdrop');
      }}
      className={DIALOG_CLASS}
    >
      {rendered ? (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
            <h2 id={titleId} className="font-headline text-base font-semibold text-on-surface">
              Filters
            </h2>
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => closeBy('close_button')}
              className="flex size-11 items-center justify-center rounded-lg border border-transparent text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none"
            >
              <Icon name="close" />
            </button>
          </div>

          {/* overscroll-contain: reaching the end of the filters doesn't hand the scroll over to
              the page (or trigger pull-to-refresh). */}
          <div className="flex-1 overscroll-contain overflow-y-auto px-4 py-5">{children}</div>

          <div className="border-t border-outline-variant p-4">
            <button
              type="button"
              onClick={() => closeBy('show_results')}
              className="h-11 w-full rounded-lg border border-transparent bg-primary-container px-4 font-semibold text-on-primary-container hover:bg-primary-container/90 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none"
            >
              {total === null ? 'Show characters' : `Show ${total} characters`}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
