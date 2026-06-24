import { describe, it, expect } from 'vitest';
import { decodeIgrpClaims, claimsAllow, type IGRPAccessClaims } from '../claims';

// Build a JWT with the given payload (header.payload.signature; signature unused).
function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64url({ alg: 'none' })}.${b64url(payload)}.sig`;
}

const TOKEN = makeJwt({
  sub: 'u1',
  org: 'DEPT_IGRP',
  selectedRole: 'DEPT_IGRP.superadmin',
  is_super_admin: false,
  resource_access: { 'igrp-access-management': { roles: ['DEPT_IGRP.superadmin'] } },
  permissions: ['DEPT_IGRP.manage_access'],
  aud: 'igrp-access-management',
  email: 'u1@igrp.cv',
});

describe('decodeIgrpClaims', () => {
  it('decodes a valid token', () => {
    const c = decodeIgrpClaims(TOKEN);
    expect(c.permissions).toEqual(['DEPT_IGRP.manage_access']);
    expect(c.roles).toEqual(['DEPT_IGRP.superadmin']);
    expect(c.org).toBe('DEPT_IGRP');
    expect(c.selectedRole).toBe('DEPT_IGRP.superadmin');
    expect(c.isSuperAdmin).toBe(false);
    expect(c.sub).toBe('u1');
    expect(c.email).toBe('u1@igrp.cv');
  });

  it('handles aud as an array', () => {
    const t = makeJwt({ aud: ['igrp-access-management'], resource_access: { 'igrp-access-management': { roles: ['R'] } }, permissions: [] });
    expect(decodeIgrpClaims(t).roles).toEqual(['R']);
  });

  it('returns empty arrays when claims are absent', () => {
    const c = decodeIgrpClaims(makeJwt({ sub: 'x' }));
    expect(c.permissions).toEqual([]);
    expect(c.roles).toEqual([]);
    expect(c.isSuperAdmin).toBe(false);
  });

  it('throws on a missing token', () => {
    expect(() => decodeIgrpClaims('')).toThrow();
  });

  it('throws on a non-JWT string', () => {
    expect(() => decodeIgrpClaims('preview-token')).toThrow();
  });
});

describe('claimsAllow', () => {
  const claims: IGRPAccessClaims = { permissions: ['DEPT_IGRP.manage_access'], roles: [], org: 'DEPT_IGRP', isSuperAdmin: false };

  it('matches a bare name qualified by org', () => {
    expect(claimsAllow(claims, 'manage_access')).toBe(true);
    expect(claimsAllow(claims, 'other')).toBe(false);
  });

  it('matches a fully-qualified name as-is', () => {
    expect(claimsAllow(claims, 'DEPT_IGRP.manage_access')).toBe(true);
    expect(claimsAllow(claims, 'DEPT_OTHER.manage_access')).toBe(false);
  });

  it('super admin bypasses everything', () => {
    expect(claimsAllow({ permissions: [], roles: [], isSuperAdmin: true }, 'anything')).toBe(true);
  });
});
