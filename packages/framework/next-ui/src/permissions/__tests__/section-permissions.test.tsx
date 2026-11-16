// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { IGRPClaimsState } from '@igrp/framework-next-auth/claims';

let session: { status: string; data: { accessToken?: string } | null } | null = null;
vi.mock('@igrp/framework-next-auth/client', () => ({
  useIGRPSession: () =>
    session && {
      state: { status: session.status, data: session.data, accessToken: session.data?.accessToken },
      actions: { update: vi.fn() },
    },
}));

const { IGRPSectionPermissions, usePermissionsContext } = await import('../section-permissions.js');

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}

const SEEDED: IGRPClaimsState = {
  status: 'ok',
  claims: { permissions: ['DEPT_IGRP.read'], roles: [], org: 'DEPT_IGRP', isSuperAdmin: false },
};
const LIVE_TOKEN = makeJwt({
  org: 'DEPT_IGRP',
  permissions: ['DEPT_IGRP.read', 'DEPT_IGRP.delete'],
  is_super_admin: false,
});

let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

function Probe() {
  const { state } = usePermissionsContext();
  return <>{state.status === 'ok' ? state.claims.permissions.join(',') : state.status}</>;
}

function render() {
  act(() =>
    root!.render(
      <IGRPSectionPermissions state={SEEDED}>
        <Probe />
      </IGRPSectionPermissions>,
    ),
  );
}

describe('IGRPSectionPermissions during a session refetch', () => {
  it('keeps the last live claims instead of flickering back to the seed', () => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);

    session = { status: 'loading', data: null };
    render();
    expect(container.textContent).toBe('DEPT_IGRP.read');

    session = { status: 'authenticated', data: { accessToken: LIVE_TOKEN } };
    render();
    expect(container.textContent).toBe('DEPT_IGRP.read,DEPT_IGRP.delete');

    // `update()` / a refetch flips the status back to loading.
    session = { status: 'loading', data: { accessToken: LIVE_TOKEN } };
    render();
    expect(container.textContent).toBe('DEPT_IGRP.read,DEPT_IGRP.delete');
  });
});
