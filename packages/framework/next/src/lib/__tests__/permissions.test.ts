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
} from '../permissions';

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
});

describe('igrpGetClaims', () => {
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
