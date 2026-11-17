import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { IGRPClaimsState } from '@igrp/framework-next-auth/claims';

let session: { status: string; accessToken?: string } | null = null;
vi.mock('@igrp/framework-next-auth/client', () => ({
  useIGRPSession: () =>
    session && { state: { status: session.status, accessToken: session.accessToken } },
}));

const { IGRPSectionPermissions } = await import('../section-permissions.js');
const { IGRPGuardPage } = await import('../guard-page.js');
const { usePermissions } = await import('../use-permissions.js');

const SECRET = 'secret-page-content';
const FORBIDDEN_TITLE = 'Acesso negado';

const ok = (permissions: string[], extra: object = {}): IGRPClaimsState => ({
  status: 'ok',
  claims: { permissions, roles: ['admin'], org: 'DEPT', isSuperAdmin: false, ...extra },
});
const ERROR: IGRPClaimsState = { status: 'error', error: 'claims decode failed' };

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}

const within = (state: IGRPClaimsState, node: ReactNode) =>
  renderToString(<IGRPSectionPermissions state={state}>{node}</IGRPSectionPermissions>);

const guard = (state: IGRPClaimsState, permission: string | string[], extra = {}) =>
  within(
    state,
    <IGRPGuardPage permission={permission} {...extra}>
      {SECRET}
    </IGRPGuardPage>,
  );

describe('IGRPGuardPage', () => {
  it.each<[string, IGRPClaimsState, string | string[]]>([
    ['the permission is held', ok(['DEPT.read']), 'DEPT.read'],
    ['a bare name is qualified with the org', ok(['DEPT.read']), 'read'],
    ['every listed permission is held', ok(['DEPT.read', 'DEPT.write']), ['read', 'DEPT.write']],
    ['the user is super admin', ok([], { isSuperAdmin: true }), 'DEPT.anything'],
  ])('renders children when %s', (_label, state, permission) => {
    const html = guard(state, permission);
    expect(html).toContain(SECRET);
    expect(html).not.toContain(FORBIDDEN_TITLE);
  });

  it.each<[string, IGRPClaimsState, string | string[]]>([
    ['the permission is missing', ok(['DEPT.read']), 'DEPT.write'],
    ['only some listed permissions are held', ok(['DEPT.read']), ['read', 'write']],
    ['the list is empty', ok(['DEPT.read']), []],
    ['a bare name has no org to qualify it', ok(['DEPT.read'], { org: undefined }), 'read'],
    ['another org grants the same name', ok(['OTHER.read']), 'read'],
    ['the claims failed to decode', ERROR, 'DEPT.read'],
  ])('renders the 403 screen and never the children when %s', (_label, state, permission) => {
    const html = guard(state, permission);
    expect(html).not.toContain(SECRET);
    expect(html).toContain(FORBIDDEN_TITLE);
    expect(html).toContain('403');
  });

  it('forwards forbiddenProps to the 403 screen', () => {
    const html = guard(ok([]), 'x', { forbiddenProps: { title: 'No way', homeHref: null } });
    expect(html).toContain('No way');
    expect(html).not.toContain('href=');
    expect(html).not.toContain(SECRET);
  });

  it('renders the fallback instead of the 403 screen, even with forbiddenProps', () => {
    const html = guard(ok([]), 'x', {
      fallback: <span>custom-fallback</span>,
      forbiddenProps: { title: 'No way' },
    });
    expect(html).toContain('custom-fallback');
    expect(html).not.toContain('No way');
    expect(html).not.toContain(SECRET);
  });

  it('throws rather than rendering children outside <IGRPSectionPermissions>', () => {
    expect(() => renderToString(<IGRPGuardPage permission="x">{SECRET}</IGRPGuardPage>)).toThrow(
      /IGRPSectionPermissions/,
    );
  });

  describe('with a live session', () => {
    const run = (s: typeof session, state: IGRPClaimsState) => {
      session = s;
      try {
        return guard(state, 'DEPT.write');
      } finally {
        session = null;
      }
    };

    it('keeps gating on the seeded claims while the session is loading', () => {
      expect(run({ status: 'loading' }, ok(['DEPT.read']))).not.toContain(SECRET);
      expect(run({ status: 'loading' }, ok(['DEPT.write']))).toContain(SECRET);
    });

    it('gates on the live token once authenticated', () => {
      const token = makeJwt({ org: 'DEPT', permissions: ['DEPT.write'], is_super_admin: false });
      expect(run({ status: 'authenticated', accessToken: token }, ok([]))).toContain(SECRET);
    });

    it('denies when the live token cannot be decoded', () => {
      const html = run({ status: 'authenticated', accessToken: 'a.b.c' }, ok(['DEPT.write']));
      expect(html).not.toContain(SECRET);
      expect(html).toContain(FORBIDDEN_TITLE);
    });

    it('falls back to the seed for a session with no token', () => {
      expect(run({ status: 'unauthenticated' }, ok(['DEPT.read']))).not.toContain(SECRET);
    });
  });
});

describe('usePermissions', () => {
  function Probe() {
    const p = usePermissions();
    return (
      <output>
        {JSON.stringify({
          status: p.status,
          permissions: p.permissions,
          roles: p.roles,
          selectedRole: p.selectedRole ?? null,
          isSuperAdmin: p.isSuperAdmin,
          error: p.error ?? null,
          canRead: p.isAllowed('read'),
        })}
      </output>
    );
  }
  const read = (state: IGRPClaimsState) =>
    JSON.parse(
      within(state, <Probe />)
        .replace(/^<output>|<\/output>$/g, '')
        .replace(/&quot;/g, '"'),
    );

  it('exposes the claims when they are ok', () => {
    expect(read(ok(['DEPT.read'], { selectedRole: 'admin' }))).toEqual({
      status: 'ok',
      permissions: ['DEPT.read'],
      roles: ['admin'],
      selectedRole: 'admin',
      isSuperAdmin: false,
      error: null,
      canRead: true,
    });
  });

  it('exposes nothing and allows nothing when the claims errored', () => {
    expect(read(ERROR)).toEqual({
      status: 'error',
      permissions: [],
      roles: [],
      selectedRole: null,
      isSuperAdmin: false,
      error: 'claims decode failed',
      canRead: false,
    });
  });

  it('throws outside <IGRPSectionPermissions>', () => {
    expect(() => renderToString(<Probe />)).toThrow(/IGRPSectionPermissions/);
  });
});
