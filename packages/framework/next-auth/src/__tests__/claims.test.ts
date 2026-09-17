import { describe, it, expect } from 'vitest';
import {
  decodeIgrpClaims,
  claimsAllow,
  claimsExpired,
  CLAIMS_CLOCK_SKEW_MS,
  type IGRPAccessClaims,
} from '../claims';

// Build a JWT with the given payload (header.payload.signature; signature unused).
function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
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
    const t = makeJwt({
      aud: ['igrp-access-management'],
      resource_access: { 'igrp-access-management': { roles: ['R'] } },
      permissions: [],
    });
    expect(decodeIgrpClaims(t).roles).toEqual(['R']);
  });

  it('returns empty arrays when claims are absent', () => {
    const c = decodeIgrpClaims(makeJwt({ sub: 'x' }));
    expect(c.permissions).toEqual([]);
    expect(c.roles).toEqual([]);
    expect(c.isSuperAdmin).toBe(false);
  });

  it('throws on a missing token', () => {
    expect(() => decodeIgrpClaims('')).toThrow('decodeIgrpClaims: missing access token');
  });

  it('throws on a non-JWT string', () => {
    expect(() => decodeIgrpClaims('preview-token')).toThrow('decodeIgrpClaims: not a JWT');
  });

  it('throws on a string with the wrong segment count', () => {
    expect(() => decodeIgrpClaims('a.b.c.d')).toThrow('decodeIgrpClaims: not a JWT');
  });
});

describe('claimsAllow', () => {
  const claims: IGRPAccessClaims = {
    permissions: ['DEPT_IGRP.manage_access'],
    roles: [],
    org: 'DEPT_IGRP',
    isSuperAdmin: false,
  };

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

  it('denies a bare name when there is no active org', () => {
    expect(
      claimsAllow(
        { permissions: ['manage_access'], roles: [], isSuperAdmin: false },
        'manage_access',
      ),
    ).toBe(false);
  });
});

describe('decodeIgrpClaims — resource_access selection', () => {
  function makeJwt(payload: Record<string, unknown>): string {
    const b64 = (value: string) =>
      Buffer.from(value, 'utf-8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return [b64('{"alg":"none"}'), b64(JSON.stringify(payload)), 'sig'].join('.');
  }

  it('does not take aud[0] when the first audience is Keycloak\'s "account"', () => {
    // Regression: aud[0] resolved to resource_access.account, so the app's own
    // roles vanished and looked identical to "user has no roles".
    const claims = decodeIgrpClaims(
      makeJwt({
        aud: ['account', 'igrp-client'],
        resource_access: {
          account: { roles: ['manage-account'] },
          'igrp-client': { roles: ['admin', 'editor'] },
        },
      }),
    );
    expect(claims.roles).toEqual(['admin', 'editor']);
  });

  it('prefers azp over the audience list', () => {
    const claims = decodeIgrpClaims(
      makeJwt({
        azp: 'igrp-client',
        aud: ['account', 'other-client'],
        resource_access: {
          account: { roles: ['manage-account'] },
          'other-client': { roles: ['wrong'] },
          'igrp-client': { roles: ['right'] },
        },
      }),
    );
    expect(claims.roles).toEqual(['right']);
  });

  it('falls back to the sole resource_access entry when nothing matches', () => {
    const claims = decodeIgrpClaims(
      makeJwt({
        aud: ['unrelated'],
        resource_access: { 'igrp-client': { roles: ['only'] } },
      }),
    );
    expect(claims.roles).toEqual(['only']);
  });

  it('returns [] rather than guessing between several unmatched clients', () => {
    const claims = decodeIgrpClaims(
      makeJwt({
        aud: ['unrelated'],
        resource_access: { a: { roles: ['x'] }, b: { roles: ['y'] } },
      }),
    );
    expect(claims.roles).toEqual([]);
  });

  it('still reads roles from a plain string aud', () => {
    const claims = decodeIgrpClaims(
      makeJwt({ aud: 'igrp-client', resource_access: { 'igrp-client': { roles: ['r'] } } }),
    );
    expect(claims.roles).toEqual(['r']);
  });
});

describe('decodeIgrpClaims — exp / claimsExpired', () => {
  const NOW = 1_700_000_000_000;

  it('decodes exp from seconds into milliseconds', () => {
    const claims = decodeIgrpClaims(makeJwt({ exp: NOW / 1000 }));
    expect(claims.expiresAt).toBe(NOW);
  });

  it('leaves expiresAt undefined when the token carries no exp', () => {
    expect(decodeIgrpClaims(makeJwt({})).expiresAt).toBeUndefined();
    expect(decodeIgrpClaims(makeJwt({ exp: 'soon' })).expiresAt).toBeUndefined();
  });

  it('treats a token past exp (plus skew) as expired', () => {
    const claims = decodeIgrpClaims(makeJwt({ exp: NOW / 1000 }));
    expect(claimsExpired(claims, NOW - 1)).toBe(false);
    // Inside the skew allowance — still usable.
    expect(claimsExpired(claims, NOW + 10_000)).toBe(false);
    expect(claimsExpired(claims, NOW + CLAIMS_CLOCK_SKEW_MS)).toBe(true);
    expect(claimsExpired(claims, NOW + 120_000)).toBe(true);
  });

  it('never treats claims without exp as expired', () => {
    // Some deployments issue tokens with no exp; inventing one would deny forever.
    const claims = decodeIgrpClaims(makeJwt({}));
    expect(claimsExpired(claims, NOW + 10 ** 12)).toBe(false);
  });
});
