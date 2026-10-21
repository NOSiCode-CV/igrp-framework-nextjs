import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const getConfig = vi.fn();
vi.mock('../api-config', () => ({ igrpGetAccessClientConfig: () => getConfig() }));
const forbidden = vi.fn(() => {
  throw new Error('FORBIDDEN_CALLED');
});
vi.mock('next/navigation', () => ({ forbidden: () => forbidden() }));

// React.cache is a no-op-friendly wrapper outside a render; import after mocks.
import {
  isIgrpAuthBypass,
  igrpGetClaims,
  igrpAuthorize,
  igrpAssertAuthorize,
  igrpAssertAuthBypassAllowed,
} from '../permissions.js';
import { IgrpConfigError } from '../../errors.js';

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.s`;
}
const TOKEN = makeJwt({
  org: 'DEPT_IGRP',
  permissions: ['DEPT_IGRP.manage_access'],
  is_super_admin: false,
});

beforeEach(() => {
  getConfig.mockReset();
  forbidden.mockClear();
  delete process.env.IGRP_PREVIEW_MODE;
  delete process.env.AUTH_PROVIDER;
});
afterEach(() => {
  delete process.env.IGRP_PREVIEW_MODE;
  delete process.env.AUTH_PROVIDER;
});

describe('isIgrpAuthBypass', () => {
  it('is true for preview mode and AUTH_PROVIDER=none', () => {
    expect(isIgrpAuthBypass({ IGRP_PREVIEW_MODE: 'true' })).toBe(true);
    expect(isIgrpAuthBypass({ AUTH_PROVIDER: 'none' })).toBe(true);
    expect(isIgrpAuthBypass({})).toBe(false);
  });

  it('normalizes IGRP_PREVIEW_MODE (trim/quotes/case) and AUTH_PROVIDER (case)', () => {
    expect(isIgrpAuthBypass({ IGRP_PREVIEW_MODE: 'TRUE' })).toBe(true);
    expect(isIgrpAuthBypass({ IGRP_PREVIEW_MODE: ' true ' })).toBe(true);
    expect(isIgrpAuthBypass({ IGRP_PREVIEW_MODE: '"true"' })).toBe(true);
    expect(isIgrpAuthBypass({ IGRP_PREVIEW_MODE: 'false' })).toBe(false);
    expect(isIgrpAuthBypass({ AUTH_PROVIDER: 'None' })).toBe(true);
    expect(isIgrpAuthBypass({ AUTH_PROVIDER: 'NONE' })).toBe(true);
  });

  it('strips surrounding quotes from AUTH_PROVIDER like the other bypass predicates', () => {
    expect(isIgrpAuthBypass({ AUTH_PROVIDER: '"none"' })).toBe(true);
    expect(isIgrpAuthBypass({ AUTH_PROVIDER: "'none'" })).toBe(true);
    expect(isIgrpAuthBypass({ AUTH_PROVIDER: ' "None" ' })).toBe(true);
    expect(isIgrpAuthBypass({ AUTH_PROVIDER: '"igrp-auth"' })).toBe(false);
  });
});

describe('igrpAssertAuthBypassAllowed', () => {
  const prod = { NODE_ENV: 'production' };

  it('allows bypass outside production', () => {
    expect(() =>
      igrpAssertAuthBypassAllowed({ NODE_ENV: 'development', IGRP_PREVIEW_MODE: 'true' }),
    ).not.toThrow();
    expect(() =>
      igrpAssertAuthBypassAllowed({ NODE_ENV: 'test', AUTH_PROVIDER: 'none' }),
    ).not.toThrow();
  });

  it('allows production without bypass', () => {
    expect(() =>
      igrpAssertAuthBypassAllowed({ ...prod, AUTH_PROVIDER: 'igrp-auth' }),
    ).not.toThrow();
    expect(() => igrpAssertAuthBypassAllowed(prod)).not.toThrow();
  });

  it('throws in production when preview mode is on without the opt-in', () => {
    expect(() => igrpAssertAuthBypassAllowed({ ...prod, IGRP_PREVIEW_MODE: 'true' })).toThrow(
      IgrpConfigError,
    );
    expect(() => igrpAssertAuthBypassAllowed({ ...prod, IGRP_PREVIEW_MODE: 'true' })).toThrow(
      /IGRP_PREVIEW_MODE/,
    );
  });

  it('throws in production when AUTH_PROVIDER=none without the opt-in', () => {
    expect(() => igrpAssertAuthBypassAllowed({ ...prod, AUTH_PROVIDER: 'none' })).toThrow(
      /AUTH_PROVIDER/,
    );
  });

  it('treats any NODE_ENV other than development/test (unset included) as production', () => {
    for (const NODE_ENV of ['staging', 'Production', ' "qa" ', undefined]) {
      expect(() => igrpAssertAuthBypassAllowed({ NODE_ENV, IGRP_PREVIEW_MODE: 'true' })).toThrow(
        IgrpConfigError,
      );
    }
    expect(() => igrpAssertAuthBypassAllowed({ IGRP_PREVIEW_MODE: 'true' })).toThrow(
      IgrpConfigError,
    );
    expect(() =>
      igrpAssertAuthBypassAllowed({ NODE_ENV: ' "Development" ', IGRP_PREVIEW_MODE: 'true' }),
    ).not.toThrow();
  });

  it('names every active bypass variable in the error code context', () => {
    const catchErr = (env: Record<string, string>) => {
      try {
        igrpAssertAuthBypassAllowed({ ...prod, ...env });
      } catch (e) {
        return e as IgrpConfigError;
      }
      throw new Error('did not throw');
    };
    const preview = catchErr({ IGRP_PREVIEW_MODE: 'true' });
    expect(preview.code).toBe('IGRP_CONFIG_INVALID');
    expect(preview.context).toEqual({ variable: 'IGRP_PREVIEW_MODE' });
    expect(catchErr({ AUTH_PROVIDER: 'none' }).context).toEqual({ variable: 'AUTH_PROVIDER' });
    const both = catchErr({ IGRP_PREVIEW_MODE: 'true', AUTH_PROVIDER: 'none' });
    expect(both.context).toEqual({ variable: 'IGRP_PREVIEW_MODE, AUTH_PROVIDER' });
    expect(both.message).toContain('IGRP_PREVIEW_MODE, AUTH_PROVIDER desliga');
  });

  it('accepts only a parsed true as the opt-in', () => {
    const on = { ...prod, IGRP_PREVIEW_MODE: 'true' };
    expect(() =>
      igrpAssertAuthBypassAllowed({ ...on, IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: 'true' }),
    ).not.toThrow();
    expect(() =>
      igrpAssertAuthBypassAllowed({ ...on, IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: ' "TRUE" ' }),
    ).not.toThrow();
    expect(() =>
      igrpAssertAuthBypassAllowed({ ...on, IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: 'false' }),
    ).toThrow();
    expect(() =>
      igrpAssertAuthBypassAllowed({ ...on, IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: '' }),
    ).toThrow();
    expect(() =>
      igrpAssertAuthBypassAllowed({ ...on, IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: '1' }),
    ).toThrow();
  });
});

describe('igrpGetClaims', () => {
  // React.cache is pass-through outside an RSC render, so each call here executes fresh.
  it('returns a super-admin mock in bypass without decoding', async () => {
    process.env.IGRP_PREVIEW_MODE = 'true';
    getConfig.mockReturnValue({ token: 'preview-token', baseUrl: '' });
    const state = await igrpGetClaims();
    expect(state).toEqual({
      status: 'ok',
      claims: { permissions: [], roles: [], isSuperAdmin: true },
    });
  });

  it('decodes the token when not in bypass', async () => {
    getConfig.mockReturnValue({ token: TOKEN, baseUrl: '' });
    const state = await igrpGetClaims();
    expect(state.status).toBe('ok');
    if (state.status === 'ok')
      expect(state.claims.permissions).toEqual(['DEPT_IGRP.manage_access']);
  });

  it('returns error state on a malformed token', async () => {
    getConfig.mockReturnValue({ token: 'preview-token', baseUrl: '' });
    const state = await igrpGetClaims();
    expect(state.status).toBe('error');
  });
});

describe('igrpAuthorize / igrpAssertAuthorize', () => {
  it('authorizes a held bare permission', async () => {
    getConfig.mockReturnValue({ token: TOKEN, baseUrl: '' });
    expect(await igrpAuthorize('manage_access')).toBe(true);
    expect(await igrpAuthorize('missing')).toBe(false);
  });

  it('assert: passes when allowed (no forbidden)', async () => {
    getConfig.mockReturnValue({ token: TOKEN, baseUrl: '' });
    await igrpAssertAuthorize('manage_access');
    expect(forbidden).not.toHaveBeenCalled();
  });

  it('assert: calls forbidden() when the permission is missing', async () => {
    getConfig.mockReturnValue({ token: TOKEN, baseUrl: '' });
    await expect(igrpAssertAuthorize('missing')).rejects.toThrow('FORBIDDEN_CALLED');
  });

  it('assert: throws (not forbidden) on a decode error', async () => {
    getConfig.mockReturnValue({ token: 'preview-token', baseUrl: '' });
    await expect(igrpAssertAuthorize('x')).rejects.toThrow(/permissions/i);
    expect(forbidden).not.toHaveBeenCalled();
  });
});
