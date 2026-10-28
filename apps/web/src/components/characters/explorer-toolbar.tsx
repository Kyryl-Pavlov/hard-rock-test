'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';

// The explorer's sticky search band. Below lg it is the page's top bar: the compact logo bar is
// hidden there, so the band sticks at the top edge and shows the small logo once it's stuck. The
// negative margins cancel the page gutters so it runs full-bleed. On lg it's a floating glass card
// over the results column; it sticks at top-18, 16px under the compact header, so its top edge
// lines up with the sticky side panel.
export function ExplorerToolbar({ children }: { children: ReactNode }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof IntersectionObserver === 'undefined') return;

    // The root's top edge sits 1px down, so a band stuck at top-0 pokes out of it. On lg the band
    // sticks lower and never reads as stuck.
    const observer = new IntersectionObserver(
      (entries) => {
        // The latest report wins. Stuck while cut off at the top, not at the bottom of the viewport.
        for (const entry of entries) {
          setStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 1);
        }
      },
      { rootMargin: '-1px 0px 0px 0px', threshold: 1 },
    );
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={barRef}
      className="sticky top-0 z-30 -mx-4 flex items-center gap-3 border-b border-outline-variant/60 bg-background/80 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6 lg:top-18 lg:mx-0 lg:rounded-2xl lg:border lg:bg-surface-container-low/60 lg:p-3 lg:shadow-[0_10px_25px_-5px_rgb(0_0_0/0.45)] lg:backdrop-blur-xl lg:backdrop-saturate-150"
    >
      {stuck ? (
        // Decorative: it repeats the page title. Same intrinsic size as the big logo, so the
        // browser reuses the image it already loaded.
        <Image
          src="/rick-and-morty-logo.webp"
          alt="Rick & Morty"
          aria-hidden="true"
          width={261}
          height={80}
          className="h-8 w-auto shrink-0 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none lg:hidden"
        />
      ) : null}
      {children}
    </div>
  );
}
