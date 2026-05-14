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
