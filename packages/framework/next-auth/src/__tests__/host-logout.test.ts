import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as oidcModule from '../oidc';
import type { JWT } from '../jwt';
import { withIGRPAuth } from '../config';

// Same isolation as locale-claim.test.ts: no network from the OIDC helpers.
vi.mock('../oidc', async (importOriginal) => {
  const original = await importOriginal<typeof oidcModule>();
  return {
    ...original,
    revokeOidcSession: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    introspectOidcToken: vi.fn().mockResolvedValue(true),
    refreshOidcAccessToken: vi
      .fn()
      .mockResolvedValue({ accessToken: 'refreshed-at', forceLogout: false }),
    getRecoveredToken: vi.fn().mockResolvedValue(null),
    configureOidcTokenRecoveryStore: vi.fn(),
  };
});

const VALID_ENV = {
  AUTH_PROVIDER: 'igrp-auth',
  IGRP_AUTH_CLIENT_ID: 'test-client',
  IGRP_AUTH_CLIENT_SECRET: 'test-secret',
  IGRP_AUTH_ISSUER: 'http://localhost:9090',
  NEXTAUTH_SECRET: 'test-secret-key',
};

const NOW_S = 1_700_000_000;

const ACCOUNT = {
  provider: 'igrp-auth',
  type: 'oauth',
  providerAccountId: 'u-1',
  access_token: 'at',
  refresh_token: 'rt',
  id_token: 'it',
  expires_at: NOW_S + 3600,
};

/** Managed token with expiry well ahead (ms), so the callback returns it unrefreshed. */
const validToken = {
  sub: 'u-1',
  authProviderId: 'igrp-auth',
  accessToken: 'at',
  refreshToken: 'rt',
  idToken: 'it',
  expiresAt: (NOW_S + 3600) * 1000,
};

const req = (value?: string) => ({
  cookies: {
    get: (n: string) =>
      n === 'igrp.logout-at' && value !== undefined ? { name: n, value } : undefined,
    getAll: () => [],
  },
});

const auth = withIGRPAuth({ env: VALID_ENV });
const jwt = auth.authOptions.callbacks!.jwt!;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW_S * 1000));
});
afterEach(() => vi.useRealTimers());

describe('authTime claim', () => {
  it('stamps authTime in seconds at sign-in, silent sign-in included', async () => {
    const token = await jwt({ token: {}, account: ACCOUNT } as never);
    expect(token.authTime).toBe(NOW_S);
  });

  it('keeps authTime unchanged on a later call without account', async () => {
    const token = await jwt({
      token: { ...validToken, authTime: 1_600_000_000 },
      account: null,
    } as never);
    expect(token.authTime).toBe(1_600_000_000);
  });
});

describe('isEndedByHostLogout', () => {
  it.each([
    [undefined, 1000, false], // no signal
    ['1000', 999, true], // signed in before the logout
    ['1000', 1000, true], // same second → ended
    ['1000', 1001, false], // signed in after the logout
    ['1000', undefined, true], // legacy token with a signal
    ['abc', 999, false], // malformed signal is ignored
  ])('logout-at %s, authTime %s → ended=%s', (cookie, authTime, ended) => {
    expect(auth.isEndedByHostLogout({ authTime } as JWT, req(cookie))).toBe(ended);
  });

  it('a legacy token without a signal is untouched', () => {
    expect(auth.isEndedByHostLogout({} as JWT, req())).toBe(false);
  });
});
