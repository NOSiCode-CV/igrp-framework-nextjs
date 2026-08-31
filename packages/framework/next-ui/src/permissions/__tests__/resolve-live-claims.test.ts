import { describe, it, expect } from 'vitest';
import type { IGRPClaimsState } from '@igrp/framework-next-auth/claims';

import { resolveLiveClaims } from '../resolve-live-claims';

/**
 * Regression cover for: client permission claims frozen for the whole page
 * load. The server-seeded `claims` prop arrives exactly once (no
 * `router.refresh()` on token rotation; shared layouts do not re-render on
 * client navigation), so gating answered from login-time claims until a reload.
 */

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}

/** What the server seeded at page load: one permission, no super admin. */
const SEEDED: IGRPClaimsState = {
  status: 'ok',
  claims: {
    permissions: ['DEPT_IGRP.read_invoice'],
    roles: [],
    org: 'DEPT_IGRP',
    isSuperAdmin: false,
  },
};

/** What a later token carries: the permission was granted since page load. */
const ROTATED_TOKEN = makeJwt({
  org: 'DEPT_IGRP',
  permissions: ['DEPT_IGRP.read_invoice', 'DEPT_IGRP.delete_invoice'],
  is_super_admin: false,
});

/** The auth-bypass / preview-mode stand-in — deliberately not a JWT. */
const PREVIEW_TOKEN = 'preview-token';

const PREVIEW_SEEDED: IGRPClaimsState = {
  status: 'ok',
  claims: { permissions: [], roles: [], isSuperAdmin: true },
};

describe('T6 — G1: no SessionProvider mounted', () => {
  it('keeps the server-seeded claims instead of failing', () => {
    expect(resolveLiveClaims({ seeded: SEEDED, session: null })).toBe(SEEDED);
  });

  it('keeps a seeded ERROR state too (does not mask it as ok)', () => {
    const seeded: IGRPClaimsState = { status: 'error', error: 'missing access token' };
    expect(resolveLiveClaims({ seeded, session: null })).toBe(seeded);
  });
});

describe('T7 — G2: session still loading', () => {
  it('keeps the seeded claims rather than blanking every gated control', () => {
    const out = resolveLiveClaims({
      seeded: SEEDED,
      session: { status: 'loading', accessToken: ROTATED_TOKEN },
    });
    expect(out).toBe(SEEDED);
  });
});

describe('T8 — G3: non-JWT token (preview / auth bypass)', () => {
  it('leaves the super-admin mock untouched so every gate still passes', () => {
    const out = resolveLiveClaims({
      seeded: PREVIEW_SEEDED,
      session: { status: 'authenticated', accessToken: PREVIEW_TOKEN },
    });
    expect(out).toBe(PREVIEW_SEEDED);
  });

  it.each([
    ['empty', ''],
    ['two parts', 'header.payload'],
    ['four parts', 'a.b.c.d'],
    ['empty middle part', 'header..sig'],
  ])('does not attempt to decode a %s token', (_label, token) => {
    expect(
      resolveLiveClaims({
        seeded: SEEDED,
        session: { status: 'authenticated', accessToken: token },
      }),
    ).toBe(SEEDED);
  });

  it('keeps the seeded claims when the session carries no token at all', () => {
    expect(resolveLiveClaims({ seeded: SEEDED, session: { status: 'unauthenticated' } })).toBe(
      SEEDED,
    );
  });
});

describe('T9 — live claims win once a real token is present', () => {
  it('reflects a permission granted AFTER the page was served', () => {
    const out = resolveLiveClaims({
      seeded: SEEDED,
      session: { status: 'authenticated', accessToken: ROTATED_TOKEN },
    });
    expect(out.status).toBe('ok');
    if (out.status !== 'ok') return;
    expect(out.claims.permissions).toContain('DEPT_IGRP.delete_invoice');
    // Before the fix this stayed at the seeded single permission for the whole
    // page-load lifetime.
    expect(out.claims.permissions).not.toEqual(
      SEEDED.status === 'ok' ? SEEDED.claims.permissions : [],
    );
  });

  it('also reflects a permission REVOKED since page load', () => {
    const narrowed = makeJwt({ org: 'DEPT_IGRP', permissions: [], is_super_admin: false });
    const out = resolveLiveClaims({
      seeded: SEEDED,
      session: { status: 'authenticated', accessToken: narrowed },
    });
    expect(out.status).toBe('ok');
    if (out.status === 'ok') expect(out.claims.permissions).toEqual([]);
  });
});

describe('T10 — JWT-shaped token that fails to decode', () => {
  it('enters the error state (a genuine failure, unlike G2/G3)', () => {
    const out = resolveLiveClaims({
      seeded: SEEDED,
      session: { status: 'authenticated', accessToken: 'not.valid.base64json' },
    });
    expect(out.status).toBe('error');
  });
});
