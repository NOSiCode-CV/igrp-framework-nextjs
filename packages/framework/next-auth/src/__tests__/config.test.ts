import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as oidcModule from '../oidc';

// Mock revokeOidcSession so tests don't make real HTTP calls
vi.mock('../oidc', async (importOriginal) => {
  const original = await importOriginal<typeof oidcModule>();
  return {
    ...original,
    revokeOidcSession: vi.fn().mockResolvedValue(undefined),
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

describe('withIGRPAuth — jwt callback introspect gate', () => {
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

  it('sets forceLogout without calling refresh when introspect returns false', async () => {
    vi.mocked(oidcModule.introspectOidcToken).mockResolvedValue(false);

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

    expect((result as any).forceLogout).toBe(true);
    expect((result as any).error).toBe('RefreshAccessTokenError');
    expect(oidcModule.refreshOidcAccessToken).not.toHaveBeenCalled();
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

  it('calls refresh when introspect returns true and token is expired', async () => {
    vi.mocked(oidcModule.introspectOidcToken).mockResolvedValue(true);

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

    expect(oidcModule.introspectOidcToken).toHaveBeenCalledWith(expiredToken, VALID_ENV);
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

  // What NextAuth ACTUALLY passes as `baseUrl`: the NEXTAUTH_URL string
  // verbatim, including the `/api/auth` suffix v4 requires under a basePath.
  // The previous tests passed the already-stripped app origin here, which is
  // why the "post-login redirect lands on /api/auth" bug went unnoticed.
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
    const result = await redirect({ url: '/some/page', baseUrl: NEXTAUTH_BASE });
    expect(result).toBe(`${APP_BASE}/some/page`);
  });

  it('honors a relative callbackUrl with query string', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '/list?tab=open', baseUrl: NEXTAUTH_BASE });
    expect(result).toBe(`${APP_BASE}/list?tab=open`);
  });

  it('honors a same-origin absolute callbackUrl', async () => {
    const redirect = await getRedirect();
    const absolute = `${APP_BASE}/deep/path`;
    const result = await redirect({ url: absolute, baseUrl: NEXTAUTH_BASE });
    expect(result).toBe(absolute);
  });

  it('lands on the app home — never the /api/auth root — when url equals baseUrl', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: NEXTAUTH_BASE, baseUrl: NEXTAUTH_BASE });
    expect(result).toBe(HOME);
    expect(result).not.toContain('/api/auth');
  });

  it('never redirects the browser to NEXTAUTH_URL_INTERNAL', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '', baseUrl: NEXTAUTH_BASE });
    expect(result).toBe(HOME);
    expect(result).not.toContain('internal-svc');
  });

  it('resolves home against the configured app home slug', async () => {
    const redirect = await getRedirect({ NEXT_PUBLIC_IGRP_APP_HOME_SLUG: 'home' });
    const result = await redirect({ url: NEXTAUTH_BASE, baseUrl: NEXTAUTH_BASE });
    expect(result).toBe(`${APP_BASE}/home`);
  });

  it('falls back to NEXTAUTH_URL when NextAuth passes an empty baseUrl', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '/some/page', baseUrl: '' });
    expect(result).toBe(`${APP_BASE}/some/page`);
  });

  it('sends the auth chrome (/login, /logout) to home instead of bouncing back', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '/login?callbackUrl=%2Fx', baseUrl: NEXTAUTH_BASE })).toBe(HOME);
    expect(await redirect({ url: '/logout', baseUrl: NEXTAUTH_BASE })).toBe(HOME);
    expect(await redirect({ url: `${APP_BASE}/login`, baseUrl: NEXTAUTH_BASE })).toBe(HOME);
  });

  it('rejects protocol-relative URLs (open-redirect guard)', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '//evil.com/path', baseUrl: NEXTAUTH_BASE })).toBe(HOME);
  });

  it('rejects cross-origin absolute URLs', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: 'http://evil.com/path', baseUrl: NEXTAUTH_BASE })).toBe(HOME);
  });

  it('rejects a backslash protocol-relative bypass (open-redirect guard)', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '/\\evil.com', baseUrl: NEXTAUTH_BASE })).toBe(HOME);
  });

  it('rejects a path-traversal callbackUrl', async () => {
    const redirect = await getRedirect();
    expect(await redirect({ url: '/a/../../admin', baseUrl: NEXTAUTH_BASE })).toBe(HOME);
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
      baseUrl: NEXTAUTH_BASE,
    });
    expect(customRedirect).toHaveBeenCalledWith({ url: '/some/page', baseUrl: NEXTAUTH_BASE });
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

  it('falls through to introspect + refresh when there is no recovered token', async () => {
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

    expect(oidcModule.introspectOidcToken).toHaveBeenCalled();
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
