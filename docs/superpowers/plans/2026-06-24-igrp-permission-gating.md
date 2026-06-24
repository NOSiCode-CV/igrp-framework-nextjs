# IGRP Permission Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add token-claims-based permission gating for pages and components (menus already scoped by AM) across the IGRP framework, plus a worked example in the template.

**Architecture:** Decode the IGRP access-token claims (`permissions`, `roles`, `selectedRole`, `org`, `is_super_admin`) — zero network. A pure decoder + matcher live in `next-auth` (`./claims`); server helpers (`igrpGetClaims`/`igrpAuthorize`/`igrpAssertAuthorize`) live in `next`; a client provider/hook/components (`IGRPSectionPermissions`/`usePermissions`/`<IGRPAuthorization>`/`<IGRPGuardPage>`/`IGRPForbidden`) live in `next-ui`. The AM API remains the real enforcement on every data call.

**Tech Stack:** TypeScript, Next.js 15.5 (App Router, `forbidden()` + `experimental.authInterrupts`), React 19.2, NextAuth v4, pnpm workspace, vitest 4 (next-auth + next), tsup (next-auth), SWC+Babel (next/next-ui), Biome (template).

**Scope:** This plan implements **Phase 0 (claims contract) + Phase 1 (core gating)** from the spec §10. The following are **explicitly OUT of scope** — each is a separate later plan: PDP helpers (`igrpCheckAccess`/`igrpAssertAccess`), active-role switch (`igrpSetActiveRole` + the `jwt`-callback `trigger:'update'` change + `useSetActiveRole`), the `next-types`↔client type-drift reconciliation (D13), and the `keepMounted`/`<Activity>` opt-in on `<IGRPAuthorization>`.

**Spec:** `docs/superpowers/specs/2026-06-24-igrp-permission-gating-design.md`

## Global Constraints

- **pnpm only**; Node ≥ 22; internal deps are `workspace:*` (linked, built locally).
- **Build order is fixed:** `next-auth → next-types → design-system → next-ui → next`. After framework changes, run `pnpm build:framework` before the template consumes them. Per-package: `pnpm build:auth`, `pnpm build:next-types`, `pnpm build:next-ui`, `pnpm build:next`.
- **Don't edit `dist/`** (source is `src/`); **don't import package internals** — use documented subpath exports.
- **Lint/format is package-specific:** framework packages = ESLint + Prettier; `templates/demo-legacy` = Biome. Never cross-apply.
- **Changesets: `patch` type only** (repo is in pre-release `beta` mode); one per publishable package changed.
- **Type home:** `IGRPAccessClaims`, `IGRPClaimsState`, `decodeIgrpClaims`, `claimsAllow` are **defined in `next-auth`** (`./claims`) and the **types re-exported from `next-types`** — because `next-auth` is upstream of `next-types`.
- **Matching rule:** `claimsAllow(claims, name)` → `is_super_admin` bypasses all; a `name` containing `.` is matched as-is; otherwise it's qualified with the active `org` → `` `${org}.${name}` ``. Fail-closed.
- **Preview/bypass:** `igrpGetClaims` returns a super-admin mock when `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`. Every gate must behave correctly with bypass **on and off**.
- **Naming (load-bearing):** `Authorize` = token gating (this plan). `Access` = PDP (Phase 2). Never merge the families.
- **UI rules (next-ui + template):** Horizon (`IGRP*`) first; **semantic tokens only** (`bg-background`, `text-foreground`, `text-muted-foreground`) — no raw colors, no manual `dark:`; `cn()` to merge classes; `size-*` when width=height; `flex gap-*` not `space-*`; every file importing the DS needs `'use client'`. DS-facing default copy is **pt-PT**, exposed as overridable props.

---

## File Structure

**`packages/framework/next-auth/`**
- Create `src/claims.ts` — `IGRPAccessClaims`, `IGRPClaimsState` types; `decodeIgrpClaims` (pure, throwing on malformed); `claimsAllow` (pure matcher).
- Create `src/__tests__/claims.test.ts` — unit tests.
- Modify `tsup.config.ts` — add `claims` entry.
- Modify `package.json` — add `./claims` export.

**`packages/framework/next-types/`**
- Modify `src/index.ts` — re-export `IGRPAccessClaims`, `IGRPClaimsState` from `@igrp/framework-next-auth/claims`.

**`packages/framework/next/`**
- Create `src/lib/permissions.ts` — `isIgrpAuthBypass`, `igrpGetClaims`, `igrpAuthorize`, `igrpAssertAuthorize`.
- Create `src/lib/__tests__/permissions.test.ts` — unit tests.
- Modify `src/index.ts` — export the four symbols.

**`packages/framework/next-ui/`**
- Create `src/permissions/section-permissions.tsx` — `IGRPSectionPermissions` provider + `usePermissionsContext`.
- Create `src/permissions/use-permissions.ts` — `usePermissions` hook.
- Create `src/permissions/forbidden.tsx` — `IGRPForbidden` 403 UI.
- Create `src/permissions/authorization.tsx` — `IGRPAuthorization` gate component.
- Create `src/permissions/guard-page.tsx` — `IGRPGuardPage` client guard.
- Modify `src/index.ts` — export the five symbols.
- Modify `package.json` — ensure `@igrp/framework-next-auth` is a dependency.

**`templates/demo-legacy/`**
- Modify `next.config.ts` — add `experimental.authInterrupts: true`.
- Modify `src/app/(igrp)/layout.tsx` — seed `IGRPSectionPermissions` from `igrpGetClaims()`.
- Create `src/app/(igrp)/forbidden.tsx` — renders `IGRPForbidden`.
- Create `src/app/(igrp)/(myapp)/exemplo-permissao/page.tsx` — worked example (page guard).
- Create `src/app/(igrp)/(myapp)/exemplo-permissao/_components/actions.tsx` — worked example (component gate).
- Create `docs/PERMISSIONS.md` — usage + per-page guard checklist (§9.1 L3).

---

## Task 1: Claims contract (next-auth `./claims`) — Phase 0 keystone

**Files:**
- Create: `packages/framework/next-auth/src/claims.ts`
- Test: `packages/framework/next-auth/src/__tests__/claims.test.ts`
- Modify: `packages/framework/next-auth/tsup.config.ts`, `packages/framework/next-auth/package.json`

**Interfaces:**
- Produces:
  - `interface IGRPAccessClaims { permissions: string[]; roles: string[]; selectedRole?: string; org?: string; isSuperAdmin: boolean; sub?: string; email?: string }`
  - `type IGRPClaimsState = { status: 'ok'; claims: IGRPAccessClaims } | { status: 'error'; error: string }`
  - `decodeIgrpClaims(accessToken: string): IGRPAccessClaims` — **throws** on missing/malformed token (caller maps to the error state).
  - `claimsAllow(claims: IGRPAccessClaims, name: string): boolean`

- [ ] **Step 1: Write the failing tests**

Create `packages/framework/next-auth/src/__tests__/claims.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run claims`
Expected: FAIL — `Cannot find module '../claims'`.

- [ ] **Step 3: Implement `src/claims.ts`**

Create `packages/framework/next-auth/src/claims.ts`:

```ts
/**
 * Pure, runtime-agnostic decoding + matching for IGRP access-token claims.
 * No `Buffer` (Edge has none); uses `atob` + `TextDecoder`, available in
 * Node 18+, Edge, and browsers. No signature verification — server-side the
 * token is sealed in the NextAuth cookie; client-side gating is cosmetic.
 */

export interface IGRPAccessClaims {
  /** Fully-qualified `${dept}.${suffix}`, all departments. Suffix is arbitrary. */
  permissions: string[];
  /** `resource_access[aud].roles`. */
  roles: string[];
  selectedRole?: string;
  /** Active department. */
  org?: string;
  isSuperAdmin: boolean;
  sub?: string;
  email?: string;
}

export type IGRPClaimsState =
  | { status: 'ok'; claims: IGRPAccessClaims }
  | { status: 'error'; error: string };

function base64UrlDecode(input: string): string {
  const padLen = input.length % 4;
  const padded = padLen === 0 ? input : input + '='.repeat(4 - padLen);
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Decode the JWT payload of an IGRP access token into claims.
 * THROWS on a missing or malformed token — callers map the throw to an
 * error state so a decode failure is never confused with "no permissions".
 */
export function decodeIgrpClaims(accessToken: string): IGRPAccessClaims {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('decodeIgrpClaims: missing access token');
  }
  const parts = accessToken.split('.');
  if (parts.length < 2) {
    throw new Error('decodeIgrpClaims: not a JWT');
  }
  const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;

  const aud = payload.aud;
  const audKey = Array.isArray(aud) ? aud[0] : aud;
  const resourceAccess = (payload.resource_access ?? {}) as Record<string, { roles?: string[] }>;
  const roles =
    typeof audKey === 'string' && Array.isArray(resourceAccess[audKey]?.roles)
      ? (resourceAccess[audKey]!.roles as string[])
      : [];

  return {
    permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [],
    roles,
    selectedRole: typeof payload.selectedRole === 'string' ? payload.selectedRole : undefined,
    org: typeof payload.org === 'string' ? payload.org : undefined,
    isSuperAdmin: payload.is_super_admin === true,
    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}

/**
 * True when the claims grant `name`. Super admin bypasses; a dotted `name`
 * is matched verbatim; a bare `name` is qualified with the active `org`.
 */
export function claimsAllow(claims: IGRPAccessClaims, name: string): boolean {
  if (claims.isSuperAdmin) return true;
  const qualified = name.includes('.') ? name : claims.org ? `${claims.org}.${name}` : name;
  return claims.permissions.includes(qualified);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run claims`
Expected: PASS (all cases).

- [ ] **Step 5: Wire the `./claims` subpath export**

In `packages/framework/next-auth/tsup.config.ts`, add to the `entry` map (after `types: 'src/types.ts',`):

```ts
    claims: 'src/claims.ts',
```

In `packages/framework/next-auth/package.json`, add to `exports` (after the `"./types"` block, before `"./package.json"`):

```json
  "./claims": {
    "types": "./dist/claims.d.ts",
    "import": "./dist/claims.js"
  },
```

- [ ] **Step 6: Build next-auth and verify the entry emits**

Run: `pnpm build:auth`
Expected: completes; `packages/framework/next-auth/dist/claims.js` and `dist/claims.d.ts` exist.

- [ ] **Step 7: Commit**

```bash
git add packages/framework/next-auth/src/claims.ts packages/framework/next-auth/src/__tests__/claims.test.ts packages/framework/next-auth/tsup.config.ts packages/framework/next-auth/package.json
git commit -m "feat(next-auth): add token-claims decoder and matcher (./claims)"
```

---

## Task 2: Re-export claim types from next-types

**Files:**
- Modify: `packages/framework/next-types/src/index.ts`

**Interfaces:**
- Consumes: `IGRPAccessClaims`, `IGRPClaimsState` from `@igrp/framework-next-auth/claims`.
- Produces: the same two types, importable from `@igrp/framework-next-types`.

- [ ] **Step 1: Add the re-export**

Append to `packages/framework/next-types/src/index.ts`:

```ts
export type { IGRPAccessClaims, IGRPClaimsState } from '@igrp/framework-next-auth/claims';
```

- [ ] **Step 2: Build next-types and verify it compiles**

Run: `pnpm build:next-types`
Expected: completes with no TS errors; `dist/index.d.ts` references the two types.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-types/src/index.ts
git commit -m "feat(next-types): re-export IGRPAccessClaims/IGRPClaimsState from next-auth"
```

---

## Task 3: Server gating helpers (next)

**Files:**
- Create: `packages/framework/next/src/lib/permissions.ts`
- Test: `packages/framework/next/src/lib/__tests__/permissions.test.ts`
- Modify: `packages/framework/next/src/index.ts`

**Interfaces:**
- Consumes: `decodeIgrpClaims`, `claimsAllow`, `IGRPClaimsState`, `IGRPAccessClaims` from `@igrp/framework-next-auth/claims`; `igrpGetAccessClientConfig` from `./api-config`; `forbidden` from `next/navigation`.
- Produces:
  - `isIgrpAuthBypass(env?): boolean`
  - `igrpGetClaims(): Promise<IGRPClaimsState>` (React.cache-deduped; bypass → super-admin mock)
  - `igrpAuthorize(name: string): Promise<boolean>`
  - `igrpAssertAuthorize(name: string): Promise<void>` (deny → `forbidden()`; decode error → throws)

- [ ] **Step 1: Write the failing tests**

Create `packages/framework/next/src/lib/__tests__/permissions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const getConfig = vi.fn();
vi.mock('../api-config', () => ({ igrpGetAccessClientConfig: () => getConfig() }));
const forbidden = vi.fn(() => {
  throw new Error('FORBIDDEN_CALLED');
});
vi.mock('next/navigation', () => ({ forbidden: () => forbidden() }));

// React.cache is a no-op-friendly wrapper outside a render; import after mocks.
import { isIgrpAuthBypass, igrpGetClaims, igrpAuthorize, igrpAssertAuthorize } from '../permissions';

function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.s`;
}
const TOKEN = makeJwt({ org: 'DEPT_IGRP', permissions: ['DEPT_IGRP.manage_access'], is_super_admin: false });

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
    expect(state).toEqual({ status: 'ok', claims: { permissions: [], roles: [], isSuperAdmin: true } });
  });

  it('decodes the token when not in bypass', async () => {
    getConfig.mockReturnValue({ token: TOKEN, baseUrl: '' });
    const state = await igrpGetClaims();
    expect(state.status).toBe('ok');
    if (state.status === 'ok') expect(state.claims.permissions).toEqual(['DEPT_IGRP.manage_access']);
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @igrp/framework-next exec vitest run permissions`
Expected: FAIL — `Cannot find module '../permissions'`.

- [ ] **Step 3: Implement `src/lib/permissions.ts`**

Create `packages/framework/next/src/lib/permissions.ts`:

```ts
import { cache } from 'react';
import { forbidden } from 'next/navigation';
import {
  decodeIgrpClaims,
  claimsAllow,
  type IGRPAccessClaims,
  type IGRPClaimsState,
} from '@igrp/framework-next-auth/claims';

import { igrpGetAccessClientConfig } from './api-config';

const SUPER_ADMIN_MOCK: IGRPAccessClaims = { permissions: [], roles: [], isSuperAdmin: true };

/** True when auth is bypassed (preview mode or AUTH_PROVIDER=none). */
export function isIgrpAuthBypass(env: Record<string, string | undefined> = process.env): boolean {
  const preview =
    String(env.IGRP_PREVIEW_MODE ?? '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .toLowerCase() === 'true';
  const noneProvider = String(env.AUTH_PROVIDER ?? '').trim().toLowerCase() === 'none';
  return preview || noneProvider;
}

/**
 * Resolve the current request's permission claims. Bypass → super-admin mock
 * (does NOT attempt to decode the non-JWT preview token). Otherwise decode the
 * per-request access token; a decode failure becomes a distinguishable error
 * state (never silently "no permissions"). Deduped per render via React.cache.
 */
export const igrpGetClaims = cache(async function igrpGetClaims(): Promise<IGRPClaimsState> {
  if (isIgrpAuthBypass()) {
    return { status: 'ok', claims: { ...SUPER_ADMIN_MOCK } };
  }
  try {
    const { token } = igrpGetAccessClientConfig();
    return { status: 'ok', claims: decodeIgrpClaims(token) };
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : 'claims decode failed' };
  }
});

/** Boolean permission check (token claims). Fail-closed on error. */
export async function igrpAuthorize(name: string): Promise<boolean> {
  const state = await igrpGetClaims();
  return state.status === 'ok' && claimsAllow(state.claims, name);
}

/**
 * Page/render guard. Missing permission → forbidden() (403 → forbidden.tsx).
 * A claims decode error is NOT "forbidden" — it throws so the nearest
 * error.tsx renders a 5xx instead of mislabeling an outage as 403.
 */
export async function igrpAssertAuthorize(name: string): Promise<void> {
  const state = await igrpGetClaims();
  if (state.status === 'error') {
    throw new Error(`igrpAssertAuthorize: cannot determine permissions: ${state.error}`);
  }
  if (!claimsAllow(state.claims, name)) {
    forbidden();
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @igrp/framework-next exec vitest run permissions`
Expected: PASS (all cases).

- [ ] **Step 5: Export from the package root**

In `packages/framework/next/src/index.ts`, add after the `igrpGetAccessClientConfig` export block:

```ts
export {
  isIgrpAuthBypass,
  igrpGetClaims,
  igrpAuthorize,
  igrpAssertAuthorize,
} from './lib/permissions';
```

- [ ] **Step 6: Build next and verify**

Run: `pnpm build:next`
Expected: completes; `dist/lib/permissions.js` exists and the symbols appear in `dist/index.d.ts`.

- [ ] **Step 7: Commit**

```bash
git add packages/framework/next/src/lib/permissions.ts packages/framework/next/src/lib/__tests__/permissions.test.ts packages/framework/next/src/index.ts
git commit -m "feat(next): add igrpGetClaims/igrpAuthorize/igrpAssertAuthorize server gating"
```

---

## Task 4: Client provider + hook (next-ui)

**Files:**
- Create: `packages/framework/next-ui/src/permissions/section-permissions.tsx`
- Create: `packages/framework/next-ui/src/permissions/use-permissions.ts`
- Modify: `packages/framework/next-ui/src/index.ts`, `packages/framework/next-ui/package.json`

> **Testing note:** `next-ui` has no unit-test runner (no vitest/RTL — matches the repo). These client pieces are verified by **type-check/build** here and at **runtime** in the template (Task 7). All matching logic is already unit-tested in Task 1 (`claimsAllow`) and Task 3.

**Interfaces:**
- Consumes: `IGRPClaimsState` (type) and `claimsAllow` from `@igrp/framework-next-auth/claims`.
- Produces:
  - `IGRPSectionPermissions({ state, children })` — client provider seeded with `IGRPClaimsState`, holds it in local state (client-updatable for Phase 2).
  - `usePermissionsContext()` — internal context accessor.
  - `usePermissions()` → `{ can(name): boolean; permissions: string[]; roles: string[]; selectedRole?: string; isSuperAdmin: boolean; status: 'ok'|'error'; error?: string }`.

- [ ] **Step 1: Ensure next-auth is a dependency of next-ui**

Run: `node -e "const p=require('./packages/framework/next-ui/package.json'); console.log(p.dependencies['@igrp/framework-next-auth'] || 'MISSING')"`
If it prints `MISSING`, add to `packages/framework/next-ui/package.json` `dependencies`:

```json
    "@igrp/framework-next-auth": "workspace:*",
```

then run `pnpm install:deps`.

- [ ] **Step 2: Create the provider**

Create `packages/framework/next-ui/src/permissions/section-permissions.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { IGRPClaimsState } from '@igrp/framework-next-auth/claims';

type PermissionsContextValue = {
  state: IGRPClaimsState;
  setState: (next: IGRPClaimsState) => void;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Seeds permission claims into client context. Server-rendered parent passes
 * the decoded `IGRPClaimsState` (from `igrpGetClaims()`) as `state`. Held in
 * local state so it can be updated client-side later (Phase 2 role switch).
 */
export function IGRPSectionPermissions({
  state: initialState,
  children,
}: {
  state: IGRPClaimsState;
  children: ReactNode;
}) {
  const [state, setState] = useState<IGRPClaimsState>(initialState);
  return (
    <PermissionsContext.Provider value={{ state, setState }}>{children}</PermissionsContext.Provider>
  );
}

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within <IGRPSectionPermissions>');
  }
  return ctx;
}
```

- [ ] **Step 3: Create the hook**

Create `packages/framework/next-ui/src/permissions/use-permissions.ts`:

```ts
'use client';

import { claimsAllow } from '@igrp/framework-next-auth/claims';

import { usePermissionsContext } from './section-permissions';

/** Read permission claims from context. `can(name)` follows the matching rule. */
export function usePermissions() {
  const { state } = usePermissionsContext();
  const ok = state.status === 'ok';
  return {
    can: (name: string): boolean => ok && claimsAllow(state.claims, name),
    permissions: ok ? state.claims.permissions : [],
    roles: ok ? state.claims.roles : [],
    selectedRole: ok ? state.claims.selectedRole : undefined,
    isSuperAdmin: ok ? state.claims.isSuperAdmin : false,
    status: state.status,
    error: state.status === 'error' ? state.error : undefined,
  };
}
```

- [ ] **Step 4: Export from the next-ui barrel**

In `packages/framework/next-ui/src/index.ts`, add (named exports — the barrel forbids wildcards):

```ts
// permissions
export { IGRPSectionPermissions } from './permissions/section-permissions';
export { usePermissions } from './permissions/use-permissions';
```

- [ ] **Step 5: Build next-ui and verify it compiles**

Run: `pnpm build:next-ui`
Expected: completes; `dist/permissions/section-permissions.js` and `dist/permissions/use-permissions.js` exist; symbols present in `dist/index.d.ts`.

- [ ] **Step 6: Commit**

```bash
git add packages/framework/next-ui/src/permissions/section-permissions.tsx packages/framework/next-ui/src/permissions/use-permissions.ts packages/framework/next-ui/src/index.ts packages/framework/next-ui/package.json
git commit -m "feat(next-ui): add IGRPSectionPermissions provider + usePermissions hook"
```

---

## Task 5: Client gate components (next-ui)

**Files:**
- Create: `packages/framework/next-ui/src/permissions/forbidden.tsx`
- Create: `packages/framework/next-ui/src/permissions/authorization.tsx`
- Create: `packages/framework/next-ui/src/permissions/guard-page.tsx`
- Modify: `packages/framework/next-ui/src/index.ts`

**Interfaces:**
- Consumes: `usePermissions` from `./use-permissions`; `IGRPButton` from `@igrp/igrp-framework-react-design-system` (in `IGRPForbidden`).
- Produces:
  - `IGRPForbidden({ title?, description? })` — 403 UI; pt-PT defaults, overridable.
  - `IGRPAuthorization({ permission, mode?, fallback?, children })` — `mode` defaults to `'all'`; unmounts when denied.
  - `IGRPGuardPage({ permission, children })` — renders `IGRPForbidden` when denied (client convenience; server `igrpAssertAuthorize` is authoritative).

> `keepMounted`/`<Activity>` is **out of scope** (Phase 2); `<IGRPAuthorization>` unmounts when denied.

- [ ] **Step 1: Create the 403 UI**

Create `packages/framework/next-ui/src/permissions/forbidden.tsx`:

```tsx
'use client';

export interface IGRPForbiddenProps {
  /** pt-PT default; override for other locales. */
  title?: string;
  description?: string;
}

/** 403 screen. Semantic tokens only; pt-PT defaults exposed as props. */
export function IGRPForbidden({
  title = 'Acesso negado',
  description = 'Não tem permissão para aceder a este conteúdo.',
}: IGRPForbiddenProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-6xl font-bold text-muted-foreground">403</p>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-md text-muted-foreground">{description}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create the gate component**

Create `packages/framework/next-ui/src/permissions/authorization.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';

import { usePermissions } from './use-permissions';

export interface IGRPAuthorizationProps {
  /** One permission, or several. */
  permission: string | string[];
  /** With an array: require all (default) or any. */
  mode?: 'all' | 'any';
  /** Rendered when denied. Defaults to nothing (unmount). */
  fallback?: ReactNode;
  children: ReactNode;
}

/** Renders children only when the current user holds the permission(s). */
export function IGRPAuthorization({
  permission,
  mode = 'all',
  fallback = null,
  children,
}: IGRPAuthorizationProps) {
  const { can } = usePermissions();
  const names = Array.isArray(permission) ? permission : [permission];
  const allowed = mode === 'any' ? names.some((n) => can(n)) : names.every((n) => can(n));
  return <>{allowed ? children : fallback}</>;
}
```

- [ ] **Step 3: Create the client page guard**

Create `packages/framework/next-ui/src/permissions/guard-page.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';

import { IGRPForbidden } from './forbidden';
import { usePermissions } from './use-permissions';

/**
 * Client-side page convenience guard. Renders IGRPForbidden when denied.
 * NOTE: the authoritative page gate is the server-side `igrpAssertAuthorize`;
 * use this only for client-rendered pages.
 */
export function IGRPGuardPage({
  permission,
  children,
}: {
  permission: string | string[];
  children: ReactNode;
}) {
  const { can } = usePermissions();
  const names = Array.isArray(permission) ? permission : [permission];
  const allowed = names.every((n) => can(n));
  return <>{allowed ? children : <IGRPForbidden />}</>;
}
```

- [ ] **Step 4: Export from the next-ui barrel**

In `packages/framework/next-ui/src/index.ts`, extend the permissions block:

```ts
export { IGRPForbidden, type IGRPForbiddenProps } from './permissions/forbidden';
export { IGRPAuthorization, type IGRPAuthorizationProps } from './permissions/authorization';
export { IGRPGuardPage } from './permissions/guard-page';
```

- [ ] **Step 5: Build next-ui and verify**

Run: `pnpm build:next-ui`
Expected: completes; `dist/permissions/{forbidden,authorization,guard-page}.js` exist; symbols in `dist/index.d.ts`.

- [ ] **Step 6: Commit**

```bash
git add packages/framework/next-ui/src/permissions/forbidden.tsx packages/framework/next-ui/src/permissions/authorization.tsx packages/framework/next-ui/src/permissions/guard-page.tsx packages/framework/next-ui/src/index.ts
git commit -m "feat(next-ui): add IGRPAuthorization, IGRPGuardPage, IGRPForbidden"
```

---

## Task 6: Template wiring (provider seed, 403 boundary, authInterrupts)

**Files:**
- Modify: `templates/demo-legacy/next.config.ts`
- Modify: `templates/demo-legacy/src/app/(igrp)/layout.tsx`
- Create: `templates/demo-legacy/src/app/(igrp)/forbidden.tsx`

**Interfaces:**
- Consumes: `igrpGetClaims` from `@igrp/framework-next`; `IGRPSectionPermissions`, `IGRPForbidden` from `@igrp/framework-next-ui`.

- [ ] **Step 1: Rebuild the framework so the template sees the new exports**

Run: `pnpm build:framework`
Expected: full ordered build completes (next-auth → next-types → design-system → next-ui → next).

- [ ] **Step 2: Enable `authInterrupts`**

In `templates/demo-legacy/next.config.ts`, inside `experimental: { ... }`, add:

```ts
    authInterrupts: true,
```

- [ ] **Step 3: Seed the permissions provider in the (igrp) layout**

Edit `templates/demo-legacy/src/app/(igrp)/layout.tsx` to:

```tsx
import { IGRPLayoutFull, igrpGetClaims } from "@igrp/framework-next";
import { IGRPSectionPermissions } from "@igrp/framework-next-ui";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";

import { configLayout } from "@/actions/igrp/layout";
import { createConfig } from "@/igrp.template.config";
import { verifySession } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await verifySession();

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);
  const claims = await igrpGetClaims();

  return (
    <IGRPSectionPermissions state={claims}>
      <IGRPLayoutFull config={config}>{children}</IGRPLayoutFull>
    </IGRPSectionPermissions>
  );
}
```

(`verifySession()` runs first and sets the per-request access-client config, so `igrpGetClaims()` reads the right token.)

- [ ] **Step 4: Add the 403 boundary**

Create `templates/demo-legacy/src/app/(igrp)/forbidden.tsx`:

```tsx
import { IGRPForbidden } from "@igrp/framework-next-ui";

export default function Forbidden() {
  return <IGRPForbidden />;
}
```

- [ ] **Step 5: Type-check the template build**

Run: `pnpm build:demo`
Expected: Biome format + `next build` complete with no type errors. (If `authInterrupts`/`forbidden()` types error, confirm Next is ≥ 15.5 — `node -e "console.log(require('./templates/demo-legacy/node_modules/next/package.json').version)"`.)

- [ ] **Step 6: Commit**

```bash
git add templates/demo-legacy/next.config.ts "templates/demo-legacy/src/app/(igrp)/layout.tsx" "templates/demo-legacy/src/app/(igrp)/forbidden.tsx"
git commit -m "feat(demo-legacy): seed permissions provider + 403 boundary, enable authInterrupts"
```

---

## Task 7: Worked example + docs + runtime verification

**Files:**
- Create: `templates/demo-legacy/src/app/(igrp)/(myapp)/exemplo-permissao/page.tsx`
- Create: `templates/demo-legacy/src/app/(igrp)/(myapp)/exemplo-permissao/_components/actions.tsx`
- Create: `templates/demo-legacy/docs/PERMISSIONS.md`

**Interfaces:**
- Consumes: `igrpAssertAuthorize` from `@igrp/framework-next`; `IGRPAuthorization` from `@igrp/framework-next-ui`; `IGRPButton` from the design system.

- [ ] **Step 1: Create the gated page (server guard)**

Create `templates/demo-legacy/src/app/(igrp)/(myapp)/exemplo-permissao/page.tsx`:

```tsx
import { igrpAssertAuthorize } from "@igrp/framework-next";

import { ExemploActions } from "./_components/actions";

export default async function ExemploPermissaoPage() {
  // Authoritative page gate: missing permission → forbidden() → 403.
  await igrpAssertAuthorize("manage_access");

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold text-foreground">Exemplo de permissões</h1>
      <p className="text-muted-foreground">
        Esta página exige a permissão <code>manage_access</code>.
      </p>
      <ExemploActions />
    </div>
  );
}
```

- [ ] **Step 2: Create the component gate**

Create `templates/demo-legacy/src/app/(igrp)/(myapp)/exemplo-permissao/_components/actions.tsx`:

```tsx
"use client";

import { IGRPAuthorization } from "@igrp/framework-next-ui";
import { IGRPButton } from "@igrp/igrp-framework-react-design-system";

export function ExemploActions() {
  return (
    <div className="flex gap-2">
      <IGRPButton>Ver</IGRPButton>
      <IGRPAuthorization
        permission="delete_invoice"
        fallback={<IGRPButton disabled>Eliminar</IGRPButton>}
      >
        <IGRPButton variant="destructive">Eliminar</IGRPButton>
      </IGRPAuthorization>
    </div>
  );
}
```

- [ ] **Step 3: Write the usage + guard-checklist doc**

Create `templates/demo-legacy/docs/PERMISSIONS.md`:

```markdown
# Permissions (token-claims gating)

Gating reads the IGRP access-token claims — zero network. The AM API is the
real enforcement on every data call; these gates shape what the user sees.

## Page gate (authoritative, server)
```tsx
import { igrpAssertAuthorize } from "@igrp/framework-next";
export default async function Page() {
  await igrpAssertAuthorize("manage_access"); // missing → 403 (forbidden.tsx)
  return <Screen />;
}
```

## Component gate (client)
```tsx
import { IGRPAuthorization } from "@igrp/framework-next-ui";
<IGRPAuthorization permission="delete_invoice"><DeleteButton /></IGRPAuthorization>
// or, inside your own component:
const { can } = usePermissions();
<IGRPButton disabled={!can("read_invoice")}>Ver</IGRPButton>
```

## Per-page guard checklist (there is NO default-deny)
- [ ] Does this page need a permission? If yes, call `await igrpAssertAuthorize("<perm>")` at the top.
- [ ] Forgetting it leaves the page **open** — the menu hiding it is not enforcement.
- [ ] Permission name: pass the **bare suffix** (`"manage_access"`) — it's auto-qualified with the active department; pass a `dept.suffix` string for a cross-department check.

## Preview mode
`IGRP_PREVIEW_MODE=true` / `AUTH_PROVIDER=none` → claims = **super-admin**, so every gate passes. To see a *denied* state or the 403, run with preview **off** against a real backend (or a non-super-admin user).
```

- [ ] **Step 4: Build the template**

Run: `pnpm build:demo`
Expected: completes with no errors.

- [ ] **Step 5: Runtime verification (preview mode = super-admin happy path)**

Start the dev server and verify the example renders and gates run without errors. Using the preview tooling:
1. `preview_start` (or `pnpm dev:demo`).
2. Navigate to `/exemplo-permissao` (respect `NEXT_PUBLIC_BASE_PATH` if set).
3. `preview_console_logs` / `preview_logs` — expect no errors.
4. `preview_snapshot` — expect the heading "Exemplo de permissões" and **both** buttons "Ver" and "Eliminar" visible (preview = super-admin → `delete_invoice` allowed).
5. `preview_screenshot` — capture as proof.

Expected: page renders in-chrome; no console/server errors; both buttons present.

> **Denial / 403 cannot be exercised under preview** (super-admin passes everything). To verify denial: run with `IGRP_PREVIEW_MODE` off against a backend where the user lacks `manage_access` → the page should render the `IGRPForbidden` 403 in-chrome; and `delete_invoice` denied → the disabled fallback button shows. This is documented in `docs/PERMISSIONS.md` and spec §8.

- [ ] **Step 6: Commit**

```bash
git add "templates/demo-legacy/src/app/(igrp)/(myapp)/exemplo-permissao" templates/demo-legacy/docs/PERMISSIONS.md
git commit -m "docs(demo-legacy): add worked permission-gating example + usage doc"
```

---

## Task 8: Changesets + full-framework verification

**Files:**
- Create: `.changeset/igrp-permission-gating.md`

- [ ] **Step 1: Create the changeset (patch only — pre-release beta)**

Create `.changeset/igrp-permission-gating.md`:

```markdown
---
"@igrp/framework-next-auth": patch
"@igrp/framework-next-types": patch
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
---

Add token-claims permission gating: `decodeIgrpClaims`/`claimsAllow` (`@igrp/framework-next-auth/claims`), server helpers `igrpGetClaims`/`igrpAuthorize`/`igrpAssertAuthorize` (`@igrp/framework-next`), and client `IGRPSectionPermissions`/`usePermissions`/`IGRPAuthorization`/`IGRPGuardPage`/`IGRPForbidden` (`@igrp/framework-next-ui`).
```

> The template (`@igrp/framework-next-template`) is versioned via its own zip release flow, not changesets — do not add it here.

- [ ] **Step 2: Full ordered build + targeted tests**

Run:
```
pnpm build:framework
pnpm --filter @igrp/framework-next-auth exec vitest run claims
pnpm --filter @igrp/framework-next exec vitest run permissions
```
Expected: build completes in order; both test files PASS.

- [ ] **Step 3: Commit**

```bash
git add .changeset/igrp-permission-gating.md
git commit -m "chore: changeset for permission gating (patch)"
```

---

## Self-Review (completed)

- **Spec coverage:** decode/match (Task 1) ↔ spec §3.1/§3.2/D2/D4; types in next-auth re-exported (Task 2) ↔ Global Constraints + D13-adjacent; server `igrpGetClaims`/`igrpAuthorize`/`igrpAssertAuthorize` + bypass + error-vs-deny (Task 3) ↔ §4/D5/D7/D8/R-err/R2-H; provider+hook (Task 4) ↔ §4/§4.1/R-prov; components (Task 5) ↔ §4/§4.1/D6; template seed+403+authInterrupts (Task 6) ↔ §4.2/V5/R2-G; worked example+docs+verification (Task 7) ↔ §10 Phase 1 step 6/L3/§8 preview parity; changesets (Task 8) ↔ hard rules. **Out of scope (documented):** PDP `igrpCheckAccess`/`igrpAssertAccess`, active-role switch + jwt-callback change, D13 reconciliation, `keepMounted`/`<Activity>` — all spec §10 Phase 2.
- **Placeholders:** none — every code/test/command step is concrete.
- **Type consistency:** `IGRPAccessClaims`/`IGRPClaimsState` defined once in `next-auth/claims`, consumed unchanged by next/next-ui/template; `claimsAllow` signature identical across tasks; `igrpGetClaims(): Promise<IGRPClaimsState>` consistent between Task 3 and Task 6 usage.
- **Known acceptances carried from spec:** menus need no code (V1); preview hides denial (verified happy-path only, denial documented); no default-deny (checklist in `PERMISSIONS.md`, L3).
