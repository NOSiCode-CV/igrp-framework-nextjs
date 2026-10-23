import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as oidcModule from '../oidc';

// Mock revokeOidcSession so tests don't make real HTTP calls
vi.mock('../oidc', async (importOriginal) => {
  const original = await importOriginal<typeof oidcModule>();
  return {
    ...original,
    // Must resolve a real RevokeOidcSessionResult. Resolving `undefined` made
    // `if (!result.ok)` throw a TypeError that the event's own catch swallowed,
    // so every test in the signOut suite passed while the code under test never
    // once reached its success path.
    revokeOidcSession: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    introspectOidcToken: vi.fn().mockResolvedValue(true),
    refreshOidcAccessToken: vi
      .fn()
      .mockResolvedValue({ accessToken: 'refreshed-at', forceLogout: false }),
    getRecoveredToken: vi.fn().mockResolvedValue(null),
    configureOidcTokenRecoveryStore: vi.fn(),
  };
});

// Lazy-import withIGRPAuth after mocks are set up
async function getFactory() {
  const { withIGRPAuth } = await import('../config');
  return withIGRPAuth;
}

const VALID_ENV = {
  AUTH_PROVIDER: 'igrp-auth',
  IGRP_AUTH_CLIENT_ID: 'test-client',
  IGRP_AUTH_CLIENT_SECRET: 'test-secret',
  IGRP_AUTH_ISSUER: 'http://localhost:9090',
  NEXTAUTH_SECRET: 'test-secret-key',
};

describe('withIGRPAuth — events.signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(oidcModule.revokeOidcSession).mockResolvedValue({ ok: true, status: 200 });
  });

  it('completes the success path without logging a failure (guards mock fidelity)', async () => {
    // Regression guard for the suite itself: with a mock that resolved
    // `undefined`, every case below still passed while `if (!result.ok)` threw
    // and was swallowed. Assert the happy path is actually the happy path.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    await instance.authOptions.events!.signOut!({ token: { refreshToken: 'rt' } } as never);

    const logged = [...error.mock.calls, ...warn.mock.calls].map((c) => String(c[0]));
    error.mockRestore();
    warn.mockRestore();
    expect(logged, 'a successful revocation must log nothing').toEqual([]);
  });

  it('calls revokeOidcSession with the token on signOut for JWT sessions', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const signOutEvent = instance.authOptions.events?.signOut;
    expect(signOutEvent).toBeDefined();

    const mockToken = {
      refreshToken: 'rt-abc123',
      accessToken: 'at-abc123',
      authProviderId: 'igrp-auth' as const,
    };

    await signOutEvent!({ token: mockToken } as any);

    // Give microtask queue a tick for the fire-and-forget promise
    await new Promise((r) => setTimeout(r, 0));

    expect(oidcModule.revokeOidcSession).toHaveBeenCalledWith(mockToken, VALID_ENV);
  });

  it('does not call revokeOidcSession when AUTH_PROVIDER=none', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { AUTH_PROVIDER: 'none' } });
    const signOutEvent = instance.authOptions.events?.signOut;

    await signOutEvent?.({ token: { refreshToken: 'rt-abc' } } as any);
    await new Promise((r) => setTimeout(r, 0));

    expect(oidcModule.revokeOidcSession).not.toHaveBeenCalled();
  });

  it('does not call revokeOidcSession in preview mode', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { ...VALID_ENV, IGRP_PREVIEW_MODE: 'true' } });
    const signOutEvent = instance.authOptions.events?.signOut;

    await signOutEvent?.({ token: { refreshToken: 'rt-abc' } } as any);
    await new Promise((r) => setTimeout(r, 0));

    expect(oidcModule.revokeOidcSession).not.toHaveBeenCalled();
  });

  it('does not call revokeOidcSession when configError is set (invalid AUTH_PROVIDER)', async () => {
    const withIGRPAuth = await getFactory();
    // Pass an invalid AUTH_PROVIDER to trigger a configError
    const instance = withIGRPAuth({ env: { AUTH_PROVIDER: 'unsupported-provider' } });
    // configError should be set
    expect(instance.configError).not.toBeNull();
    const signOutEvent = instance.authOptions.events?.signOut;

    await signOutEvent?.({ token: { refreshToken: 'rt-abc' } } as any);
    await new Promise((r) => setTimeout(r, 0));

    expect(oidcModule.revokeOidcSession).not.toHaveBeenCalled();
  });

  it('does not throw when revokeOidcSession rejects', async () => {
    vi.mocked(oidcModule.revokeOidcSession).mockRejectedValueOnce(new Error('network error'));

    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const signOutEvent = instance.authOptions.events?.signOut;

    await expect(
      signOutEvent!({ token: { refreshToken: 'rt-abc' } } as any),
    ).resolves.toBeUndefined();

    await new Promise((r) => setTimeout(r, 0));
    expect(oidcModule.revokeOidcSession).toHaveBeenCalled();
    // No unhandled rejection — the fire-and-forget .catch() swallowed it
  });
});

describe('withIGRPAuth — serverSession', () => {
  it('returns null when there is no session (getServerSession returns null)', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });

    vi.doMock('next-auth', () => ({
      getServerSession: vi.fn().mockResolvedValue(null),
    }));

    const session = await instance.serverSession();
    expect(session).toBeNull();
  });

  it('rethrows errors from getServerSession instead of swallowing them', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });

    vi.doMock('next-auth', () => ({
      getServerSession: vi.fn().mockRejectedValue(new Error('OIDC network failure')),
    }));

    await expect(instance.serverSession()).rejects.toThrow('OIDC network failure');
  });

  it('throws configError when configuration is invalid', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { AUTH_PROVIDER: 'igrp-auth' } });
    await expect(instance.serverSession()).rejects.toThrow();
  });

  it('re-reads the session on every call outside an RSC render (the React.cache memo never outlives a request)', async () => {
    const getServerSession = vi
      .fn()
      .mockResolvedValueOnce({ accessToken: 'user-a' })
      .mockResolvedValueOnce({ accessToken: 'user-b' });
    vi.doMock('next-auth', () => ({ getServerSession }));
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });

    // No React render scope here — as in a Route Handler or Server Action — so
    // cache() is a passthrough. If it memoized, the second caller would be
    // handed the first caller's session.
    await expect(instance.serverSession()).resolves.toMatchObject({ accessToken: 'user-a' });
    await expect(instance.serverSession()).resolves.toMatchObject({ accessToken: 'user-b' });
    expect(getServerSession).toHaveBeenCalledTimes(2);
  });
});

describe('withIGRPAuth — getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  function mockServerSession(value: unknown) {
    vi.doMock('next-auth', () => ({
      getServerSession: vi.fn().mockResolvedValue(value),
    }));
  }

  it('returns the session unchanged when valid and not expired', async () => {
    mockServerSession({ accessToken: 'at', expiresAt: Date.now() + 3_600_000 });
    const withIGRPAuth = await getFactory();
    const onSessionExpired = vi.fn();
    const instance = withIGRPAuth({ env: VALID_ENV, onSessionExpired });

    const session = await instance.getSession();
    expect(session).not.toBeNull();
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('calls onSessionExpired when refresh failed (RefreshAccessTokenError)', async () => {
    mockServerSession({
      accessToken: 'at',
      expiresAt: Date.now() + 3_600_000,
      error: 'RefreshAccessTokenError',
    });
    const withIGRPAuth = await getFactory();
    const onSessionExpired = vi.fn();
    const instance = withIGRPAuth({ env: VALID_ENV, onSessionExpired });

    const session = await instance.getSession();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(session).toBeNull();
  });

  it('calls onSessionExpired when the provider token is expired', async () => {
    mockServerSession({ accessToken: 'at', expiresAt: Date.now() - 10_000 });
    const withIGRPAuth = await getFactory();
    const onSessionExpired = vi.fn();
    const instance = withIGRPAuth({ env: VALID_ENV, onSessionExpired });

    const session = await instance.getSession();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(session).toBeNull();
  });

  it('does NOT swallow a redirect thrown by onSessionExpired (regression)', async () => {
    // `redirect()` from next/navigation signals via a thrown NEXT_REDIRECT
    // error. getSession must let it propagate, not catch it — otherwise the
    // intended /logout redirect is silently cancelled and a dead session stays
    // mounted (the bug that surfaced as global-error on failed refresh).
    mockServerSession({
      accessToken: 'at',
      expiresAt: Date.now() + 3_600_000,
      error: 'RefreshAccessTokenError',
    });
    const withIGRPAuth = await getFactory();
    const redirectError = Object.assign(new Error('NEXT_REDIRECT'), {
      digest: 'NEXT_REDIRECT;replace;/logout;307;',
    });
    const onSessionExpired = vi.fn(() => {
      throw redirectError;
    });
    const instance = withIGRPAuth({ env: VALID_ENV, onSessionExpired });

    await expect(instance.getSession()).rejects.toBe(redirectError);
  });
});

describe('withIGRPAuth — isTokenExpiredOrFailed (middleware grace)', () => {
  it('does NOT treat a token 30s from expiry as expired (lets the client refresh win)', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    expect(instance.isTokenExpiredOrFailed({ expiresAt: Date.now() + 30_000 } as any)).toBe(false);
  });

  it('treats an already-expired token as expired', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    expect(instance.isTokenExpiredOrFailed({ expiresAt: Date.now() - 1_000 } as any)).toBe(true);
  });

  it('treats a refresh-error token as expired regardless of expiry', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    expect(
      instance.isTokenExpiredOrFailed({
        expiresAt: Date.now() + 3_600_000,
        error: 'RefreshAccessTokenError',
      } as any),
    ).toBe(true);
  });
});

describe('withIGRPAuth — jwt callback refresh (no introspection)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: token is active, refresh succeeds
    vi.mocked(oidcModule.introspectOidcToken).mockResolvedValue(true);
    vi.mocked(oidcModule.refreshOidcAccessToken).mockResolvedValue({
      accessToken: 'new-at',
      forceLogout: false,
      error: undefined,
    } as any);
  });

  it('never introspects the refresh token before refreshing', async () => {
    // Introspecting a rotated-out refresh token with token_type_hint=refresh_token
    // trips the IdP's reuse detection and revokes the session — and the refresh
    // itself already reports a revoked token (invalid_grant).

    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const jwtCallback = instance.authOptions.callbacks?.jwt;

    const expiredToken = {
      accessToken: 'at-old',
      refreshToken: 'rt-old',
      authProviderId: 'igrp-auth' as const,
      expiresAt: Date.now() - 10_000, // expired, in ms
    };

    const result = await jwtCallback!({ token: expiredToken, account: null } as any);

    expect(oidcModule.introspectOidcToken).not.toHaveBeenCalled();
    expect(oidcModule.refreshOidcAccessToken).toHaveBeenCalledTimes(1);
    expect((result as any).accessToken).toBe('new-at');
  });

  it('forces logout when the refresh reports a revoked refresh token', async () => {
    vi.mocked(oidcModule.refreshOidcAccessToken).mockResolvedValue({
      error: 'RefreshAccessTokenError',
      forceLogout: true,
    } as any);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const withIGRPAuth = await getFactory();
    const jwtCallback = withIGRPAuth({ env: VALID_ENV }).authOptions.callbacks?.jwt;
    const result = await jwtCallback!({
      token: {
        accessToken: 'at-old',
        refreshToken: 'rt-revoked',
        authProviderId: 'igrp-auth' as const,
        expiresAt: Date.now() - 10_000,
      },
      account: null,
    } as any);

    expect((result as any).forceLogout).toBe(true);
    expect((result as any).error).toBe('RefreshAccessTokenError');
  });

  it('clears stale error/forceLogout when returning a still-valid token without refresh', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const jwtCallback = instance.authOptions.callbacks?.jwt;

    // Token has 30 minutes left — comfortably inside the refresh buffer, so
    // the callback takes the early-return path. The stale `error` /
    // `forceLogout` flags (e.g. carried from a prior failed attempt whose
    // rotated cookie couldn't be persisted from an RSC tree) must be cleared
    // here, otherwise they stick forever and trip the client session watcher.
    const validButTaggedToken = {
      accessToken: 'at-valid',
      refreshToken: 'rt-valid',
      authProviderId: 'igrp-auth' as const,
      expiresAt: Date.now() + 30 * 60_000,
      error: 'RefreshAccessTokenError',
      forceLogout: true,
    };

    const result = (await jwtCallback!({
      token: validButTaggedToken,
      account: null,
    } as any)) as any;

    expect(result.error).toBeUndefined();
    expect(result.forceLogout).toBe(false);
    expect(oidcModule.refreshOidcAccessToken).not.toHaveBeenCalled();
    expect(oidcModule.introspectOidcToken).not.toHaveBeenCalled();
  });

  it('calls refresh with the expired token', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const jwtCallback = instance.authOptions.callbacks?.jwt;

    const expiredToken = {
      accessToken: 'at-old',
      refreshToken: 'rt-old',
      authProviderId: 'igrp-auth' as const,
      expiresAt: Date.now() - 10_000,
    };

    await jwtCallback!({ token: expiredToken, account: null } as any);

    expect(oidcModule.refreshOidcAccessToken).toHaveBeenCalledWith(expiredToken, VALID_ENV);
  });
});

describe('withIGRPAuth — callbacks.redirect', () => {
  const REDIRECT_ENV = {
    ...VALID_ENV,
    NEXTAUTH_URL: 'http://localhost:3000/apps/template/api/auth',
    NEXTAUTH_URL_INTERNAL: 'http://internal-svc:3000/apps/template/api/auth',
    NEXT_PUBLIC_IGRP_APP_HOME_SLUG: '/',
  };

  // What next-auth v4 ACTUALLY passes as `baseUrl`: `url.origin` — protocol +
  // host only. `createCallbackUrl` (next-auth/core/lib/callback-url) calls
  // `callbacks.redirect({ url, baseUrl: options.url.origin })`, so the path of
  // NEXTAUTH_URL (the basePath, and the `/api/auth` suffix) is ALWAYS gone by
  // the time the callback runs. Earlier fixtures here passed NEXTAUTH_URL
  // verbatim, which is why the "post-login redirect drops the basePath" bug
  // went unnoticed: the tests supplied the very information the real caller
  // strips. `next-auth-callback-contract.test.ts` pins this shape against the
  // real library.
  const ORIGIN = 'http://localhost:3000';
  const NEXTAUTH_BASE = 'http://localhost:3000/apps/template/api/auth';
  const APP_BASE = 'http://localhost:3000/apps/template';
  const HOME = APP_BASE + '/';

  async function getRedirect(envOverrides: Record<string, string> = {}) {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { ...REDIRECT_ENV, ...envOverrides } });
    return instance.authOptions.callbacks!.redirect!;
  }

  it('resolves a relative callbackUrl against the app base, not the auth API base', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '/some/page', baseUrl: ORIGIN });
    expect(result).toBe(`${APP_BASE}/some/page`);
  });

  it('honors a relative callbackUrl with query string', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '/list?tab=open', baseUrl: ORIGIN });
    expect(result).toBe(`${APP_BASE}/list?tab=open`);
  });

  it('honors a same-origin absolute callbackUrl', async () => {
    const redirect = await getRedirect();
    const absolute = `${APP_BASE}/deep/path`;
    const result = await redirect({ url: absolute, baseUrl: ORIGIN });
    expect(result).toBe(absolute);
  });

  it('lands on the app home — never the /api/auth root — when url equals baseUrl', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: ORIGIN, baseUrl: ORIGIN });
    expect(result).toBe(HOME);
    expect(result).not.toContain('/api/auth');
  });

  it('never redirects the browser to NEXTAUTH_URL_INTERNAL', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '', baseUrl: ORIGIN });
    expect(result).toBe(HOME);
    expect(result).not.toContain('internal-svc');
  });

  it('resolves home against the configured app home slug', async () => {
    const redirect = await getRedirect({ NEXT_PUBLIC_IGRP_APP_HOME_SLUG: 'home' });
    const result = await redirect({ url: ORIGIN, baseUrl: ORIGIN });
    expect(result).toBe(`${APP_BASE}/home`);
  });

  it('falls back to NEXTAUTH_URL when baseUrl is empty (defensive — next-auth never does this)', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '/some/page', baseUrl: '' });
    expect(result).toBe(`${APP_BASE}/some/page`);
  });

  it('sends the auth chrome (/login, /logout) to home instead of bouncing back', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '/login?callbackUrl=%2Fx', baseUrl: ORIGIN })).toBe(HOME);
    expect(await redirect({ url: '/logout', baseUrl: ORIGIN })).toBe(HOME);
    expect(await redirect({ url: `${APP_BASE}/login`, baseUrl: ORIGIN })).toBe(HOME);
  });

  it('rejects protocol-relative URLs (open-redirect guard)', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '//evil.com/path', baseUrl: ORIGIN })).toBe(HOME);
  });

  it('rejects cross-origin absolute URLs', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: 'http://evil.com/path', baseUrl: ORIGIN })).toBe(HOME);
  });

  it('rejects a backslash protocol-relative bypass (open-redirect guard)', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '/\\evil.com', baseUrl: ORIGIN })).toBe(HOME);
  });

  it('rejects a path-traversal callbackUrl', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '/a/../../admin', baseUrl: ORIGIN })).toBe(HOME);
  });

  it('keeps the basePath from NEXTAUTH_URL when baseUrl is origin-only (regression)', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '/dashboard', baseUrl: ORIGIN })).toBe(`${APP_BASE}/dashboard`);
  });

  it('does not double-prefix a callbackUrl that already carries the basePath', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '/apps/template/dashboard?x=1', baseUrl: ORIGIN })).toBe(
      `${APP_BASE}/dashboard?x=1`,
    );
    expect(await redirect({ url: '/apps/template', baseUrl: ORIGIN })).toBe(HOME);
  });

  it('matches the basePath on a segment boundary only', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '/apps/template-other/x', baseUrl: ORIGIN })).toBe(
      `${APP_BASE}/apps/template-other/x`,
    );
  });

  it('sends the basePath-prefixed auth chrome to home', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '/apps/template/login', baseUrl: ORIGIN })).toBe(HOME);
    expect(await redirect({ url: '/apps/template/logout?x=1', baseUrl: ORIGIN })).toBe(HOME);
  });

  it('resolves NEXT_PUBLIC_IGRP_APP_HOME_SLUG=/dashboard under the basePath', async () => {
    const redirect = await getRedirect({ NEXT_PUBLIC_IGRP_APP_HOME_SLUG: '/dashboard' });
    expect(await redirect({ url: ORIGIN, baseUrl: ORIGIN })).toBe(`${APP_BASE}/dashboard`);
    expect(await redirect({ url: '/login', baseUrl: ORIGIN })).toBe(`${APP_BASE}/dashboard`);
  });

  it('sends a same-origin absolute URL outside the basePath to home', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: `${ORIGIN}/dashboard`, baseUrl: ORIGIN })).toBe(HOME);
    expect(await redirect({ url: `${ORIGIN}/apps/template-other/x`, baseUrl: ORIGIN })).toBe(HOME);
  });

  it('trusts a baseUrl that already carries a path (custom callers)', async () => {
    const redirect = await getRedirect({ NEXTAUTH_URL: 'http://localhost:3000/ignored/api/auth' });
    expect(await redirect({ url: '/some/page', baseUrl: NEXTAUTH_BASE })).toBe(
      `${APP_BASE}/some/page`,
    );
  });

  it('falls back to NEXT_PUBLIC_BASE_PATH when NEXTAUTH_URL has no path', async () => {
    const redirect = await getRedirect({
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXT_PUBLIC_BASE_PATH: '/apps/template',
    });
    expect(await redirect({ url: '/dashboard', baseUrl: ORIGIN })).toBe(`${APP_BASE}/dashboard`);
  });

  it('prefers NEXTAUTH_URL over a disagreeing NEXT_PUBLIC_BASE_PATH and warns once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const redirect = await getRedirect({ NEXT_PUBLIC_BASE_PATH: '/apps/other' });
    expect(await redirect({ url: '/a', baseUrl: ORIGIN })).toBe(`${APP_BASE}/a`);
    expect(await redirect({ url: '/b', baseUrl: ORIGIN })).toBe(`${APP_BASE}/b`);
    const hits = warn.mock.calls.filter((c) => String(c[0]).includes('NEXT_PUBLIC_BASE_PATH'));
    warn.mockRestore();
    expect(hits).toHaveLength(1);
  });

  it('is unchanged for an app without a basePath', async () => {
    const redirect = await getRedirect({ NEXTAUTH_URL: 'http://localhost:3000/api/auth' });
    expect(await redirect({ url: '/dashboard', baseUrl: ORIGIN })).toBe(`${ORIGIN}/dashboard`);
    expect(await redirect({ url: ORIGIN, baseUrl: ORIGIN })).toBe(`${ORIGIN}/`);
    expect(await redirect({ url: '/login', baseUrl: ORIGIN })).toBe(`${ORIGIN}/`);
  });

  it('defers to callbackExtensions.redirect when provided', async () => {
    const withIGRPAuth = await getFactory();
    const customRedirect = vi.fn().mockResolvedValue('/custom');
    const instance = withIGRPAuth({
      env: REDIRECT_ENV,
      callbacks: { redirect: customRedirect },
    });
    const result = await instance.authOptions.callbacks!.redirect!({
      url: '/some/page',
      baseUrl: ORIGIN,
    });
    expect(customRedirect).toHaveBeenCalledWith({ url: '/some/page', baseUrl: ORIGIN });
    expect(result).toBe('/custom');
  });
});

describe('withIGRPAuth — getLoginRedirectUrl', () => {
  const LOGIN_ENV: Record<string, string | undefined> = {
    ...VALID_ENV,
    NEXTAUTH_URL: 'http://localhost:3000/apps/template/api/auth',
    NEXTAUTH_URL_INTERNAL: 'http://internal-svc:3000/apps/template/api/auth',
  };

  async function getInstance(envOverrides: Record<string, string | undefined> = {}) {
    const withIGRPAuth = await getFactory();
    return withIGRPAuth({ env: { ...LOGIN_ENV, ...envOverrides } });
  }

  it('builds a browser-reachable URL from NEXTAUTH_URL, not NEXTAUTH_URL_INTERNAL', async () => {
    const instance = await getInstance();
    const url = instance.getLoginRedirectUrl({ url: 'http://localhost:3000/apps/template/x' });
    expect(url.toString()).toBe('http://localhost:3000/apps/template/login');
    expect(url.host).not.toBe('internal-svc:3000');
  });

  it('recovers the basePath from NEXTAUTH_URL when NEXT_PUBLIC_BASE_PATH is unset', async () => {
    const instance = await getInstance();
    expect(instance.getLoginRedirectUrl({ url: 'http://localhost:3000/x' }).pathname).toBe(
      '/apps/template/login',
    );
  });

  it('prefers an explicit NEXT_PUBLIC_BASE_PATH from the injected env', async () => {
    const instance = await getInstance({ NEXT_PUBLIC_BASE_PATH: '/other' });
    expect(instance.getLoginRedirectUrl({ url: 'http://localhost:3000/x' }).pathname).toBe(
      '/other/login',
    );
  });

  it('falls back to the request origin when NEXTAUTH_URL is unset', async () => {
    const instance = await getInstance({ NEXTAUTH_URL: undefined });
    expect(
      instance.getLoginRedirectUrl({ url: 'https://public.example/some/page' }).toString(),
    ).toBe('https://public.example/login');
  });
});

describe('withIGRPAuth — callbacks.session', () => {
  it('populates session.user.id from the token subject', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const result = (await instance.authOptions.callbacks!.session!({
      session: { user: { name: 'Ana', email: 'ana@example.com' }, expires: 'x' },
      token: { sub: 'user-123', accessToken: 'at' },
    } as never)) as { user?: { id?: string; name?: string } };

    expect(result.user?.id).toBe('user-123');
    expect(result.user?.name).toBe('Ana');
  });

  it('prefers token.user.id over token.sub when a jwt extension set one', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const result = (await instance.authOptions.callbacks!.session!({
      session: { user: {}, expires: 'x' },
      token: { sub: 'from-sub', user: { id: 'from-user' } },
    } as never)) as { user?: { id?: string } };

    expect(result.user?.id).toBe('from-user');
  });
});

describe('withIGRPAuth — jwt callback rotation recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses a recovered token and skips introspection + refresh on a cache hit', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const jwtCb = instance.authOptions.callbacks?.jwt;
    expect(jwtCb).toBeDefined();

    const recoveredToken = {
      refreshToken: 'new-rt',
      accessToken: 'new-at',
      expiresAt: Date.now() + 180_000,
      error: undefined,
      forceLogout: false,
    };
    (oidcModule.getRecoveredToken as ReturnType<typeof vi.fn>).mockResolvedValue(recoveredToken);

    // Expired access token; the cookie still holds the OLD refresh token.
    const expiredToken = {
      refreshToken: 'old-rt',
      accessToken: 'old-at',
      expiresAt: Date.now() - 1000,
    };

    const result = (await jwtCb!({ token: expiredToken, account: undefined } as any)) as any;

    expect(oidcModule.getRecoveredToken).toHaveBeenCalledWith('old-rt');
    expect(oidcModule.introspectOidcToken).not.toHaveBeenCalled();
    expect(oidcModule.refreshOidcAccessToken).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('new-at');
    expect(result.refreshToken).toBe('new-rt');
    expect(result.forceLogout).toBe(false);
  });

  it('falls through to refresh when there is no recovered token', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const jwtCb = instance.authOptions.callbacks?.jwt;

    (oidcModule.getRecoveredToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const expiredToken = {
      refreshToken: 'old-rt',
      accessToken: 'old-at',
      expiresAt: Date.now() - 1000,
    };
    await jwtCb!({ token: expiredToken, account: undefined } as any);

    expect(oidcModule.introspectOidcToken).not.toHaveBeenCalled();
    expect(oidcModule.refreshOidcAccessToken).toHaveBeenCalled();
  });
});

describe('withIGRPAuth — tokenRecoveryStore option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards the store to configureOidcTokenRecoveryStore at construction', async () => {
    const withIGRPAuth = await getFactory();
    const store = { get: vi.fn(async () => null), set: vi.fn(async () => {}) };

    withIGRPAuth({ env: VALID_ENV, tokenRecoveryStore: store });

    expect(oidcModule.configureOidcTokenRecoveryStore).toHaveBeenCalledWith(store);
  });

  it('leaves the default store alone when the option is absent', async () => {
    const withIGRPAuth = await getFactory();

    withIGRPAuth({ env: VALID_ENV });

    expect(oidcModule.configureOidcTokenRecoveryStore).not.toHaveBeenCalled();
  });
});

describe('withIGRPAuth — getSession does not swallow Next control flow', () => {
  async function instanceWithFailingSession(error: unknown) {
    vi.resetModules();
    const getServerSession = vi.fn().mockRejectedValue(error);
    vi.doMock('next-auth', () => ({ default: vi.fn(), getServerSession }));
    const { withIGRPAuth } = await import('../config');
    return withIGRPAuth({ env: VALID_ENV });
  }

  it('rethrows the static-render bailout instead of reporting "no session"', async () => {
    // Swallowing it means the route is never marked dynamic and the page
    // renders — and can be cached — as logged out.
    const bailout = Object.assign(new Error('Dynamic server usage'), {
      digest: 'DYNAMIC_SERVER_USAGE',
    });
    const instance = await instanceWithFailingSession(bailout);
    await expect(instance.getSession()).rejects.toBe(bailout);
    vi.doUnmock('next-auth');
    vi.resetModules();
  });

  it('rethrows a redirect() raised during the session read', async () => {
    const redirectSignal = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT' });
    const instance = await instanceWithFailingSession(redirectSignal);
    await expect(instance.getSession()).rejects.toBe(redirectSignal);
    vi.doUnmock('next-auth');
    vi.resetModules();
  });

  it('still treats a genuine cookie-decode failure as "no session"', async () => {
    const instance = await instanceWithFailingSession(new Error('JWE decryption failed'));
    await expect(instance.getSession()).resolves.toBeNull();
    vi.doUnmock('next-auth');
    vi.resetModules();
  });
});

describe('withIGRPAuth — cookie isolation', () => {
  it('scopes cookie names to the basePath so co-hosted apps stop colliding', async () => {
    const withIGRPAuth = await getFactory();
    const a = withIGRPAuth({ env: { ...VALID_ENV, NEXT_PUBLIC_BASE_PATH: '/apps/a' } });
    const b = withIGRPAuth({ env: { ...VALID_ENV, NEXT_PUBLIC_BASE_PATH: '/apps/b' } });

    const nameA = a.authOptions.cookies!.sessionToken!.name;
    const nameB = b.authOptions.cookies!.sessionToken!.name;
    expect(nameA).toBe('next-auth.session-token.apps-a_p~');
    expect(nameB).toBe('next-auth.session-token.apps-b_p~');
  });

  it('terminates a root-path app’s names so they cannot prefix a basePath app’s', async () => {
    // The stock `next-auth.session-token` is a prefix of every scoped name, so
    // a co-hosted root app collected — and, on the decode failure, deleted —
    // every other app's session cookie.
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    expect(instance.authOptions.cookies!.sessionToken!.name).toBe('next-auth.session-token~');
  });

  it('uses the __Secure- prefix when NEXTAUTH_URL is https', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({
      env: {
        ...VALID_ENV,
        NEXT_PUBLIC_BASE_PATH: '/apps/a',
        NEXTAUTH_URL: 'https://host/apps/a/api/auth',
      },
    });
    expect(instance.authOptions.cookies!.sessionToken!.name).toBe(
      '__Secure-next-auth.session-token.apps-a_p~',
    );
  });

  it('can be opted out of', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({
      env: { ...VALID_ENV, NEXT_PUBLIC_BASE_PATH: '/apps/a' },
      cookieIsolation: 'none',
    });
    expect(instance.authOptions.cookies).toBeUndefined();
  });
});

describe('withIGRPAuth — secure-cookie derivation', () => {
  const BASE = { ...VALID_ENV, NEXT_PUBLIC_BASE_PATH: '/apps/a' };

  it('follows NEXTAUTH_URL when it is set', async () => {
    const withIGRPAuth = await getFactory();
    const https = withIGRPAuth({ env: { ...BASE, NEXTAUTH_URL: 'https://h/apps/a/api/auth' } });
    const http = withIGRPAuth({ env: { ...BASE, NEXTAUTH_URL: 'http://h/apps/a/api/auth' } });

    expect(https.authOptions.cookies!.sessionToken!.name).toContain('__Secure-');
    expect(https.authOptions.useSecureCookies).toBe(true);
    expect(http.authOptions.cookies!.sessionToken!.name).not.toContain('__Secure-');
    expect(http.authOptions.useSecureCookies).toBe(false);
  });

  it('assumes https under AUTH_TRUST_HOST when NEXTAUTH_URL is unset', async () => {
    // Regression: reading NEXTAUTH_URL alone stripped the Secure flag from a
    // session cookie served over HTTPS behind a TLS-terminating proxy, because
    // next-auth's own detectOrigin() falls back to x-forwarded-proto here.
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({
      env: { ...BASE, NEXTAUTH_URL: undefined, AUTH_TRUST_HOST: '1' },
    });
    expect(instance.authOptions.cookies!.sessionToken!.name).toContain('__Secure-');
    expect(instance.authOptions.cookies!.sessionToken!.options.secure).toBe(true);
    expect(instance.authOptions.useSecureCookies).toBe(true);
  });

  it('assumes https under VERCEL too', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { ...BASE, NEXTAUTH_URL: undefined, VERCEL: '1' } });
    expect(instance.authOptions.useSecureCookies).toBe(true);
  });

  it('falls back to insecure when nothing indicates https', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { ...BASE, NEXTAUTH_URL: undefined } });
    expect(instance.authOptions.useSecureCookies).toBe(false);
  });

  it('honours an explicit secureCookies override', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({
      env: { ...BASE, NEXTAUTH_URL: undefined, AUTH_TRUST_HOST: '1' },
      secureCookies: false,
    });
    expect(instance.authOptions.useSecureCookies).toBe(false);
    expect(instance.authOptions.cookies!.sessionToken!.name).not.toContain('__Secure-');
  });

  it('pins useSecureCookies for a root-path app too, since it now overrides names', async () => {
    const withIGRPAuth = await getFactory();
    const https = withIGRPAuth({
      env: { ...VALID_ENV, NEXTAUTH_URL: 'https://h/api/auth' },
    });
    expect(https.authOptions.useSecureCookies).toBe(true);
    expect(https.authOptions.cookies!.sessionToken!.name).toBe('__Secure-next-auth.session-token~');
  });

  it('leaves useSecureCookies unset when isolation is opted out of', async () => {
    // No cookie override there, so next-auth keeps deriving both sides itself.
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV, cookieIsolation: 'none' });
    expect(instance.authOptions.useSecureCookies).toBeUndefined();
    expect(instance.authOptions.cookies).toBeUndefined();
  });
});

describe('withIGRPAuth — initial access-token expiry', () => {
  const NOW = 1_700_000_000_000;

  function jwtWithExp(expSeconds: number): string {
    const b64 = (v: string) =>
      Buffer.from(v, 'utf-8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return [b64('{"alg":"none"}'), b64(JSON.stringify({ exp: expSeconds })), 'sig'].join('.');
  }

  async function signIn(account: Record<string, unknown>) {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    return (await instance.authOptions.callbacks!.jwt!({
      token: {},
      account,
    } as never)) as { expiresAt?: number };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  it('prefers account.expires_at', async () => {
    const t = await signIn({ access_token: 'at', expires_at: NOW / 1000 + 180 });
    expect(t.expiresAt).toBe(NOW + 180_000);
  });

  it('falls back to account.expires_in', async () => {
    const t = await signIn({ access_token: 'at', expires_in: 180 });
    expect(t.expiresAt).toBe(NOW + 180_000);
  });

  it("reads the access token's own exp when the IdP sent neither", async () => {
    // Previously this invented a full hour, so a ~3-minute token looked healthy
    // for 57 minutes of guaranteed 401s.
    const t = await signIn({ access_token: jwtWithExp(NOW / 1000 + 180) });
    expect(t.expiresAt).toBe(NOW + 180_000);
  });

  it('uses a short, self-correcting fallback for an opaque token with no hints', async () => {
    const t = await signIn({ access_token: 'opaque-not-a-jwt' });
    expect(t.expiresAt).toBe(NOW + 5 * 60_000);
    expect(t.expiresAt).toBeLessThan(NOW + 3600 * 1000);
  });
});

describe('withIGRPAuth — resolveAppUrl', () => {
  const ENV = {
    ...VALID_ENV,
    NEXTAUTH_URL: 'https://public.example/apps/t/api/auth',
    NEXTAUTH_URL_INTERNAL: 'http://pod:3000/apps/t/api/auth',
  };

  async function instance(overrides: Record<string, string | undefined> = {}) {
    const withIGRPAuth = await getFactory();
    return withIGRPAuth({ env: { ...ENV, ...overrides } });
  }

  it('resolves against the public origin, not the internal request origin', async () => {
    // Behind a TLS-terminating proxy request.url is the pod URL; redirecting
    // there sends the browser somewhere it cannot reach.
    const auth = await instance();
    expect(auth.resolveAppUrl('/', { url: 'http://pod:3000/apps/t/x' }).toString()).toBe(
      'https://public.example/apps/t/',
    );
    expect(auth.resolveAppUrl('/some/page', { url: 'http://pod:3000/apps/t/x' }).toString()).toBe(
      'https://public.example/apps/t/some/page',
    );
  });

  it('never resolves against NEXTAUTH_URL_INTERNAL', async () => {
    const auth = await instance();
    expect(auth.resolveAppUrl('/', { url: 'http://pod:3000/x' }).host).not.toBe('pod:3000');
  });

  it('accepts a path with or without a leading slash', async () => {
    const auth = await instance();
    expect(auth.resolveAppUrl('login', { url: 'https://public.example/' }).pathname).toBe(
      '/apps/t/login',
    );
  });

  it('falls back to the request origin when NEXTAUTH_URL is unset', async () => {
    const auth = await instance({ NEXTAUTH_URL: undefined });
    expect(auth.resolveAppUrl('/x', { url: 'https://req.example/anything' }).toString()).toBe(
      'https://req.example/x',
    );
  });

  it('getLoginRedirectUrl is resolveAppUrl applied to the configured loginUrl', async () => {
    const auth = await instance();
    const req = { url: 'http://pod:3000/apps/t/x' };
    expect(auth.getLoginRedirectUrl(req).toString()).toBe(
      auth.resolveAppUrl('/login', req).toString(),
    );
  });

  it('honours a custom middleware.loginUrl', async () => {
    const withIGRPAuth = await getFactory();
    const auth = withIGRPAuth({ env: ENV, middleware: { loginUrl: '/auth/signin' } });
    expect(auth.getLoginRedirectUrl({ url: 'https://public.example/' }).pathname).toBe(
      '/apps/t/auth/signin',
    );
  });
});

describe('withIGRPAuth — provider id stamped on the JWT', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stamps a custom provider’s OWN id, not the env fallback', async () => {
    // Regression: `withIGRPAuth` documents `provider: GitHubProvider({...})`,
    // but the id was read from AUTH_PROVIDER — unset for a custom provider, so
    // every such session was stamped "none". Every OIDC helper then treated it
    // as the auth-disabled bypass: discovery resolved to '', fetch('') threw,
    // and the first refresh force-logged the user out of a healthy session.
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({
      provider: { id: 'github', name: 'GitHub', type: 'oauth' } as never,
      env: { NEXTAUTH_SECRET: 's' },
    });

    const token = (await instance.authOptions.callbacks!.jwt!({
      token: {},
      account: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
    } as never)) as { authProviderId?: string };

    expect(token.authProviderId).toBe('github');
  });

  it('still stamps the env provider when no custom provider was passed', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });

    const token = (await instance.authOptions.callbacks!.jwt!({
      token: {},
      account: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
    } as never)) as { authProviderId?: string };

    expect(token.authProviderId).toBe('igrp-auth');
  });
});

describe('withIGRPAuth — missing NEXTAUTH_SECRET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const envWithoutSecret = {
    AUTH_PROVIDER: 'igrp-auth',
    IGRP_AUTH_CLIENT_ID: 'c',
    IGRP_AUTH_CLIENT_SECRET: 's',
    IGRP_AUTH_ISSUER: 'http://localhost:9090',
  };

  it('is a config error in production, not a silent /login loop', async () => {
    // getToken() does not throw on a missing secret — it fails to decrypt and
    // returns null, so middleware saw "no session" on every request.
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { ...envWithoutSecret, NODE_ENV: 'production' } });

    expect(instance.configError).not.toBeNull();
    expect(instance.configError?.code).toBe('AUTH_SECRET_MISSING');
    const response = await instance.GET(new Request('http://localhost/api/auth/session'));
    expect(response.status).toBe(500);
  });

  it('only warns in development, so a first-run `pnpm dev` still boots', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { ...envWithoutSecret, NODE_ENV: 'development' } });

    expect(instance.configError).toBeNull();
    expect(warn.mock.calls.flat().join(' ')).toContain('NEXTAUTH_SECRET');
    warn.mockRestore();
  });

  it('stays quiet when auth is disabled entirely', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { AUTH_PROVIDER: 'none', NODE_ENV: 'production' } });
    expect(instance.configError).toBeNull();
  });
});

describe('withIGRPAuth — short access-token lifetime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('warns when the whole token lifetime sits inside the refresh buffer', async () => {
    // At that point a JUST-issued token is already "expired" to getSession,
    // which calls onSessionExpired (redirect to /logout) on every render.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });

    await instance.authOptions.callbacks!.jwt!({
      token: {},
      account: { access_token: 'at', refresh_token: 'rt', expires_in: 30 },
    } as never);

    expect(warn.mock.calls.flat().join(' ')).toContain('proactive-refresh buffer');
    warn.mockRestore();
  });
});

describe('withIGRPAuth — recovered token freshness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(oidcModule.introspectOidcToken).mockResolvedValue(true);
    vi.mocked(oidcModule.refreshOidcAccessToken).mockImplementation(async (token) => ({
      ...token,
      accessToken: 'refreshed-at',
    }));
  });

  it('adopts a STALE recovered token and then refreshes with its rotated refresh token', async () => {
    // The recovery entry outlives the access token it holds, so a cache hit can
    // be expired on arrival. Adopting it is still right — it carries the only
    // refresh token the IdP will still accept — but returning it as-is handed
    // callers a dead access token for the rest of the request.
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });

    vi.mocked(oidcModule.getRecoveredToken).mockResolvedValue({
      accessToken: 'stale-at',
      refreshToken: 'rotated-rt',
      expiresAt: Date.now() - 5_000,
    } as never);

    const result = (await instance.authOptions.callbacks!.jwt!({
      token: { accessToken: 'old-at', refreshToken: 'consumed-rt', expiresAt: Date.now() - 1000 },
      account: undefined,
    } as never)) as { accessToken?: string; refreshToken?: string };

    expect(oidcModule.refreshOidcAccessToken).toHaveBeenCalled();
    // The refresh ran against the ROTATED token, not the consumed one.
    expect(vi.mocked(oidcModule.refreshOidcAccessToken).mock.calls[0]![0]).toMatchObject({
      refreshToken: 'rotated-rt',
    });
    expect(result.accessToken).toBe('refreshed-at');
  });

  it('ignores a malformed store entry instead of adopting an empty access token', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });

    vi.mocked(oidcModule.getRecoveredToken).mockResolvedValue({ error: 'boom' } as never);

    const result = (await instance.authOptions.callbacks!.jwt!({
      token: { accessToken: 'old-at', refreshToken: 'consumed-rt', expiresAt: Date.now() - 1000 },
      account: undefined,
    } as never)) as { refreshToken?: string };

    // Fell through to the normal path with the token untouched by the bad entry.
    expect(vi.mocked(oidcModule.refreshOidcAccessToken).mock.calls[0]![0]).toMatchObject({
      refreshToken: 'consumed-rt',
    });
    expect(result.refreshToken).toBe('consumed-rt');
  });
});

describe('withIGRPAuth — a string `provider` option agrees with the env primitives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provider: "none" disables auth for the middleware primitives, not only the handlers', async () => {
    // The handlers already answered 404, but `isAuthDisabled()` re-read the
    // env (unset → igrp-auth) and said false, so a middleware following the
    // documented pattern bounced every request to /login.
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ provider: 'none', env: { NEXTAUTH_SECRET: 's' } });
    expect(instance.configError).toBeNull();
    expect(instance.isAuthDisabled()).toBe(true);
  });

  it('provider: "igrp-auth" keeps auth ON when the env says none — middleware must not fail open', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({
      provider: 'igrp-auth',
      env: { ...VALID_ENV, AUTH_PROVIDER: 'none' },
    });
    expect(instance.configError).toBeNull();
    expect(instance.isAuthDisabled()).toBe(false);
  });

  it('stamps the string provider on the JWT, not the env fallback', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({
      provider: 'igrp-auth',
      env: { ...VALID_ENV, AUTH_PROVIDER: 'none' },
    });
    const token = (await instance.authOptions.callbacks!.jwt!({
      token: {},
      account: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
    } as never)) as { authProviderId?: string };
    expect(token.authProviderId).toBe('igrp-auth');
  });
});

describe('withIGRPAuth — events.signOut revokes the live refresh token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(oidcModule.revokeOidcSession).mockResolvedValue({ ok: true, status: 200 });
  });

  it('revokes the ROTATED token when the cookie still holds a consumed one', async () => {
    // After an RSC rotation the cookie's refresh token is already spent and the
    // live one sits in the recovery store. Revoking the cookie's copy is a
    // no-op at the IdP, and the store entry was then deleted without ever
    // being revoked — the only valid refresh token simply vanished.
    vi.mocked(oidcModule.getRecoveredToken).mockResolvedValue({
      accessToken: 'rotated-at',
      refreshToken: 'rotated-rt',
    } as never);
    try {
      const withIGRPAuth = await getFactory();
      const instance = withIGRPAuth({ env: VALID_ENV });
      await instance.authOptions.events!.signOut!({
        token: { refreshToken: 'consumed-rt', accessToken: 'old-at' },
      } as never);

      expect(oidcModule.revokeOidcSession).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'rotated-rt' }),
        VALID_ENV,
      );
    } finally {
      vi.mocked(oidcModule.getRecoveredToken).mockResolvedValue(null);
    }
  });
});

describe('withIGRPAuth — default matcher', () => {
  it('excludes the reserved prefixes as whole segments, not as string prefixes', async () => {
    // `(?!apps|_next|…)` left `/appstore`, `/apps-admin` and `/_nextfoo`
    // outside the middleware entirely — the lookahead matched the first four
    // characters and stopped.
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const re = new RegExp(`^${instance.config.matcher[1]}$`);

    for (const protectedPath of ['/appstore', '/apps-admin', '/_nextfoo', '/dashboard']) {
      expect(re.test(protectedPath), `${protectedPath} must wake the middleware`).toBe(true);
    }
    for (const skipped of ['/apps', '/apps/x', '/_next/static/a.js', '/favicon.ico', '/a/b.png']) {
      expect(re.test(skipped), `${skipped} must stay excluded`).toBe(false);
    }
  });

  it('skips static-asset extensions only, not every path that contains a dot', async () => {
    // `.*\..*` skipped any PAGE route with a dot in it — a dynamic segment
    // capturing `john.doe` or `v1.2` never woke the middleware.
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const re = new RegExp(`^${instance.config.matcher[1]}$`);

    for (const page of ['/users/john.doe', '/releases/v1.2', '/docs/node.js-guide']) {
      expect(re.test(page), `${page} must wake the middleware`).toBe(true);
    }
    for (const asset of [
      '/logo.png',
      '/robots.txt',
      '/sitemap.xml',
      '/manifest.webmanifest',
      '/fonts/inter.woff2',
      '/static/app.css',
      '/vendor/lib.min.js',
    ]) {
      expect(re.test(asset), `${asset} must stay excluded`).toBe(false);
    }
  });
});

describe('withIGRPAuth — route handler construction', () => {
  it('constructs the NextAuth handler once for concurrent first requests', async () => {
    // Same dance as the control-flow suite above: the mock only takes for a
    // module graph that has not already resolved `next-auth`.
    vi.resetModules();
    const NextAuth = vi.fn(() => async () => new Response('ok'));
    vi.doMock('next-auth', () => ({ default: NextAuth, getServerSession: vi.fn() }));
    try {
      // Before the fix this failed with a TypeError from the REAL next-auth
      // rather than with the call count: two concurrent `import('next-auth')`
      // calls let the second fall through to the real package in vitest. That
      // second import only exists because the handler was built twice, so the
      // failure mode is the defect itself, just wearing a different message.
      const withIGRPAuth = await getFactory();
      const instance = withIGRPAuth({ env: VALID_ENV });
      await Promise.all([
        instance.GET(new Request('http://localhost/api/auth/session')),
        instance.GET(new Request('http://localhost/api/auth/session')),
      ]);
      expect(NextAuth).toHaveBeenCalledTimes(1);
    } finally {
      vi.doUnmock('next-auth');
      vi.resetModules();
    }
  });
});

describe('withIGRPAuth — NextAuth debug logging is opt-in', () => {
  // next-auth's debug logger prints OAuth token responses and profiles. Tying
  // it to NODE_ENV=development put bearer tokens in every dev console by
  // default; it is now off unless asked for.
  async function debugFlagFor(options: Record<string, unknown>) {
    vi.resetModules();
    const NextAuth = vi.fn(() => async () => new Response('ok'));
    vi.doMock('next-auth', () => ({ default: NextAuth, getServerSession: vi.fn() }));
    try {
      const withIGRPAuth = await getFactory();
      const instance = withIGRPAuth(options as never);
      await instance.GET(new Request('http://localhost/api/auth/session'));
      return (NextAuth.mock.calls[0] as unknown as [{ debug?: boolean }])[0].debug;
    } finally {
      vi.doUnmock('next-auth');
      vi.resetModules();
    }
  }

  it('is off in development by default', async () => {
    expect(await debugFlagFor({ env: { ...VALID_ENV, NODE_ENV: 'development' } })).toBe(false);
  });

  it('turns on with IGRP_AUTH_DEBUG=true', async () => {
    expect(
      await debugFlagFor({
        env: { ...VALID_ENV, NODE_ENV: 'development', IGRP_AUTH_DEBUG: 'true' },
      }),
    ).toBe(true);
  });

  it('honours an explicit `debug` option over the env', async () => {
    expect(
      await debugFlagFor({ debug: false, env: { ...VALID_ENV, IGRP_AUTH_DEBUG: 'true' } }),
    ).toBe(false);
  });
});

describe('withIGRPAuth — config-error page does not describe the deployment in production', () => {
  const BROKEN_ENV = { AUTH_PROVIDER: 'igrp-auth' }; // every IGRP_AUTH_* var missing

  it('names the missing variables in development', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { ...BROKEN_ENV, NODE_ENV: 'development' } });
    const body = await (
      await instance.GET(new Request('http://localhost/api/auth/session'))
    ).text();
    expect(body).toContain('IGRP_AUTH_CLIENT_ID');
  });

  it('shows only the error code in production and logs the detail server-side', async () => {
    // The page is served unauthenticated to anyone who hits /api/auth/*.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const withIGRPAuth = await getFactory();
      const instance = withIGRPAuth({ env: { ...BROKEN_ENV, NODE_ENV: 'production' } });
      const response = await instance.GET(new Request('http://localhost/api/auth/session'));
      const body = await response.text();
      expect(response.status).toBe(500);
      expect(body).toContain('AUTH_CONFIG_INVALID');
      expect(body).not.toContain('IGRP_AUTH_CLIENT_ID');
      expect(error.mock.calls.flat().join(' ')).toContain('IGRP_AUTH_CLIENT_ID');
    } finally {
      error.mockRestore();
    }
  });
});

describe('withIGRPAuth — a throwing callback extension does not end the session', () => {
  // next-auth catches a throw from `callbacks.jwt`, logs JWT_SESSION_ERROR and
  // CLEARS the session cookie — so a bug in an app's extension signed the user
  // out. The IGRP value is returned instead, and the failure is logged loudly.
  const FUTURE = Date.now() + 10 * 60_000;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the IGRP token when the jwt extension throws, and logs it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const withIGRPAuth = await getFactory();
      const instance = withIGRPAuth({
        env: VALID_ENV,
        callbacks: {
          jwt: async () => {
            throw new Error('extension boom');
          },
        },
      });
      const token = (await instance.authOptions.callbacks!.jwt!({
        token: { accessToken: 'at', refreshToken: 'rt', expiresAt: FUTURE },
        account: undefined,
      } as never)) as { accessToken?: string };
      expect(token.accessToken).toBe('at');
      expect(error.mock.calls.flat().map(String).join(' ')).toContain('extension boom');
    } finally {
      error.mockRestore();
    }
  });

  it('returns the IGRP session when the session extension throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const withIGRPAuth = await getFactory();
      const instance = withIGRPAuth({
        env: VALID_ENV,
        callbacks: {
          session: async () => {
            throw new Error('session extension boom');
          },
        },
      });
      const session = (await instance.authOptions.callbacks!.session!({
        session: { user: { name: 'n' } },
        token: { accessToken: 'at', sub: 'u1' },
      } as never)) as { accessToken?: string };
      expect(session.accessToken).toBe('at');
    } finally {
      error.mockRestore();
    }
  });

  it('still lets a Next control-flow signal thrown by an extension through', async () => {
    const withIGRPAuth = await getFactory();
    const signal = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT' });
    const instance = withIGRPAuth({
      env: VALID_ENV,
      callbacks: {
        jwt: async () => {
          throw signal;
        },
      },
    });
    await expect(
      instance.authOptions.callbacks!.jwt!({
        token: { accessToken: 'at', expiresAt: FUTURE },
        account: undefined,
      } as never),
    ).rejects.toBe(signal);
  });
});

describe('withIGRPAuth — session.maxAge', () => {
  it("defaults to AM's absolute session ceiling (8 h), not NextAuth's 30 days", async () => {
    const withIGRPAuth = await getFactory();
    expect(withIGRPAuth({ env: VALID_ENV }).authOptions.session?.maxAge).toBe(28800);
  });

  it('keeps a caller-supplied maxAge and other session fields', async () => {
    const withIGRPAuth = await getFactory();
    const { session } = withIGRPAuth({
      env: VALID_ENV,
      session: { maxAge: 3600, updateAge: 60 },
    }).authOptions;
    expect(session).toMatchObject({ maxAge: 3600, updateAge: 60 });
  });
});
