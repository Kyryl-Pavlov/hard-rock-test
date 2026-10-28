'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useExplorerStore } from '@/store/explorer-store';

// The "Characters" breadcrumb. When the profile was opened from the list, it goes back in history,
// so the list returns as the user left it: same filters, loaded pages and scroll position (Next
// keeps the previous route alive). Otherwise (a direct visit or a reload) it links to the list.
export function CharactersCrumbLink() {
  const router = useRouter();
  const origin = useExplorerStore((s) => s.profileOrigin);

  return (
    <Link
      href={origin ?? '/'}
      // Only called for in-app navigations, so opening the link in a new tab still works.
      onNavigate={(event) => {
        if (origin === null) return;
        event.preventDefault();
        router.back();
      }}
      className="shrink-0 rounded-lg px-1 py-0.5 transition-colors hover:text-primary focus-visible:text-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none"
    >
      Characters
    </Link>
  );
}
