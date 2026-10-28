import type { ReactNode } from 'react';

// The trail of BreadcrumbItems from the top of the app down to the current page.
export function Breadcrumbs({ children }: { children: ReactNode }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13px]/[18px] font-medium text-on-surface-variant">
        {children}
      </ol>
    </nav>
  );
}
