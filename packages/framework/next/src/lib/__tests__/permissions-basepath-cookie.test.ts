import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Regression cover for a fixed defect: `recoverAccessTokenFromCookies` called
 * `getToken` without a `cookieName`, so it looked for the STOCK NextAuth cookie
 * while `withIGRPAuth` had written a basePath-scoped one
 * (`next-auth.session-token.<slug>_p~`). No match → no token → every permission
 * check in a Server Action / Route Handler denied a user who held the
 * permission, but only in apps that set `NEXT_PUBLIC_BASE_PATH`.
 */

const getToken = vi.fn();
const cookiesGetAll = vi.fn<() => Array<{ name: string; value: string }>>();

vi.mock('next/navigation', () => ({
  forbidden: () => {
    throw new Error('FORBIDDEN');
  },
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ getAll: () => cookiesGetAll() }) }));
vi.mock('@igrp/framework-next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => getToken(...args),
}));
const decodeIGRPSessionToken = vi.fn();
vi.mock('@igrp/framework-next-auth/session-store', () => ({ decodeIGRPSessionToken }));

const { igrpEnsureAccessClientConfig } = await import('../permissions.js');
const { igrpResetAccessClientConfig } = await import('../api-config.js');

const BASE_PATH = '/apps/template';
/** What `withIGRPAuth` actually writes under that basePath. */
const SCOPED_COOKIE = 'next-auth.session-token.apps-template_p~';

beforeEach(() => {
  getToken.mockReset().mockResolvedValue({ accessToken: 'AT' });
  cookiesGetAll.mockReset();
  igrpResetAccessClientConfig();
  delete process.env.IGRP_PREVIEW_MODE;
  delete process.env.AUTH_PROVIDER;
  delete process.env.NEXT_PUBLIC_BASE_PATH;
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.IGRP_ACCESS_MANAGEMENT_API = 'https://am.example.test';
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_BASE_PATH;
});

describe('access-token recovery under a basePath', () => {
  it('asks getToken for the basePath-scoped cookie name', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = BASE_PATH;
    cookiesGetAll.mockReturnValue([{ name: SCOPED_COOKIE, value: 'opaque' }]);

    const config = await igrpEnsureAccessClientConfig();

    expect(getToken).toHaveBeenCalledTimes(1);
    expect(getToken.mock.calls[0]![0]).toMatchObject({ cookieName: SCOPED_COOKIE });
    expect(config.token).toBe('AT');
  });

  it('decodes with the session-store-aware decoder', async () => {
    // A store-backed cookie holds only a session id: plain decode would return
    // a token without `accessToken`, and every permission check would deny.
    process.env.NEXT_PUBLIC_BASE_PATH = BASE_PATH;
    cookiesGetAll.mockReturnValue([{ name: SCOPED_COOKIE, value: 'opaque' }]);

    await igrpEnsureAccessClientConfig();

    expect(getToken.mock.calls[0]![0]).toMatchObject({ decode: decodeIGRPSessionToken });
  });

  it('uses the __Secure- prefixed scoped name when the jar has one', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = BASE_PATH;
    cookiesGetAll.mockReturnValue([{ name: `__Secure-${SCOPED_COOKIE}`, value: 'opaque' }]);

    await igrpEnsureAccessClientConfig();

    expect(getToken.mock.calls[0]![0]).toMatchObject({
      cookieName: `__Secure-${SCOPED_COOKIE}`,
      secureCookie: true,
    });
  });

  it('asks for the terminated root name when there is no basePath', async () => {
    // A root-path app co-hosted with basePath apps: the jar holds another
    // app's cookie too, and the stock name would prefix-match it.
    cookiesGetAll.mockReturnValue([
      { name: 'next-auth.session-token~', value: 'opaque' },
      { name: SCOPED_COOKIE, value: 'someone-elses' },
    ]);

    await igrpEnsureAccessClientConfig();

    expect(getToken.mock.calls[0]![0]).toMatchObject({ cookieName: 'next-auth.session-token~' });
  });

  it('leaves getToken to derive the stock name when there is no basePath', async () => {
    cookiesGetAll.mockReturnValue([{ name: 'next-auth.session-token', value: 'opaque' }]);

    await igrpEnsureAccessClientConfig();

    expect(getToken.mock.calls[0]![0]).not.toHaveProperty('cookieName');
  });

  /**
   * `cookieIsolation: 'none'` keeps the STOCK cookie names even under a
   * basePath. Gating the scoped name on `NEXT_PUBLIC_BASE_PATH` alone fixed the
   * default configuration and broke this one — `next` cannot see the app's
   * `withIGRPAuth` options, so the name is decided from the jar instead.
   */
  it('leaves the stock name alone when the jar holds an unscoped cookie', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = BASE_PATH;
    cookiesGetAll.mockReturnValue([{ name: 'next-auth.session-token', value: 'opaque' }]);

    const config = await igrpEnsureAccessClientConfig();

    expect(getToken.mock.calls[0]![0]).not.toHaveProperty('cookieName');
    expect(config.token).toBe('AT');
  });

  it('matches a chunked scoped cookie (.0 / .1)', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = BASE_PATH;
    cookiesGetAll.mockReturnValue([
      { name: `${SCOPED_COOKIE}.0`, value: 'part0' },
      { name: `${SCOPED_COOKIE}.1`, value: 'part1' },
    ]);

    await igrpEnsureAccessClientConfig();

    expect(getToken.mock.calls[0]![0]).toMatchObject({ cookieName: SCOPED_COOKIE });
  });

  it("refuses a jar holding only another app's cookie", async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/apps/a';
    cookiesGetAll.mockReturnValue([{ name: 'next-auth.session-token~', value: 'center' }]);
    const config = await igrpEnsureAccessClientConfig();
    expect(getToken).not.toHaveBeenCalled();
    expect(config.token).toBe('');
  });

  it('still decodes chunked stock cookies (cookieIsolation: none)', async () => {
    cookiesGetAll.mockReturnValue([
      { name: 'next-auth.session-token.0', value: 'a' },
      { name: 'next-auth.session-token.1', value: 'b' },
    ]);
    await igrpEnsureAccessClientConfig();
    expect(getToken).toHaveBeenCalledTimes(1);
    expect(getToken.mock.calls[0]![0]).not.toHaveProperty('cookieName');
  });

  it("resolves its own scheme when the Center's __Secure- cookie is present", async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/apps/a';
    cookiesGetAll.mockReturnValue([
      { name: '__Secure-next-auth.session-token~', value: 'center' },
      { name: 'next-auth.session-token.apps-a_p~.0', value: 'own0' },
      { name: 'next-auth.session-token.apps-a_p~.1', value: 'own1' },
    ]);
    await igrpEnsureAccessClientConfig();
    expect(getToken.mock.calls[0]![0]).toMatchObject({
      secureCookie: false,
      cookieName: 'next-auth.session-token.apps-a_p~',
    });
  });
  it('decodes an unchunked secure stock cookie with secureCookie: true', async () => {
    cookiesGetAll.mockReturnValue([{ name: '__Secure-next-auth.session-token', value: 'own' }]);
    await igrpEnsureAccessClientConfig();
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
    process.env.NEXT_PUBLIC_BASE_PATH = '/apps/a';
    cookiesGetAll.mockReturnValue([
      { name: 'next-auth.session-token', value: 'own' },
      { name: '__Secure-next-auth.session-token~', value: 'center' },
    ]);
    await igrpEnsureAccessClientConfig();
    const arg = getToken.mock.calls[0]![0] as {
      secureCookie?: boolean;
      req: { cookies: Record<string, string> };
    };
    expect(arg.secureCookie).toBe(false);
    expect(arg.req.cookies).toHaveProperty(['next-auth.session-token']);
    expect(arg.req.cookies).not.toHaveProperty(['__Secure-next-auth.session-token~']);
  });

  it('decodes a stock cookie under a basePath (cookieIsolation: none)', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/apps/a';
    cookiesGetAll.mockReturnValue([{ name: 'next-auth.session-token', value: 'own' }]);
    const config = await igrpEnsureAccessClientConfig();
    expect(getToken.mock.calls[0]![0]).not.toHaveProperty('cookieName');
    expect(config.token).toBe('AT');
  });
});
