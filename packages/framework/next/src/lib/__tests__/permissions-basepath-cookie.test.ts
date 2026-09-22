import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Regression cover for KNOWN-ISSUES #1: `recoverAccessTokenFromCookies` called
 * `getToken` without a `cookieName`, so it looked for the STOCK NextAuth cookie
 * while `withIGRPAuth` had written a basePath-scoped one
 * (`next-auth.session-token.<slug>~`). No match → no token → every permission
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

const { igrpEnsureAccessClientConfig } = await import('../permissions.js');
const { igrpResetAccessClientConfig } = await import('../api-config.js');

const BASE_PATH = '/apps/template';
/** What `withIGRPAuth` actually writes under that basePath. */
const SCOPED_COOKIE = 'next-auth.session-token.apps-template~';

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

  it('uses the __Secure- prefixed scoped name when the jar has one', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = BASE_PATH;
    cookiesGetAll.mockReturnValue([{ name: `__Secure-${SCOPED_COOKIE}`, value: 'opaque' }]);

    await igrpEnsureAccessClientConfig();

    expect(getToken.mock.calls[0]![0]).toMatchObject({
      cookieName: `__Secure-${SCOPED_COOKIE}`,
      secureCookie: true,
    });
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
});
