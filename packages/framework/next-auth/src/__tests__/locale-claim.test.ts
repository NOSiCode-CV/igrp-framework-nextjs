import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as oidcModule from '../oidc';

// Same isolation as config.test.ts: no network from the OIDC helpers.
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

/** A still-valid access token, so the managed-token path returns it unchanged. */
const ACCOUNT = {
  provider: 'igrp-auth',
  type: 'oauth',
  providerAccountId: 'u-1',
  access_token: 'at',
  refresh_token: 'rt',
  id_token: 'it',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

async function callbacks() {
  const { withIGRPAuth } = await import('../config');
  const instance = withIGRPAuth({ env: VALID_ENV });
  return instance.authOptions.callbacks!;
}

beforeEach(() => vi.clearAllMocks());

describe('default provider profile()', () => {
  it('maps a string locale claim and leaves a missing one undefined', async () => {
    const { createAuthProviderFromEnv } = await import('../providers');
    const provider = createAuthProviderFromEnv(VALID_ENV) as unknown as {
      profile: (p: Record<string, unknown>) => { locale?: string };
    };
    expect(provider.profile({ sub: '1', locale: 'pt-CV' }).locale).toBe('pt-CV');
    expect(provider.profile({ sub: '1' }).locale).toBeUndefined();
    expect(provider.profile({ sub: '1', locale: 42 }).locale).toBeUndefined();
  });
});

describe('jwt callback — locale', () => {
  it('seeds token.locale from user.locale at sign-in', async () => {
    const { jwt } = await callbacks();
    const token = await jwt!({
      token: { sub: 'u-1' },
      account: ACCOUNT,
      user: { id: 'u-1', locale: 'fr' },
      profile: { sub: 'u-1', locale: 'fr' },
    } as never);
    expect(token.locale).toBe('fr');
  });

  it('falls back to the raw profile claim when user.locale is absent (custom mappers)', async () => {
    const { jwt } = await callbacks();
    const token = await jwt!({
      token: { sub: 'u-1' },
      account: ACCOUNT,
      user: { id: 'u-1' },
      profile: { sub: 'u-1', locale: 'en-GB' },
    } as never);
    expect(token.locale).toBe('en-GB');
  });

  it('leaves token.locale undefined when the claim is missing or not a string', async () => {
    const { jwt } = await callbacks();
    const missing = await jwt!({
      token: { sub: 'u-1' },
      account: ACCOUNT,
      user: { id: 'u-1' },
      profile: { sub: 'u-1' },
    } as never);
    expect(missing.locale).toBeUndefined();
    const wrongType = await jwt!({
      token: { sub: 'u-1' },
      account: ACCOUNT,
      user: { id: 'u-1', locale: null },
      profile: { sub: 'u-1', locale: 7 },
    } as never);
    expect(wrongType.locale).toBeUndefined();
  });

  it('seeds the locale for a provider the package does not manage', async () => {
    const { jwt } = await callbacks();
    const token = await jwt!({
      token: { sub: 'u-1' },
      account: { ...ACCOUNT, provider: 'github' },
      user: { id: 'u-1', locale: 'pt' },
      profile: { sub: 'u-1' },
    } as never);
    expect(token.locale).toBe('pt');
  });

  it('replaces token.locale on update({ locale }) and ignores non-string payloads', async () => {
    const { jwt } = await callbacks();
    const base = {
      sub: 'u-1',
      locale: 'pt',
      authProviderId: 'igrp-auth',
      accessToken: 'at',
      expiresAt: Date.now() + 3_600_000,
    };
    const updated = await jwt!({
      token: base,
      trigger: 'update',
      session: { locale: 'en' },
    } as never);
    expect(updated.locale).toBe('en');
    const ignored = await jwt!({ token: base, trigger: 'update', session: { locale: 3 } } as never);
    expect(ignored.locale).toBe('pt');
    const unrelated = await jwt!({
      token: base,
      trigger: 'update',
      session: { name: 'X' },
    } as never);
    expect(unrelated.locale).toBe('pt');
  });
});

describe('session callback — locale', () => {
  it('exposes token.locale as session.user.locale', async () => {
    const { session } = await callbacks();
    const result = (await session!({
      session: { user: { name: 'Ana' }, expires: '2099-01-01' },
      token: { sub: 'u-1', locale: 'fr' },
    } as never)) as { user?: { locale?: string; id?: string } };
    expect(result.user?.locale).toBe('fr');
    expect(result.user?.id).toBe('u-1');
  });

  it('adds no locale key when the token has none', async () => {
    const { session } = await callbacks();
    const result = (await session!({
      session: { user: { name: 'Ana' }, expires: '2099-01-01' },
      token: { sub: 'u-1' },
    } as never)) as { user?: Record<string, unknown> };
    expect(result.user).not.toHaveProperty('locale');
  });
});
