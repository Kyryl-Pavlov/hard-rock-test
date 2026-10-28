import type { ReactNode } from 'react';

// Panel heading: a primary dot and an uppercase title, with an optional micro-label on the right.
export function ProfileSectionHeading({
  id,
  children,
  aside,
}: {
  id: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2
        id={id}
        className="flex items-center gap-2 font-headline text-base/6 font-semibold tracking-wide text-on-surface uppercase"
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        {children}
      </h2>
      {aside ? (
        <p className="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
          {aside}
        </p>
      ) : null}
    </div>
  );
}
