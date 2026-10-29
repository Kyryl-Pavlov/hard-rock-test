import Image from 'next/image';
import Link from 'next/link';

// The slim top bar of the inner pages: the small logo, linking home. Same look as the home page's
// compact bar, but always shown: it sticks to the top while the page scrolls under it.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center px-4 md:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Rick & Morty Explorer home"
          className="rounded-lg focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none"
        >
          {/* Same intrinsic size as the home page's logo, so the browser reuses that image */}
          <Image
            src="/rick-and-morty-logo.webp"
            alt="Rick & Morty"
            width={261}
            height={80}
            loading="eager"
            className="h-9 w-auto"
          />
        </Link>
      </div>
    </header>
  );
}
