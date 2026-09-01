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
const cookiesGetAll = vi.fn<() => Array<{ name: string; value: string }>>();

vi.mock('next/navigation', () => ({
  forbidden: () => {
    throw new Error('FORBIDDEN_CALLED');
  },
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: () => cookiesGetAll() }),
}));
vi.mock('@igrp/framework-next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => getToken(...args),
}));

const { igrpGetClaims, igrpAuthorize } = await import('../permissions');
const { igrpGetAccessClientConfig, igrpSetAccessClientConfig, igrpResetAccessClientConfig } =
  await import('../api-config');

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
  cookiesGetAll.mockReset().mockReturnValue([SESSION_COOKIE]);
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
