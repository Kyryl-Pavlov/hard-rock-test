import type { ReactNode } from 'react';
import { Icon } from '@/components/icons/icon';

// One step of a Breadcrumbs trail: a link to a parent page, or the current page as plain text.
// Every step after the first is preceded by a chevron.
export function BreadcrumbItem({
  children,
  current = false,
}: {
  children: ReactNode;
  current?: boolean;
}) {
  return (
    <li className="group flex min-w-0 items-center gap-1.5">
      <Icon
        name="chevronRight"
        className="size-4 shrink-0 text-on-surface-variant/70 group-first:hidden"
      />
      {current ? (
        <span aria-current="page" className="truncate text-on-surface">
          {children}
        </span>
      ) : (
        children
      )}
    </li>
  );
}
