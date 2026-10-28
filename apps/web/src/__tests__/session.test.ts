import { isTokenExpiring } from '@/lib/session';

function jwtWithPayload(payload: unknown): string {
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${encoded}.signature`;
}

describe('isTokenExpiring', () => {
  const now = 1_700_000_000_000;

  it('is false for a token that expires well in the future', () => {
    expect(isTokenExpiring(jwtWithPayload({ exp: now / 1000 + 3600 }), now)).toBe(false);
  });

  it('is true inside the refresh margin', () => {
    expect(isTokenExpiring(jwtWithPayload({ exp: now / 1000 + 30 }), now)).toBe(true);
  });

  it('is true for an expired token', () => {
    expect(isTokenExpiring(jwtWithPayload({ exp: now / 1000 - 1 }), now)).toBe(true);
  });

  it('is true when exp is missing or the token is malformed', () => {
    expect(isTokenExpiring(jwtWithPayload({ sub: 'x' }), now)).toBe(true);
    expect(isTokenExpiring('not-a-jwt', now)).toBe(true);
    expect(isTokenExpiring('a.%%%.c', now)).toBe(true);
  });
});
