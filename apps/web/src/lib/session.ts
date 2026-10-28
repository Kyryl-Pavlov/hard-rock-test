// The API access token (a JWT issued by apps/api) lives in an httpOnly session cookie, so browser
// JS never sees it. src/proxy.ts issues and refreshes it; server code reads it with cookies().

export const SESSION_COOKIE = 'rme_session';

// No maxAge/expires: a browser-session cookie. Expiry is tracked through the JWT's own `exp`.
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const;

const REFRESH_MARGIN_MS = 60_000;

// Reads `exp` without verifying the signature; the API verifies the token on every request.
// Unreadable tokens count as expiring so they get replaced.
export function isTokenExpiring(token: string, nowMs = Date.now()): boolean {
  const payload = token.split('.')[1];
  if (!payload) return true;

  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: unknown };
    if (typeof exp !== 'number') return true;
    return exp * 1000 - REFRESH_MARGIN_MS <= nowMs;
  } catch {
    return true;
  }
}
