'use client';

import { useSyncExternalStore } from 'react';
import { Icon } from '@/components/icons/icon';
import { useAnalytics } from '@/lib/use-analytics';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}

// Shown once the window has scrolled more than one screen down.
function getScrolledPastFirstScreen() {
  return window.scrollY > window.innerHeight;
}

// Never shown in the server render; it appears after hydration if the page loads scrolled down.
function getServerSnapshot() {
  return false;
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// Floating bottom-right button that scrolls the window back to the top.
export function BackToTopButton() {
  const analytics = useAnalytics();
  const visible = useSyncExternalStore(subscribe, getScrolledPastFirstScreen, getServerSnapshot);
  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => {
        // Before scrolling, so the event records how far down the page was.
        analytics.backToTop.clicked();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      }}
      // Above the sticky search band (z-30); the modal filter drawer is in the top layer, so it
      // still covers the button.
      className="fixed right-4 bottom-4 z-40 flex size-12 items-center justify-center rounded-full border border-outline/50 bg-surface-container-high text-on-surface shadow-[0_10px_25px_-5px_rgb(0_0_0/0.45)] transition-[opacity,border-color,color] duration-200 hover:border-primary/50 hover:text-primary focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none starting:opacity-0 motion-reduce:transition-none md:right-6 md:bottom-6 md:size-11 lg:right-8 lg:bottom-8"
    >
      <Icon name="arrowUp" />
    </button>
  );
}
