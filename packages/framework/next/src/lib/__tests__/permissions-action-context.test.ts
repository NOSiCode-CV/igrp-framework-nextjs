import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Server Action / Route Handler context: a FRESH async context where no
 * `AsyncLocalStorage` store was ever established.
 *
 * The sibling `permissions.test.ts` mocks `../api-config`, which is exactly why
 * it never caught this: with the mock, a token is always reachable. These tests
 * use the REAL api-config so "no store" is genuinely reproduced.
 *
 * Regression cover for: `igrpAuthorize` returning false for every user
 * (super-admins included) when called from a Server Action, because the access
 * token lived only in an ALS store the action never entered.
 */

const getToken = vi.fn();
const serverSessionToken = vi.fn<() => Promise<string | undefined>>();
const cookiesGetAll = vi.fn<() => Array<{ name: string; value: string }>>();
const acceptLanguage = vi.fn<() => string | null>();

vi.mock('next/navigation', () => ({
  forbidden: () => {
    throw new Error('FORBIDDEN_CALLED');
  },
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => cookiesGetAll(),
    get: (name: string) => cookiesGetAll().find((c) => c.name === name),
  }),
  headers: async () => ({
    get: (name: string) => (name === 'accept-language' ? acceptLanguage() : null),
  }),
}));
vi.mock('@igrp/framework-next-auth/session-store', () => ({
  readIGRPSessionToken: (...args: unknown[]) => getToken(...args),
  readIGRPServerSessionAccessToken: () => serverSessionToken(),
}));

const { igrpGetClaims, igrpAuthorize, igrpEnsureAccessClientConfig } =
  await import('../permissions.js');
const { igrpGetAccessClientConfig, igrpSetAccessClientConfig, igrpResetAccessClientConfig } =
  await import('../api-config.js');

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}

const PERMITTED_TOKEN = makeJwt({
  org: 'DEPT_IGRP',
  permissions: ['DEPT_IGRP.manage_access'],
  is_super_admin: false,
});

const SESSION_COOKIE = { name: 'next-auth.session-token', value: 'opaque' };

beforeEach(() => {
  getToken.mockReset();
  serverSessionToken.mockReset().mockResolvedValue(undefined);
  cookiesGetAll.mockReset().mockReturnValue([SESSION_COOKIE]);
  acceptLanguage.mockReset().mockReturnValue(null);
  igrpResetAccessClientConfig();
  delete process.env.IGRP_PREVIEW_MODE;
  delete process.env.AUTH_PROVIDER;
  process.env.IGRP_ACCESS_MANAGEMENT_API = 'https://am.example.test';
});
afterEach(() => {
  delete process.env.IGRP_PREVIEW_MODE;
  delete process.env.AUTH_PROVIDER;
  delete process.env.IGRP_ACCESS_MANAGEMENT_API;
});

describe('T1/T2 — no ALS store seeded (Server Action context)', () => {
  it('T1: recovers the token from the session cookie and ALLOWS a permitted user', async () => {
    getToken.mockResolvedValue({ accessToken: PERMITTED_TOKEN });
    // Before the fix this was `false` for every user, super-admins included.
    expect(await igrpAuthorize('manage_access')).toBe(true);
  });

  it('T2: stays fail-closed when there is no session to recover from', async () => {
    getToken.mockResolvedValue(null);
    const state = await igrpGetClaims();
    expect(state.status).toBe('error');
    expect(await igrpAuthorize('manage_access')).toBe(false);
  });

  it('T2b: stays fail-closed when the cookie read itself throws', async () => {
    cookiesGetAll.mockImplementation(() => {
      throw new Error('called outside a request scope');
    });
    expect(await igrpAuthorize('manage_access')).toBe(false);
  });
});

describe("T2c — Next's control-flow signals are NOT swallowed", () => {
  /**
   * Swallowing the prerender bailout would mask it as "no session": Next would
   * not mark the route dynamic, and the build would surface a confusing 5xx
   * instead of bailing out cleanly.
   */
  it('re-throws the static-render bailout thrown by cookies()', async () => {
    const bailout = Object.assign(new Error('Dynamic server usage'), {
      digest: 'DYNAMIC_SERVER_USAGE',
      name: 'DynamicServerError',
    });
    cookiesGetAll.mockImplementation(() => {
      throw bailout;
    });
    await expect(igrpGetClaims()).rejects.toBe(bailout);
    await expect(igrpAuthorize('manage_access')).rejects.toBe(bailout);
  });

  it('re-throws a redirect() signal raised while reading cookies', async () => {
    const redirectSignal = Object.assign(new Error('NEXT_REDIRECT'), {
      digest: 'NEXT_REDIRECT;replace;/login;307;',
    });
    cookiesGetAll.mockImplementation(() => {
      throw redirectSignal;
    });
    await expect(igrpGetClaims()).rejects.toBe(redirectSignal);
  });

  it('still fail-closes on a genuine error that carries no digest', async () => {
    cookiesGetAll.mockImplementation(() => {
      throw Object.assign(new Error('JWE decryption failed'), { name: 'JWEDecryptionFailed' });
    });
    const state = await igrpGetClaims();
    expect(state.status).toBe('error');
  });
});

describe('T3 — the recovery also seeds the ALS store', () => {
  it('populates token + baseUrl so the AM client works in the same context', async () => {
    getToken.mockResolvedValue({ accessToken: PERMITTED_TOKEN });
    await igrpGetClaims();
    const config = igrpGetAccessClientConfig();
    expect(config.token).toBe(PERMITTED_TOKEN);
    expect(config.baseUrl).toBe('https://am.example.test');
  });

  it('does not clobber a baseUrl already established in this context', async () => {
    igrpSetAccessClientConfig({ token: '', baseUrl: 'https://seeded.example.test' });
    getToken.mockResolvedValue({ accessToken: PERMITTED_TOKEN });
    await igrpGetClaims();
    expect(igrpGetAccessClientConfig().baseUrl).toBe('https://seeded.example.test');
  });
});

describe('T3b — locale is seeded for Accept-Language', () => {
  it('seeds locale from the IGRP_LOCALE cookie in an action context', async () => {
    getToken.mockResolvedValue({ accessToken: PERMITTED_TOKEN });
    cookiesGetAll.mockReturnValue([{ name: 'IGRP_LOCALE', value: 'en' }, SESSION_COOKIE]);
    acceptLanguage.mockReturnValue('fr');
    expect((await igrpEnsureAccessClientConfig()).locale).toBe('en');
  });

  it('falls back to Accept-Language when there is no locale cookie', async () => {
    getToken.mockResolvedValue({ accessToken: PERMITTED_TOKEN });
    acceptLanguage.mockReturnValue('fr-FR,fr;q=0.9');
    expect((await igrpEnsureAccessClientConfig()).locale).toBe('fr');
  });

  it('seeds locale even when no token is recovered', async () => {
    getToken.mockResolvedValue(null);
    cookiesGetAll.mockReturnValue([{ name: 'IGRP_LOCALE', value: 'en' }]);
    await igrpEnsureAccessClientConfig();
    expect(igrpGetAccessClientConfig().locale).toBe('en');
  });

  it('keeps a locale already set in the store', async () => {
    igrpSetAccessClientConfig({ token: '', baseUrl: 'https://am.example.test', locale: 'pt' });
    getToken.mockResolvedValue({ accessToken: PERMITTED_TOKEN });
    cookiesGetAll.mockReturnValue([{ name: 'IGRP_LOCALE', value: 'en' }, SESSION_COOKIE]);
    expect((await igrpEnsureAccessClientConfig()).locale).toBe('pt');
  });
});

describe('T4 — the working path is untouched (additive proof)', () => {
  it('never reads the cookie when the store already holds a token', async () => {
    igrpSetAccessClientConfig({ token: PERMITTED_TOKEN, baseUrl: 'https://am.example.test' });
    expect(await igrpAuthorize('manage_access')).toBe(true);
    expect(getToken).not.toHaveBeenCalled();
    expect(cookiesGetAll).not.toHaveBeenCalled();
  });

  it('never reads the cookie in bypass mode (non-JWT preview token)', async () => {
    process.env.IGRP_PREVIEW_MODE = 'true';
    expect(await igrpAuthorize('anything_at_all')).toBe(true);
    expect(getToken).not.toHaveBeenCalled();
  });
});

describe('T5 — missing `org` diagnostic', () => {
  const NO_ORG_TOKEN = makeJwt({ permissions: ['DEPT_IGRP.manage_access'], is_super_admin: false });

  it('warns once when a non-super-admin token carries no org', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getToken.mockResolvedValue({ accessToken: NO_ORG_TOKEN });
    await igrpGetClaims();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('no `org`');
    // The bare-name check it warns about does indeed deny.
    expect(await igrpAuthorize('manage_access')).toBe(false);
    // …while a fully-qualified name still works.
    expect(await igrpAuthorize('DEPT_IGRP.manage_access')).toBe(true);
    warn.mockRestore();
  });

  it('stays silent when org is present', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getToken.mockResolvedValue({ accessToken: PERMITTED_TOKEN });
    await igrpGetClaims();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('stays silent in production', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    getToken.mockResolvedValue({ accessToken: NO_ORG_TOKEN });
    await igrpGetClaims();
    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
    warn.mockRestore();
  });
});

describe('igrpEnsureAccessClientConfig(seed)', () => {
  it('applies the seed without reading the cookie, baseUrl from the env', async () => {
    getToken.mockResolvedValue({ accessToken: 'FROM_COOKIE' });
    const config = await igrpEnsureAccessClientConfig({ token: 'SEEDED', locale: undefined });
    expect(getToken).not.toHaveBeenCalled();
    expect(config).toMatchObject({ token: 'SEEDED', baseUrl: 'https://am.example.test' });
    // Not `not.toHaveProperty`: a store left by an earlier test was reset to
    // `locale: undefined`, so the key can exist without a value.
    expect(config.locale).toBeUndefined();
  });

  it('wins over a token already in the store', async () => {
    igrpSetAccessClientConfig({ token: 'OLD', baseUrl: 'http://am', locale: 'fr' });
    await igrpEnsureAccessClientConfig({ token: 'REFRESHED' });
    expect(igrpGetAccessClientConfig()).toMatchObject({
      token: 'REFRESHED',
      baseUrl: 'http://am',
      locale: 'fr',
    });
  });

  it('seeds the caller context synchronously, before any await', () => {
    // Not awaited: the store must already be visible on the next line.
    void igrpEnsureAccessClientConfig({ token: 'SYNC', baseUrl: 'http://am' });
    expect(igrpGetAccessClientConfig().token).toBe('SYNC');
  });
});

describe('recovery through the registered session reader (withIGRPAuth)', () => {
  const EXPIRED_COOKIE_TOKEN = makeJwt({
    org: 'DEPT_IGRP',
    permissions: ['DEPT_IGRP.manage_access'],
    exp: Math.floor(Date.now() / 1000) - 60,
  });

  it('a layout whose seed was lost after an await reads the refreshed token, not the stale cookie', async () => {
    getToken.mockResolvedValue({ accessToken: EXPIRED_COOKIE_TOKEN });
    serverSessionToken.mockResolvedValue(PERMITTED_TOKEN);
    // The template's getSession(): the seed lands after an await, so the caller never sees it.
    async function getSession() {
      await new Promise((resolve) => setTimeout(resolve, 1));
      await igrpEnsureAccessClientConfig({ token: PERMITTED_TOKEN });
    }
    await getSession();
    expect(igrpGetAccessClientConfig().token).not.toBe(PERMITTED_TOKEN);

    const state = await igrpGetClaims();
    expect(state.status).toBe('ok');
    expect(getToken).not.toHaveBeenCalled();
  });

  it('denies when the session read reports no usable session, without trying the cookie', async () => {
    getToken.mockResolvedValue({ accessToken: PERMITTED_TOKEN });
    serverSessionToken.mockResolvedValue('');
    expect(await igrpAuthorize('manage_access')).toBe(false);
    expect(getToken).not.toHaveBeenCalled();
  });

  it('falls back to the cookie when the session read fails', async () => {
    serverSessionToken.mockRejectedValue(new Error('JWE decryption failed'));
    getToken.mockResolvedValue({ accessToken: PERMITTED_TOKEN });
    expect(await igrpAuthorize('manage_access')).toBe(true);
  });

  it('re-throws Next control flow from the session read', async () => {
    const bailout = Object.assign(new Error('Dynamic server usage'), {
      digest: 'DYNAMIC_SERVER_USAGE',
    });
    serverSessionToken.mockRejectedValue(bailout);
    await expect(igrpGetClaims()).rejects.toBe(bailout);
  });
});
