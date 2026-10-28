import { NextResponse, type NextRequest } from 'next/server';
import { requestToken } from '@/lib/api-client';
import { isTokenExpiring, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

// Makes sure every page request carries a valid API token in the session cookie. The token is
// requested from the API here, on the Next.js server, so the browser never talks to the API.
export async function proxy(request: NextRequest) {
  const current = request.cookies.get(SESSION_COOKIE)?.value;
  if (current && !isTokenExpiring(current)) return NextResponse.next();

  let accessToken: string;
  try {
    ({ accessToken } = await requestToken());
  } catch (err) {
    // The data layer requests its own token as a fallback, so the page can still try to render.
    console.error('Could not issue an API session token', err);
    return NextResponse.next();
  }

  // Forward the new cookie to this request's render, and persist it in the browser.
  request.cookies.set(SESSION_COOKIE, accessToken);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(SESSION_COOKIE, accessToken, sessionCookieOptions);
  return response;
}

export const config = {
  // Pages only: skip API routes, Next internals and files with an extension.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\..*).*)'],
};
