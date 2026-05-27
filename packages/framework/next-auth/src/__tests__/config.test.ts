import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as oidcModule from '../oidc';

// Mock revokeOidcSession so tests don't make real HTTP calls
vi.mock('../oidc', async (importOriginal) => {
  const original = await importOriginal<typeof oidcModule>();
  return {
    ...original,
    revokeOidcSession: vi.fn().mockResolvedValue(undefined),
    introspectOidcToken: vi.fn().mockResolvedValue(true),
    refreshOidcAccessToken: vi.fn().mockResolvedValue({ accessToken: 'refreshed-at', forceLogout: false }),
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
    expect(
      instance.isTokenExpiredOrFailed({ expiresAt: Date.now() + 30_000 } as any),
    ).toBe(false);
  });

  it('treats an already-expired token as expired', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    expect(
      instance.isTokenExpiredOrFailed({ expiresAt: Date.now() - 1_000 } as any),
    ).toBe(true);
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
    NEXTAUTH_URL_INTERNAL: 'http://localhost:3000/apps/template/api/auth',
    NEXT_PUBLIC_IGRP_APP_HOME_SLUG: '/',
  };

  const APP_BASE = 'http://localhost:3000/apps/template';

  async function getRedirect(envOverrides: Record<string, string> = {}) {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { ...REDIRECT_ENV, ...envOverrides } });
    return instance.authOptions.callbacks!.redirect!;
  }

  it('honors a relative callbackUrl by resolving it against baseUrl', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '/some/page', baseUrl: APP_BASE });
    expect(result).toBe(`${APP_BASE}/some/page`);
  });

  it('honors a relative callbackUrl with query string', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '/list?tab=open', baseUrl: APP_BASE });
    expect(result).toBe(`${APP_BASE}/list?tab=open`);
  });

  it('honors a same-origin absolute callbackUrl', async () => {
    const redirect = await getRedirect();
    const absolute = `${APP_BASE}/deep/path`;
    const result = await redirect({ url: absolute, baseUrl: APP_BASE });
    expect(result).toBe(absolute);
  });

  it('falls back to home when url equals baseUrl', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: APP_BASE, baseUrl: APP_BASE });
    expect(result).toBe(`${REDIRECT_ENV.NEXTAUTH_URL_INTERNAL}${REDIRECT_ENV.NEXT_PUBLIC_IGRP_APP_HOME_SLUG}`);
  });

  it('rejects protocol-relative URLs (open-redirect guard)', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '//evil.com/path', baseUrl: APP_BASE });
    expect(result).toBe(`${REDIRECT_ENV.NEXTAUTH_URL_INTERNAL}${REDIRECT_ENV.NEXT_PUBLIC_IGRP_APP_HOME_SLUG}`);
  });

  it('rejects cross-origin absolute URLs', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: 'http://evil.com/path', baseUrl: APP_BASE });
    expect(result).toBe(`${REDIRECT_ENV.NEXTAUTH_URL_INTERNAL}${REDIRECT_ENV.NEXT_PUBLIC_IGRP_APP_HOME_SLUG}`);
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
      baseUrl: APP_BASE,
    });
    expect(customRedirect).toHaveBeenCalledWith({ url: '/some/page', baseUrl: APP_BASE });
    expect(result).toBe('/custom');
  });
});
