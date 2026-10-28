'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';

// Must match the bar's h-14. On lg the sticky search card and side panel (top-18) sit below it.
const BAR_HEIGHT = 56;

// Wraps the page's full-size title. Once the title slides under the top edge, where the bar sits,
// a slim fixed bar with the small logo takes its place; it goes away when the title scrolls back.
// Below lg the bar is hidden: the explorer's sticky toolbar shows the small logo instead.
export function CompactHeader({ children }: { children: ReactNode }) {
  const titleRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const title = titleRef.current;
    if (!title || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        // The latest report wins. Compact while the title is above the bar line, not below the
        // viewport.
        for (const entry of entries) {
          setCompact(!entry.isIntersecting && entry.boundingClientRect.top < BAR_HEIGHT);
        }
      },
      { rootMargin: `-${BAR_HEIGHT}px 0px 0px 0px` },
    );
    observer.observe(title);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={titleRef}>{children}</div>
      {compact ? (
        // Decorative: it repeats the title, which is still in the page. Above the sticky search
        // card (z-30); the modal filter drawer is in the top layer, so it still covers the bar.
        <div
          aria-hidden="true"
          className="fixed inset-x-0 top-0 z-40 hidden border-b border-outline-variant/60 bg-background/80 backdrop-blur-md transition-[opacity,translate] duration-200 starting:-translate-y-full starting:opacity-0 motion-reduce:transition-none lg:block"
        >
          <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center px-4 md:px-6 lg:px-8">
            {/* Same intrinsic size as the big logo, so the browser reuses the image it already
                loaded and the small logo shows at once. */}
            <Image
              src="/rick-and-morty-logo.webp"
              alt="Rick & Morty"
              width={261}
              height={80}
              className="h-9 w-auto"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
