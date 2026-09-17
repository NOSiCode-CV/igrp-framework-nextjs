import { describe, it, expect } from 'vitest';
import {
  basePathCookieSuffix,
  buildAuthCookies,
  resolveSecureCookie,
  sessionCookieName,
  SESSION_COOKIE_BASENAME,
} from '../cookies';

describe('basePathCookieSuffix', () => {
  it('slugifies a basePath', () => {
    expect(basePathCookieSuffix('/apps/template')).toBe('.apps-template');
    expect(basePathCookieSuffix('/Apps/My_App')).toBe('.apps-my-app');
  });

  it('returns empty for the root or an absent basePath', () => {
    expect(basePathCookieSuffix('')).toBe('');
    expect(basePathCookieSuffix('/')).toBe('');
    expect(basePathCookieSuffix(undefined)).toBe('');
    expect(basePathCookieSuffix('   ')).toBe('');
  });
});

describe('buildAuthCookies', () => {
  it('returns undefined without a basePath, leaving NextAuth defaults in place', () => {
    expect(buildAuthCookies('', true)).toBeUndefined();
    expect(buildAuthCookies('/', false)).toBeUndefined();
    expect(buildAuthCookies(undefined, true)).toBeUndefined();
  });

  it('scopes EVERY cookie, not just the session token', () => {
    // A shared csrf-token fails the other app's sign-in POST; a shared
    // pkce verifier breaks concurrent logins.
    const cookies = buildAuthCookies('/apps/a', false)!;
    for (const entry of Object.values(cookies)) {
      expect(entry.name).toContain('.apps-a');
    }
    expect(Object.keys(cookies).sort()).toEqual([
      'callbackUrl',
      'csrfToken',
      'nonce',
      'pkceCodeVerifier',
      'sessionToken',
      'state',
    ]);
  });

  it('gives two apps on one host distinct session-cookie names', () => {
    const a = buildAuthCookies('/apps/a', true)!.sessionToken.name;
    const b = buildAuthCookies('/apps/b', true)!.sessionToken.name;
    expect(a).not.toBe(b);
  });

  it('keeps the __Secure- prefix first so the browser still honours it', () => {
    const cookies = buildAuthCookies('/apps/a', true)!;
    expect(cookies.sessionToken.name.startsWith('__Secure-')).toBe(true);
    expect(cookies.sessionToken.options.secure).toBe(true);
  });

  it('uses __Host- for the csrf cookie only, as upstream does', () => {
    const cookies = buildAuthCookies('/apps/a', true)!;
    expect(cookies.csrfToken.name.startsWith('__Host-')).toBe(true);
    expect(cookies.csrfToken.options.path).toBe('/');
    expect(cookies.csrfToken.options.domain).toBeUndefined();
    expect(cookies.sessionToken.name.startsWith('__Host-')).toBe(false);
  });

  it('drops the prefixes over http', () => {
    const cookies = buildAuthCookies('/apps/a', false)!;
    expect(cookies.sessionToken.name).toBe('next-auth.session-token.apps-a');
    expect(cookies.csrfToken.name).toBe('next-auth.csrf-token.apps-a');
    expect(cookies.sessionToken.options.secure).toBe(false);
  });
});

describe('sessionCookieName', () => {
  it('matches what buildAuthCookies writes', () => {
    for (const secure of [true, false]) {
      expect(sessionCookieName('/apps/a', secure)).toBe(
        buildAuthCookies('/apps/a', secure)!.sessionToken.name,
      );
    }
  });

  it('falls back to the stock name without a basePath', () => {
    expect(sessionCookieName('', false)).toBe(SESSION_COOKIE_BASENAME);
    expect(sessionCookieName(undefined, true)).toBe(`__Secure-${SESSION_COOKIE_BASENAME}`);
  });
});

describe('resolveSecureCookie', () => {
  it('detects the secure prefix', () => {
    expect(resolveSecureCookie(['__Secure-next-auth.session-token'])).toBe(true);
  });

  it('detects the plain cookie', () => {
    expect(resolveSecureCookie(['next-auth.session-token'])).toBe(false);
  });

  it('returns undefined when no session cookie is present', () => {
    expect(resolveSecureCookie(['some-other-cookie'])).toBeUndefined();
    expect(resolveSecureCookie([])).toBeUndefined();
  });

  it('still works for chunked and basePath-scoped names', () => {
    // The suffix goes last precisely so startsWith() detection is unaffected.
    expect(resolveSecureCookie(['next-auth.session-token.apps-a'])).toBe(false);
    expect(resolveSecureCookie(['__Secure-next-auth.session-token.apps-a.0'])).toBe(true);
  });

  it('prefers secure when both are somehow present', () => {
    expect(
      resolveSecureCookie(['next-auth.session-token', '__Secure-next-auth.session-token']),
    ).toBe(true);
  });
});
