'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/lib/use-analytics';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.errorBoundary.viewed('app', error.digest);
  }, [analytics, error]);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-4 py-24">
      <div
        role="alert"
        className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container p-8 text-center"
      >
        <h1 className="font-headline text-xl font-semibold text-on-surface">Signal lost</h1>
        <p className="text-sm/[22px] text-on-surface-variant">
          We couldn&apos;t reach the character registry. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => {
            analytics.errorBoundary.retryClicked('app');
            reset();
          }}
          className="h-11 rounded-lg border border-transparent bg-primary-container px-4 font-semibold text-on-primary-container hover:bg-primary-container/90 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:outline-none md:h-10"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
