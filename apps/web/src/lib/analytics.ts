'use client';

import { sendGAEvent } from '@next/third-parties/google';

// Thin wrapper so the rest of the app does not depend on the GA library directly.
// No-op when GA is not configured.
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (!process.env.NEXT_PUBLIC_GA_ID) return;
  sendGAEvent('event', name, params);
}
