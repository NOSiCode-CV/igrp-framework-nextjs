import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression cover for a fixed defect: the access-token recovery in
 * `@igrp/framework-next` called `getToken` without a `cookieName`, so it looked
 * for the STOCK NextAuth cookie while `withIGRPAuth` had written a
 * basePath-scoped one (`next-auth.session-token.<slug>_p~`). No match → no
 * token → every permission check in a Server Action / Route Handler denied a
 * user who held the permission, but only in apps that set
 * `NEXT_PUBLIC_BASE_PATH`. The lookup now lives in `readIGRPSessionToken`.
 */

const getToken = vi.fn();
vi.mock('next-auth/jwt', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next-auth/jwt')>()),
  getToken: (...args: unknown[]) => getToken(...args),
}));

const { readIGRPSessionToken, decodeIGRPSessionToken } = await import('../session-store');

const BASE_PATH = '/apps/template';
/** What `withIGRPAuth` actually writes under that basePath. */
const SCOPED_COOKIE = 'next-auth.session-token.apps-template_p~';
const ROOT_ENV = { NEXTAUTH_URL: 'http://localhost:3000', NEXTAUTH_SECRET: 's' };
const BASE_ENV = { ...ROOT_ENV, NEXT_PUBLIC_BASE_PATH: BASE_PATH };

beforeEach(() => {
  getToken.mockReset().mockResolvedValue({ accessToken: 'AT' });
});

describe('readIGRPSessionToken', () => {
  it('asks getToken for the basePath-scoped cookie name', async () => {
    const jar = [{ name: SCOPED_COOKIE, value: 'opaque' }];

    const token = await readIGRPSessionToken(jar, BASE_ENV);

    expect(getToken).toHaveBeenCalledTimes(1);
    expect(getToken.mock.calls[0]![0]).toMatchObject({ cookieName: SCOPED_COOKIE });
    expect(token?.accessToken).toBe('AT');
  });

  it('decodes with the session-store-aware decoder', async () => {
    // A store-backed cookie holds only a session id: plain decode would return
    // a token without `accessToken`, and every permission check would deny.
    const jar = [{ name: SCOPED_COOKIE, value: 'opaque' }];

    await readIGRPSessionToken(jar, BASE_ENV);

    expect(getToken.mock.calls[0]![0]).toMatchObject({ decode: decodeIGRPSessionToken });
  });

  it('uses the __Secure- prefixed scoped name when the jar has one', async () => {
    const jar = [{ name: `__Secure-${SCOPED_COOKIE}`, value: 'opaque' }];

    await readIGRPSessionToken(jar, BASE_ENV);

    expect(getToken.mock.calls[0]![0]).toMatchObject({
      cookieName: `__Secure-${SCOPED_COOKIE}`,
      secureCookie: true,
    });
  });

  it('asks for the terminated root name when there is no basePath', async () => {
    // A root-path app co-hosted with basePath apps: the jar holds another
    // app's cookie too, and the stock name would prefix-match it.
    const jar = [
      { name: 'next-auth.session-token~', value: 'opaque' },
      { name: SCOPED_COOKIE, value: 'someone-elses' },
    ];

    await readIGRPSessionToken(jar, ROOT_ENV);

    expect(getToken.mock.calls[0]![0]).toMatchObject({ cookieName: 'next-auth.session-token~' });
  });

  it('leaves getToken to derive the stock name when there is no basePath', async () => {
    const jar = [{ name: 'next-auth.session-token', value: 'opaque' }];

    await readIGRPSessionToken(jar, ROOT_ENV);

    expect(getToken.mock.calls[0]![0]).not.toHaveProperty('cookieName');
  });

  /**
   * `cookieIsolation: 'none'` keeps the STOCK cookie names even under a
   * basePath. Gating the scoped name on `NEXT_PUBLIC_BASE_PATH` alone fixed the
   * default configuration and broke this one — `next` cannot see the app's
   * `withIGRPAuth` options, so the name is decided from the jar instead.
   */
  it('leaves the stock name alone when the jar holds an unscoped cookie', async () => {
    const jar = [{ name: 'next-auth.session-token', value: 'opaque' }];

    const token = await readIGRPSessionToken(jar, BASE_ENV);

    expect(getToken.mock.calls[0]![0]).not.toHaveProperty('cookieName');
    expect(token?.accessToken).toBe('AT');
  });

  it('matches a chunked scoped cookie (.0 / .1)', async () => {
    const jar = [
      { name: `${SCOPED_COOKIE}.0`, value: 'part0' },
      { name: `${SCOPED_COOKIE}.1`, value: 'part1' },
    ];

    await readIGRPSessionToken(jar, BASE_ENV);

    expect(getToken.mock.calls[0]![0]).toMatchObject({ cookieName: SCOPED_COOKIE });
  });

  it("refuses a jar holding only another app's cookie", async () => {
    const jar = [{ name: 'next-auth.session-token~', value: 'center' }];
    const token = await readIGRPSessionToken(jar, {
      ...ROOT_ENV,
      NEXT_PUBLIC_BASE_PATH: '/apps/a',
    });
    expect(getToken).not.toHaveBeenCalled();
    expect(token).toBeNull();
  });

  it('still decodes chunked stock cookies (cookieIsolation: none)', async () => {
    const jar = [
      { name: 'next-auth.session-token.0', value: 'a' },
      { name: 'next-auth.session-token.1', value: 'b' },
    ];
    await readIGRPSessionToken(jar, ROOT_ENV);
    expect(getToken).toHaveBeenCalledTimes(1);
    expect(getToken.mock.calls[0]![0]).not.toHaveProperty('cookieName');
  });

  it("resolves its own scheme when the Center's __Secure- cookie is present", async () => {
    const jar = [
      { name: '__Secure-next-auth.session-token~', value: 'center' },
      { name: 'next-auth.session-token.apps-a_p~.0', value: 'own0' },
      { name: 'next-auth.session-token.apps-a_p~.1', value: 'own1' },
    ];
    await readIGRPSessionToken(jar, { ...ROOT_ENV, NEXT_PUBLIC_BASE_PATH: '/apps/a' });
    expect(getToken.mock.calls[0]![0]).toMatchObject({
      secureCookie: false,
      cookieName: 'next-auth.session-token.apps-a_p~',
    });
  });
  it('decodes an unchunked secure stock cookie with secureCookie: true', async () => {
    const jar = [{ name: '__Secure-next-auth.session-token', value: 'own' }];
    await readIGRPSessionToken(jar, ROOT_ENV);
    expect(getToken.mock.calls[0]![0]).toMatchObject({ secureCookie: true });
    expect(getToken.mock.calls[0]![0]).not.toHaveProperty('cookieName');
  });

  /**
   * NextAuth collects every cookie whose name `startsWith` the stock name, so
   * the Center's `__Secure-next-auth.session-token~` must neither flip the
   * scheme to secure nor reach `getToken` at all. (Without a basePath that
   * cookie is this app's own scoped name, so the case needs one.)
   */
  it("hides the Center's secure cookie from a plain stock lookup", async () => {
    const jar = [
      { name: 'next-auth.session-token', value: 'own' },
      { name: '__Secure-next-auth.session-token~', value: 'center' },
    ];
    await readIGRPSessionToken(jar, { ...ROOT_ENV, NEXT_PUBLIC_BASE_PATH: '/apps/a' });
    const arg = getToken.mock.calls[0]![0] as {
      secureCookie?: boolean;
      req: { cookies: Record<string, string> };
    };
    expect(arg.secureCookie).toBe(false);
    expect(arg.req.cookies).toHaveProperty(['next-auth.session-token']);
    expect(arg.req.cookies).not.toHaveProperty(['__Secure-next-auth.session-token~']);
  });

  it('decodes a stock cookie under a basePath (cookieIsolation: none)', async () => {
    const jar = [{ name: 'next-auth.session-token', value: 'own' }];
    const token = await readIGRPSessionToken(jar, {
      ...ROOT_ENV,
      NEXT_PUBLIC_BASE_PATH: '/apps/a',
    });
    expect(getToken.mock.calls[0]![0]).not.toHaveProperty('cookieName');
    expect(token?.accessToken).toBe('AT');
  });
});
