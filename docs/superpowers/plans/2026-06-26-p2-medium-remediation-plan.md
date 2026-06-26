# P2 (Medium) Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisite:** Implement and merge the P1 plan first. Tasks 1–2 below edit the same three `next` hooks that P1 Task 3 touched, building on that version.

**Goal:** Fix the eight medium-severity findings from the 2026-06-26 deep review: per-user cache leak + token-in-key, error-swallowing data hooks, the migrator patch-mode crash, the frozen DataTable filter, the dead Combobox uncontrolled mode, the `window.location.origin` hrefs, the menu-id type drift, and the `isAuthBypass()` session-refetch gate.

**Architecture:** Each fix is surgical and scoped to one package, except item 10 (a `next-types` contract change that cascades to `next` + `next-ui`) and item 11 (a `demo-v1` template fix that ships as a `template-migrator` migration). Verification mode is per-package (see table) — real test-first TDD where a runner exists, build+grep where it does not, migrator-applied tests for template fixes.

**Tech Stack:** TypeScript 5.9, Vitest (next/migrator = node, design-system = jsdom+RTL), React 19, SWC+Babel, Biome (demo-v1), Node ≥ 22, pnpm, changesets (`patch` only).

## Global Constraints

- pnpm only; `engines.node >= 22`; `workspace:*` internal deps.
- Never edit `dist/`; use subpath exports. One `patch` changeset per publishable package change. Never `major`/`minor`.
- Build order `next-auth → next-types → design-system → next-ui → next`. Item 10's type change requires `pnpm build:framework` to validate the cascade.
- No publish. Stage code + changesets only.
- `templates/demo-v1` uses **Biome** (`pnpm --filter @igrp/framework-next-template format`), not ESLint/Prettier. Every demo-v1 change ships as a migration (drift gate enforces template↔migration parity).
- Vitest `globals` is off everywhere — import `describe/it/expect/vi` explicitly.

## Per-package verification reality

| Package | How a change is verified |
| --- | --- |
| `framework-next` | Vitest node, `src/**/__tests__/**/*.test.ts`. Hooks need mocks for `next/cache`, `next/navigation`, `next/headers`, `react` (`cache`), and the AM SDK (throwable `ApiClientError`). Build: `pnpm build:next`. |
| `template-migrator` | Vitest node, real temp-dir fs. Build: `pnpm --filter @igrp/template-migrator build`; drift: `pnpm --filter @igrp/template-migrator check:drift`. |
| `design-system` | Vitest **jsdom + React Testing Library** (`src/**/*.test.{ts,tsx}`, setup polyfills Radix APIs). Real component TDD. Build: `pnpm build:ds`. |
| `framework-next-ui` | **No test runner, no Storybook.** Verify by grep-assertion on `src/` + `pnpm build:next-ui` (typecheck/compile) + manual `pnpm dev:demo`. Do **not** add a test harness (out of scope). |
| `framework-next-types` | Types only. Verify by `pnpm build:next-types` then `pnpm build:framework` (the cascade compiles consumers against the new types). |
| `templates/demo-v1` | Fix ships as a migrator migration; verify via the migrator's vitest (apply migration to a temp app, assert content) + `check:drift` + `pnpm build:demo`. |

## File map

| File | Action | Item |
| --- | --- | --- |
| `packages/framework/next/src/hooks/use-menus.ts` | Rewrite caching + catch | 4, 5 |
| `packages/framework/next/src/hooks/use-applications.ts` | Rewrite caching + catch | 4, 5 |
| `packages/framework/next/src/hooks/use-user.ts` | Catch only | 5 |
| `packages/framework/next/src/hooks/__tests__/cache-and-errors.test.ts` | Create | 4, 5 |
| `packages/template-migrator/src/apply.ts` | Guard patch mode | 6 |
| `packages/template-migrator/src/__tests__/apply.test.ts` | Add patch-mode test | 6 |
| `packages/design-system/src/components/horizon/data-table/hooks/use-filter-state.ts` | Fix memo | 7 |
| `packages/design-system/src/components/horizon/data-table/__tests__/use-filter-state.test.tsx` | Create | 7 |
| `packages/design-system/src/components/horizon/input/combobox.tsx` | Default `value` undefined | 8 |
| `packages/design-system/src/components/horizon/input/__tests__/combobox.test.tsx` | Create | 8 |
| `packages/framework/next-ui/src/components/templates/nav-user.tsx` | Relative hrefs | 9 |
| `packages/framework/next-ui/src/components/templates/notifications.tsx` | Relative hrefs | 9 |
| `packages/framework/next-types/src/types/access-management.ts` | `id?: number` | 10 |
| `packages/framework/next/src/mappers/menus-mapper.ts` | Drop `as number`, guard | 10 |
| `packages/framework/next-ui/src/components/templates/menus/section-group.tsx` | Null-safe keys | 10 |
| `packages/framework/next-ui/src/components/templates/menus/folder-menu-item.tsx` | Null-safe keys | 10 |
| `templates/demo-v1/src/lib/config/get-session-args.ts` | `isAuthBypass()` | 11 |
| `packages/template-migrator/migrations/demo-v1/21.MIGRATIONS-26062026.md` + `payload/21/...` | Create | 11 |
| `.changeset/p2-*.md` | Create (one per publishable package) | all |

---

## Task 1: Fix per-user cache leak + token-in-key (next, item 4)

**Files:**
- Rewrite: `packages/framework/next/src/hooks/use-menus.ts`
- Rewrite: `packages/framework/next/src/hooks/use-applications.ts`
- Test: `packages/framework/next/src/hooks/__tests__/cache-and-errors.test.ts` (new)

**Interfaces:**
- Produces: `fetchMenus(appCode)`, `fetchAppsByUser()`, `fetchAppByCode(appCode)` — same signatures; now request-scoped via React `cache()`, token read inside from `igrpGetAccessClientConfig()`.

> **Why mirror `use-user.ts` rather than keep `unstable_cache`:** `getCurrentUserApplicationMenus`/`getCurrentUserApplications` return **per-user** data. Caching cross-request by `appCode` alone would serve one user's menus to another within the revalidate window. `use-user.ts` already resolved this (its lines 9-17 comment): request-scoped React `cache()`, token read inside. The token-in-key bug and the cross-user-leak risk are both removed by the same change. **Consequence:** the `igrp-menus-${appCode}` / `igrp-app-${appCode}` revalidation tags disappear, so any `revalidateTag` call in `revalidateMenusAction` becomes a no-op (harmless — request-scoped cache needs no cross-request invalidation). Flag that action for follow-up cleanup; do not expand this task to remove it.

- [ ] **Step 1: Write the failing test (token read fresh inside, not keyed)**

Create `packages/framework/next/src/hooks/__tests__/cache-and-errors.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

class ApiClientError extends Error {
  status: number;
  constructor(status: number) { super(`status ${status}`); this.status = status; }
}
const getCurrentUserApplicationMenus = vi.fn().mockResolvedValue({ data: [] });
const create = vi.fn(() => ({ users: { getCurrentUserApplicationMenus } }));
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  ApiClientError,
  AccessManagementClient: { create },
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn((u: string) => { throw new Error(`NEXT_REDIRECT:${u}`); }) }));
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }) }));
// React cache() is request-scoped; in tests with no render scope it is a pass-through.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: <T,>(fn: T) => fn };
});
vi.mock('@igrp/framework-next-auth/sanitize', () => ({ sanitizeRedirectUrl: () => '' }));

const { fetchMenus } = await import('../use-menus');
const { igrpSetAccessClientConfig, igrpResetAccessClientConfig } = await import('../../lib/api-config');

describe('fetchMenus reads the token fresh from config (no token in cache key)', () => {
  beforeEach(() => { igrpResetAccessClientConfig(); create.mockClear(); });

  it('uses the current token, and a rotated token on the next call', async () => {
    igrpSetAccessClientConfig({ token: 'T1', baseUrl: 'http://am' });
    await fetchMenus('app');
    expect(create).toHaveBeenLastCalledWith(
      expect.objectContaining({ headers: { Authorization: 'Bearer T1' } }),
    );

    igrpSetAccessClientConfig({ token: 'T2', baseUrl: 'http://am' });
    await fetchMenus('app');
    expect(create).toHaveBeenLastCalledWith(
      expect.objectContaining({ headers: { Authorization: 'Bearer T2' } }),
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/hooks/__tests__/cache-and-errors.test.ts -t "reads the token fresh"`
Expected: FAIL — `next/cache` is unmocked (current `use-menus.ts` imports `unstable_cache`), so import/throw. (This proves the current file still depends on `unstable_cache`.)

- [ ] **Step 3: Rewrite `use-menus.ts`**

Replace the ENTIRE file with the React-`cache()` form (mirrors `use-user.ts`; keeps the P1 sanitize import + the P2 Task-2 error policy lands next):
```ts
import { cache } from 'react';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sanitizeRedirectUrl } from '@igrp/framework-next-auth/sanitize';

import { igrpGetAccessClientConfig } from '../lib/api-config';
import { mapperMenus } from '../mappers/menus-mapper';
import { logger } from '../logger';

// Per-request dedup via React cache. The token is read INSIDE the cached fn (not
// passed as an argument), so it is never embedded in a cross-request cache key
// and per-user menus are never shared across requests. See use-user.ts.
const getCachedMenus = cache(async function fetchMenusOnce(appCode: string) {
  const { token, baseUrl } = igrpGetAccessClientConfig();
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUserApplicationMenus(appCode);
  return mapperMenus(result);
});

export async function fetchMenus(appCode: string) {
  try {
    return await getCachedMenus(appCode);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      const h = await headers();
      const callbackUrl = sanitizeRedirectUrl(h.get('x-current-path'), undefined, '');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    logger.error('[igrp-menus] Erro ao carregar os menus da aplicação.', error);
    return [];
  }
}
```

- [ ] **Step 4: Rewrite `use-applications.ts`**

Replace the ENTIRE file, converting both cached functions to React `cache()` with the token read inside:
```ts
import { cache } from 'react';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sanitizeRedirectUrl } from '@igrp/framework-next-auth/sanitize';

import { igrpGetAccessClientConfig } from '../lib/api-config';
import { mapperApplications } from '../mappers/applications-mapper';
import { logger } from '../logger';

const getCachedAppsByUser = cache(async function fetchAppsByUserOnce() {
  const { token, baseUrl } = igrpGetAccessClientConfig();
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUserApplications();
  return mapperApplications(result);
});

const getCachedAppByCode = cache(async function fetchAppByCodeOnce(appCode: string) {
  const { token, baseUrl } = igrpGetAccessClientConfig();
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.applications.getApplications({ code: appCode });
  return mapperApplications(result)[0] ?? null;
});

export async function fetchAppsByUser() {
  try {
    return await getCachedAppsByUser();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      const h = await headers();
      const callbackUrl = sanitizeRedirectUrl(h.get('x-current-path'), undefined, '');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    logger.error('[apps-by-user] Erro ao carregar os dados da aplicação.', error);
    return [];
  }
}

export async function fetchAppByCode(appCode: string) {
  try {
    if (!appCode)
      throw new Error(
        '[app-by-code]: O Modo de Visualização não está ativo. Quando está desativado, é necessário indicar o código da aplicação. Não foi encontrado nenhum código da aplicação.',
      );
    return await getCachedAppByCode(appCode);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      const h = await headers();
      const callbackUrl = sanitizeRedirectUrl(h.get('x-current-path'), undefined, '');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    logger.error('[app-by-code] Não foi possível obter os dados da aplicação.', error);
    return null;
  }
}
```

- [ ] **Step 5: Run the token test to verify it passes**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/hooks/__tests__/cache-and-errors.test.ts -t "reads the token fresh"`
Expected: PASS — `create` called with `Bearer T1` then `Bearer T2`.

- [ ] **Step 6: Commit** (changeset is created in Task 2, which shares the `next` package)
```bash
git add packages/framework/next/src/hooks/use-menus.ts packages/framework/next/src/hooks/use-applications.ts packages/framework/next/src/hooks/__tests__/cache-and-errors.test.ts
git commit -m "$(cat <<'EOF'
fix(next): request-scope menu/app caching, read token inside cached fn

Mirrors use-user.ts: drops unstable_cache (which keyed on the bearer token
and could serve per-user data cross-request) for React cache(). Removes the
token-in-cache-key bug and the cross-user leak.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Error policy — stop swallowing non-auth failures (next, item 5)

**Files:**
- Modify: `use-menus.ts` (catch), `use-applications.ts` (both catches), `use-user.ts` (catch)
- Test: `packages/framework/next/src/hooks/__tests__/cache-and-errors.test.ts` (add cases)

**Interfaces:**
- Produces: on a non-401/403 error (timeout, network, 5xx) the hooks now **throw** instead of returning `[]`/`null`. The action layer (`actions/index.ts`) already catches into `ActionResult`; `SidebarDataProvider` propagates to its error boundary (it already throws `IgrpLayoutDataError` for missing appCode). `redirect()`'s `NEXT_REDIRECT` still propagates (the throw is in the `else` path, after the redirect branch).

- [ ] **Step 1: Add the failing tests**

Append to `cache-and-errors.test.ts`:
```ts
describe('data hooks throw on non-auth failures (no silent empty render)', () => {
  beforeEach(() => { igrpResetAccessClientConfig(); igrpSetAccessClientConfig({ token: 'T', baseUrl: 'http://am' }); });

  it('fetchMenus throws on a 500 instead of returning []', async () => {
    getCurrentUserApplicationMenus.mockRejectedValueOnce(new ApiClientError(500));
    await expect(fetchMenus('app')).rejects.toBeInstanceOf(ApiClientError);
  });

  it('fetchMenus still returns the data on success', async () => {
    getCurrentUserApplicationMenus.mockResolvedValueOnce({ data: [] });
    await expect(fetchMenus('app')).resolves.toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify the 500 case fails**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/hooks/__tests__/cache-and-errors.test.ts -t "throws on a 500"`
Expected: FAIL — currently resolves to `[]`.

- [ ] **Step 3: Implement — replace the swallow with a re-throw**

In `use-menus.ts`, change the catch tail from:
```ts
    logger.error('[igrp-menus] Erro ao carregar os menus da aplicação.', error);
    return [];
```
to:
```ts
    // Non-auth failure (timeout / network / 5xx): surface it so the layout's
    // error boundary engages instead of rendering an empty menu that looks like
    // a zero-permission user. The action layer (actions/index.ts) catches this
    // into ActionResult; SidebarDataProvider propagates to its boundary.
    logger.error('[igrp-menus] Erro ao carregar os menus da aplicação.', error);
    throw error;
```
Apply the identical `return [] → throw error` / `return null → throw error` change in `use-applications.ts` (both catches) and `use-user.ts` (its catch), keeping each hook's existing log line.

- [ ] **Step 4: Run to verify pass + full suite**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/hooks/__tests__/cache-and-errors.test.ts`
Expected: PASS (all cache + error cases).
Run: `pnpm --filter @igrp/framework-next test`
Expected: PASS (existing api-client/api-config/etc. tests unaffected).

- [ ] **Step 5: Build**

Run: `pnpm build:auth && pnpm build:next` (next-auth first so `@igrp/framework-next-auth/sanitize` resolves)
Expected: clean.

- [ ] **Step 6: Create the changeset and commit**

Create `.changeset/p2-next-hooks-cache-and-errors.md`:
```md
---
"@igrp/framework-next": patch
---

Data hooks (`fetchMenus`, `fetchAppsByUser`, `fetchAppByCode`,
`fetchCurrentUser`): switch to request-scoped React `cache()` reading the
token inside (no token-in-cache-key, no cross-user leak), and rethrow
non-401/403 failures so transient/server errors hit the error boundary
instead of rendering an empty layout.
```
```bash
git add packages/framework/next/src/hooks/ .changeset/p2-next-hooks-cache-and-errors.md
git commit -m "$(cat <<'EOF'
fix(next): rethrow non-auth data-hook errors instead of empty render

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Guard patch-mode `file.write` (template-migrator, item 6)

**Files:**
- Modify: `packages/template-migrator/src/apply.ts:22-33`
- Test: `packages/template-migrator/src/__tests__/apply.test.ts` (add a case)

**Interfaces:**
- Consumes: `executeStep(step, appRoot, payloadDir)`. `MigrationStep` `file.write` permits `mode: "replace" | "patch"`, `from?`, `patch?` (`types.ts:9`).

**Current code (verbatim, `apply.ts:22-33`):**
```ts
    case "file.create":
    case "file.write": {
      const dest = join(appRoot, step.path);
      const existed = existsSync(dest);
      // Strip leading "payload/" prefix — dist/payload/ is already the base dir
      const fromRel = step.from!.startsWith("payload/") ? step.from!.slice("payload/".length) : step.from!;
      const src = join(payloadDir, fromRel);
      ensureDir(dest);
      copyFileSync(src, dest);
      // Return undo step
      if (!existed) return { type: "file.delete", path: step.path };
      return { type: "file.write", mode: "replace", path: step.path, from: "__undo__" };
    }
```

**Decision:** patch mode is **not implemented** (no code consumes `step.patch`). Fail fast with a clear error instead of a `TypeError` from `step.from!` being `undefined`.

- [ ] **Step 1: Write the failing test**

Add to `packages/template-migrator/src/__tests__/apply.test.ts` (mirror its existing temp-dir setup; if the file lacks the `appRoot`/`payloadDir` scaffolding, copy the `beforeEach`/`afterEach`/`writeFileAt` block from `apply-command.test.ts:18-35`):
```ts
import { executeStep } from "../apply";

describe("executeStep rejects unimplemented patch mode cleanly", () => {
  it("throws a clear error for file.write mode=patch (no from)", () => {
    expect(() =>
      executeStep(
        { type: "file.write", path: "src/x.ts", mode: "patch", patch: "..." },
        appRoot,
        payloadDir,
      ),
    ).toThrow(/patch mode is not supported/i);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @igrp/template-migrator exec vitest run src/__tests__/apply.test.ts -t "patch mode"`
Expected: FAIL — currently throws `Cannot read properties of undefined (reading 'startsWith')`, not the clear message.

- [ ] **Step 3: Implement the guard**

Replace the `file.write` branch body (insert after `const existed = ...`, before the `fromRel` line):
```ts
    case "file.create":
    case "file.write": {
      const dest = join(appRoot, step.path);
      const existed = existsSync(dest);
      if (step.type === "file.write" && step.mode === "patch") {
        throw new Error(
          `file.write patch mode is not supported (path: ${step.path}). ` +
            `Use mode: "replace" with a full-file payload via "from".`,
        );
      }
      if (!step.from) {
        throw new Error(`file.${step.type === "file.create" ? "create" : "write"} requires "from" (path: ${step.path}).`);
      }
      // Strip leading "payload/" prefix — dist/payload/ is already the base dir
      const fromRel = step.from.startsWith("payload/") ? step.from.slice("payload/".length) : step.from;
      const src = join(payloadDir, fromRel);
      ensureDir(dest);
      copyFileSync(src, dest);
      if (!existed) return { type: "file.delete", path: step.path };
      return { type: "file.write", mode: "replace", path: step.path, from: "__undo__" };
    }
```
(The `step.from!` non-null assertions are replaced with a real guard, removing the compile-time lie.)

- [ ] **Step 4: Run to verify pass + suite + drift**

Run: `pnpm --filter @igrp/template-migrator exec vitest run src/__tests__/apply.test.ts -t "patch mode"` → PASS
Run: `pnpm --filter @igrp/template-migrator test` → PASS
Run: `pnpm --filter @igrp/template-migrator check:drift` → PASS (no migration content changed)

- [ ] **Step 5: Changeset + commit**

Create `.changeset/p2-migrator-patch-mode-guard.md`:
```md
---
"@igrp/template-migrator": patch
---

`executeStep` now throws a clear error for `file.write` `mode: "patch"`
(unimplemented) and for a missing `from`, instead of a cryptic
`Cannot read properties of undefined` TypeError that aborted the whole apply.
```
```bash
git add packages/template-migrator/src/apply.ts packages/template-migrator/src/__tests__/apply.test.ts .changeset/p2-migrator-patch-mode-guard.md
git commit -m "$(cat <<'EOF'
fix(template-migrator): guard unimplemented file.write patch mode

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Unfreeze DataTable `isFiltered` (design-system, item 7)

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/hooks/use-filter-state.ts:10`
- Test: `packages/design-system/src/components/horizon/data-table/__tests__/use-filter-state.test.tsx` (new)

**Interfaces:**
- Produces: `useFilterState(table, onFiltersCleared)` → `{ isFiltered, handleClear }`; `isFiltered` now reflects the live `columnFilters` length each render.

**Current code (verbatim, `use-filter-state.ts:10`):**
```ts
  const isFiltered = useMemo(() => table.getState().columnFilters.length > 0, [table])
```
`table` is a stable TanStack reference, so the memo never recomputes.

- [ ] **Step 1: Write the failing test**

Create `packages/design-system/src/components/horizon/data-table/__tests__/use-filter-state.test.tsx` (uses `renderHook` from RTL; drives a real `useReactTable` instance so the stale-memo bug is reproduced):
```tsx
import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useReactTable, getCoreRowModel, getFilteredRowModel, type ColumnDef } from "@tanstack/react-table"
import { useFilterState } from "../hooks/use-filter-state"

type Row = { id: number; name: string }
const columns: ColumnDef<Row>[] = [{ accessorKey: "name", id: "name" }]
const data: Row[] = [{ id: 1, name: "alpha" }, { id: 2, name: "beta" }]

function useHarness() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  return { table, ...useFilterState(table) }
}

describe("useFilterState.isFiltered", () => {
  it("becomes true after a column filter is applied", () => {
    const { result } = renderHook(() => useHarness())
    expect(result.current.isFiltered).toBe(false)
    act(() => result.current.table.getColumn("name")!.setFilterValue("al"))
    expect(result.current.isFiltered).toBe(true) // FAILS while memo deps are [table]
  })

  it("returns to false after handleClear", () => {
    const { result } = renderHook(() => useHarness())
    act(() => result.current.table.getColumn("name")!.setFilterValue("al"))
    act(() => result.current.handleClear())
    expect(result.current.isFiltered).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/components/horizon/data-table/__tests__/use-filter-state.test.tsx -t "becomes true"`
Expected: FAIL — `isFiltered` stays `false` after the filter (cached on `[table]`).

- [ ] **Step 3: Implement**

Replace `use-filter-state.ts:10` with a direct derivation (no memo) and drop the now-unused `useMemo` import:
```ts
  const isFiltered = table.getState().columnFilters.length > 0
```
Update the import on line 3 from `import { useCallback, useMemo } from "react"` to `import { useCallback } from "react"`.

- [ ] **Step 4: Run to verify pass + build**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/components/horizon/data-table/__tests__/use-filter-state.test.tsx` → PASS
Run: `pnpm build:ds` → clean

- [ ] **Step 5: Changeset + commit**

Create `.changeset/p2-ds-datatable-isfiltered.md`:
```md
---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTable` client filter: derive `isFiltered` from the live column-filter
state each render instead of memoizing on the stable `table` reference, so the
Clear-filters button appears after a filter is applied.
```
```bash
git add packages/design-system/src/components/horizon/data-table/hooks/use-filter-state.ts packages/design-system/src/components/horizon/data-table/__tests__/use-filter-state.test.tsx .changeset/p2-ds-datatable-isfiltered.md
git commit -m "$(cat <<'EOF'
fix(design-system): derive DataTable isFiltered from live filter state

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Fix `IGRPCombobox` uncontrolled mode (design-system, item 8)

**Files:**
- Modify: `packages/design-system/src/components/horizon/input/combobox.tsx:225`
- Test: `packages/design-system/src/components/horizon/input/__tests__/combobox.test.tsx` (new)

**Interfaces:**
- Produces: `<IGRPCombobox>` used standalone (no `value`, no form context) now persists its selection via `localValue`.

**Current code (verbatim):** `combobox.tsx:225` is `  value = "",` (a default that makes `value` never `undefined`, so the `displayValue = value !== undefined ? value : localValue` ternary at `:253` always ignores `localValue`, and `if (value === undefined) setLocalValue(newValue)` at `:425` is dead).

- [ ] **Step 1: Write the failing test**

Create `packages/design-system/src/components/horizon/input/__tests__/combobox.test.tsx`:
```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IGRPCombobox } from "../combobox"

const options = [
  { label: "Alpha", value: "a" },
  { label: "Beta", value: "b" },
]

describe("IGRPCombobox uncontrolled mode", () => {
  it("persists the selected option label when used without a value prop", async () => {
    render(<IGRPCombobox name="x" options={options} placeholder="Pick one" />)
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByText("Alpha"))
    expect(screen.getByRole("combobox")).toHaveTextContent("Alpha") // FAILS: stays "Pick one"
  })
})
```
(If the trigger is not exposed as `role="combobox"`, mirror the query used in the existing `src/components/horizon/__tests__/input-*.test.tsx` files — open via the trigger button, then assert the trigger's text content.)

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/components/horizon/input/__tests__/combobox.test.tsx`
Expected: FAIL — trigger keeps showing the placeholder; `localValue` is dead because `value` defaults to `""`.

- [ ] **Step 3: Implement**

Change `combobox.tsx:225` from `  value = "",` to:
```tsx
  value,
```
(Removing the default lets `value` be `undefined` when the caller omits it, so `displayValue` falls through to `localValue` and the `value === undefined` write at `:425` becomes live. The form-context and explicitly-controlled paths are unaffected — they pass `value`/use `field.value`.)

- [ ] **Step 4: Run to verify pass + build**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/components/horizon/input/__tests__/combobox.test.tsx` → PASS
Run: `pnpm build:ds` → clean

- [ ] **Step 5: Changeset + commit**

Create `.changeset/p2-ds-combobox-uncontrolled.md`:
```md
---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPCombobox`: default `value` to `undefined` instead of `""` so standalone
uncontrolled usage persists the selection (previously the `localValue` path was
dead and the selection never displayed).
```
```bash
git add packages/design-system/src/components/horizon/input/combobox.tsx packages/design-system/src/components/horizon/input/__tests__/combobox.test.tsx .changeset/p2-ds-combobox-uncontrolled.md
git commit -m "$(cat <<'EOF'
fix(design-system): IGRPCombobox uncontrolled selection persists

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Relative hrefs in nav-user + notifications (next-ui, item 9)

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/nav-user.tsx:51-64`
- Modify: `packages/framework/next-ui/src/components/templates/notifications.tsx:34-37`

**Verification:** next-ui has **no test runner**. TDD-by-grep: the "failing test" is a grep proving the bug present; the "passing test" is the grep after the fix + a clean `pnpm build:next-ui`. Manual confirmation via `pnpm dev:demo`.

**Why relative paths:** `next/link` auto-prepends `NEXT_PUBLIC_BASE_PATH` to a **relative** href and matches SSR↔CSR; an absolute `https://host/...` (from `window.location.origin`) is treated as external (full reload), omits the basePath (404 under subpath), and mismatches SSR (`''`). Drop `getLocationOriginURL()`; use plain relative paths.

- [ ] **Step 1: Confirm the bug (failing grep)**

Run: `rg -n "getLocationOriginURL" packages/framework/next-ui/src/components/templates/`
Expected: matches in `nav-user.tsx` (lines 53, 58, 63) and `notifications.tsx` (line 35) — the bug is present.

- [ ] **Step 2: Implement — `nav-user.tsx`**

Replace the three builders (`nav-user.tsx:51-64`):
```tsx
  const handleUserUrl = () => {
    if (userProfileUrl) return userProfileUrl;
    return '/profile';
  };

  const handleNotificationsUrl = () => {
    if (notificationsUrl) return notificationsUrl;
    return '/notifications';
  };

  const handleSettingsUrl = () => {
    if (settingsUrl) return settingsUrl;
    return '/setting';
  };
```
Remove the now-unused import at `nav-user.tsx:21` (`import { getLocationOriginURL } from '../../lib/utils';`). (Preserve the `/setting` singular literal — it is the existing route.)

- [ ] **Step 3: Implement — `notifications.tsx`**

Replace `notifications.tsx:34-37`:
```tsx
  const handleUrl = () => {
    return notificationsUrl ? notificationsUrl : '/notifications';
  };
```
Remove the unused import at `notifications.tsx:18`.

- [ ] **Step 4: Verify (passing grep + build)**

Run: `rg -n "getLocationOriginURL" packages/framework/next-ui/src/components/templates/` → **no matches**
Run: `rg -n "window.location.origin" packages/framework/next-ui/src/` → no matches in these two files
Run: `pnpm build:next-ui` → clean (typecheck confirms the removed import has no other users in these files; `getLocationOriginURL` remains exported from `lib/utils.ts` for any other consumer)

- [ ] **Step 5: Manual confirmation (optional but recommended)**

`pnpm build:framework && pnpm dev:demo`, open the nav-user menu, click Profile/Notifications → client-side navigation (no full reload), correct path under any `NEXT_PUBLIC_BASE_PATH`.

- [ ] **Step 6: Changeset + commit**

Create `.changeset/p2-next-ui-relative-hrefs.md`:
```md
---
"@igrp/framework-next-ui": patch
---

`IGRPTemplateNavUser` and `IGRPTemplateNotifications`: emit basePath-relative
`next/link` hrefs (`/profile`, `/notifications`, `/setting`) instead of
`window.location.origin`-based absolute URLs. Fixes the SSR/CSR hydration
mismatch, the full-page reload, and the 404 under a `NEXT_PUBLIC_BASE_PATH`
deployment.
```
```bash
git add packages/framework/next-ui/src/components/templates/nav-user.tsx packages/framework/next-ui/src/components/templates/notifications.tsx .changeset/p2-next-ui-relative-hrefs.md
git commit -m "$(cat <<'EOF'
fix(next-ui): use basePath-relative hrefs in nav-user/notifications

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Align `IGRPMenuItemArgs.id` with the AM DTO (next-types → next → next-ui, item 10)

**Files:**
- Modify: `packages/framework/next-types/src/types/access-management.ts:38`
- Modify: `packages/framework/next/src/mappers/menus-mapper.ts:10`
- Modify: `packages/framework/next-ui/src/components/templates/menus/section-group.tsx:29,31`
- Modify: `packages/framework/next-ui/src/components/templates/menus/folder-menu-item.tsx:51,89`

**Interfaces:**
- Produces: `IGRPMenuItemArgs.id?: number` (optional, matching `MenuEntryDTO.id?: number`). The `as number` cast is removed; `next-ui` key sites become null-safe.

**Verification:** types-only + cascade compile (`pnpm build:framework`). The "test" is the compiler: after making `id` optional and removing the cast, any remaining unguarded `node.item.id` usage that assumes `number` is still fine for template-literal keys (it stringifies `undefined` → `"undefined"`), so the *fix* is the null-safe key, validated by build + a grep assertion.

- [ ] **Step 1: Make `id` optional (next-types)**

In `access-management.ts:38`, change `  id: number;` to:
```ts
  id?: number;
```

- [ ] **Step 2: Remove the unsafe cast (next)**

In `menus-mapper.ts:10`, change `  id: menu.id as number,` to:
```ts
  id: menu.id,
```

- [ ] **Step 3: Build next-types + next to surface fallout**

Run: `pnpm build:next-types && pnpm build:next`
Expected: clean. (`mapMenu` now assigns `menu.id` (`number | undefined`) to `id?: number` — type-compatible. If any other `next` site assumed non-optional `id`, the compiler flags it here; fix by guarding.)

- [ ] **Step 4: Make the next-ui key sites null-safe**

In `section-group.tsx`, change the keys at lines 29/31 to fall back when `id` is absent:
```tsx
            <FolderMenuItem key={`folder-${node.item.id ?? node.item.code}`} node={node} pathname={pathname} />
          ) : (
            <LeafMenuItem key={`leaf-${node.item.id ?? node.item.code}`} node={node} pathname={pathname} />
```
In `folder-menu-item.tsx`, change lines 51/89 similarly:
```tsx
                key={`dd-${child.item.id ?? child.item.code}`}
```
```tsx
                  key={`col-${child.item.id ?? child.item.code}`}
```
(`code` is a required `string` on `IGRPMenuItemArgs`, so it is a stable non-null fallback. `search-results.tsx:121` already guards with `id != null` — leave it.)

- [ ] **Step 5: Build the full cascade**

Run: `pnpm build:framework`
Expected: clean through `next-auth → next-types → ds → next-ui → next`.
Run: `rg -n "as number" packages/framework/next/src/mappers/menus-mapper.ts` → no matches.

- [ ] **Step 6: Changesets + commit** (three packages)

Create three changesets:
`.changeset/p2-next-types-menu-id-optional.md`:
```md
---
"@igrp/framework-next-types": patch
---

`IGRPMenuItemArgs.id` is now optional (`id?: number`) to match the runtime
`MenuEntryDTO.id?: number`, removing a type that promised an always-present id.
```
`.changeset/p2-next-menu-mapper-cast.md`:
```md
---
"@igrp/framework-next": patch
---

`mapperMenus` no longer casts `menu.id as number` — propagates the real
optionality now that `IGRPMenuItemArgs.id` is optional.
```
`.changeset/p2-next-ui-menu-keys.md`:
```md
---
"@igrp/framework-next-ui": patch
---

Menu tree React keys fall back to `code` when a menu entry has no `id`,
avoiding `folder-undefined`/`leaf-undefined` key collisions.
```
```bash
git add packages/framework/next-types/src/types/access-management.ts packages/framework/next/src/mappers/menus-mapper.ts packages/framework/next-ui/src/components/templates/menus/ .changeset/p2-next-types-menu-id-optional.md .changeset/p2-next-menu-mapper-cast.md .changeset/p2-next-ui-menu-keys.md
git commit -m "$(cat <<'EOF'
fix(next-types): IGRPMenuItemArgs.id optional; drop cast; null-safe keys

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `get-session-args` uses `isAuthBypass()` (demo-v1 via migration, item 11)

**Files:**
- Modify (template source): `templates/demo-v1/src/lib/config/get-session-args.ts:1,19`
- Create (migration): `packages/template-migrator/migrations/demo-v1/21.MIGRATIONS-26062026.md`
- Create (payload): `packages/template-migrator/migrations/demo-v1/payload/21/lib/config/get-session-args.ts`

**Interfaces:**
- Produces: under `AUTH_PROVIDER=none` (no `IGRP_PREVIEW_MODE`), `getSessionArgs()` returns `{ refetchInterval: 0, refetchOnWindowFocus: false }`.

**Current code (verbatim, `get-session-args.ts:1` and `:19`):** `import { isPreviewMode } from "../utils";` and `  if (isPreviewMode()) {`.

- [ ] **Step 1: Fix the template source**

In `templates/demo-v1/src/lib/config/get-session-args.ts`:
- Line 1: change `import { isPreviewMode } from "../utils";` → `import { isAuthBypass } from "../utils";`
- Line 19: change `  if (isPreviewMode()) {` → `  if (isAuthBypass()) {`

- [ ] **Step 2: Format the template**

Run: `pnpm --filter @igrp/framework-next-template format`
Expected: Biome leaves the file clean (no diff beyond the edit).

- [ ] **Step 3: Author the migration payload**

Copy the corrected file to the payload path (the payload is the full corrected file — `mode: replace`):
Create `packages/template-migrator/migrations/demo-v1/payload/21/lib/config/get-session-args.ts` with the **exact** post-fix content of `templates/demo-v1/src/lib/config/get-session-args.ts` (the drift gate compares them byte-for-byte after pack).

- [ ] **Step 4: Author the migration descriptor**

Create `packages/template-migrator/migrations/demo-v1/21.MIGRATIONS-26062026.md`:
```md
---
id: 21-session-args-auth-bypass
date: 2026-06-26
targetFrameworkVersion: null
requires: ["20-sidebar-trigger-in-header"]
steps:
  - type: file.write
    path: src/lib/config/get-session-args.ts
    mode: replace
    from: payload/21/lib/config/get-session-args.ts
---

# Migration Guide — Session refetch honors AUTH_PROVIDER=none (`21-session-args-auth-bypass`)

## What changed

`getSessionArgs()` gated the disable-refetch branch on `isPreviewMode()` alone.
Under `AUTH_PROVIDER=none` (auth bypassed but `IGRP_PREVIEW_MODE` unset), the
`SessionProvider` kept polling `/api/auth/session` even though middleware
redirects `/api/auth/*` to `/`. It now gates on `isAuthBypass()`, matching the
documented bypass contract and the sibling `igrp.template.config.ts`.

```diff
- import { isPreviewMode } from "../utils";
+ import { isAuthBypass } from "../utils";
...
-  if (isPreviewMode()) {
+  if (isAuthBypass()) {
```

| File | Change |
|---|---|
| `src/lib/config/get-session-args.ts` | `isPreviewMode()` → `isAuthBypass()` for the disable-refetch branch |

## Notes

- Run `igrp-migrate plan` first to preview, then `igrp-migrate apply`.
```

- [ ] **Step 5: Verify drift + a migrator apply test**

Run: `pnpm --filter @igrp/template-migrator check:drift`
Expected: PASS — the template now matches the cumulative migration final-state. (If it fails, the payload and `templates/demo-v1/.../get-session-args.ts` differ — reconcile them byte-for-byte.)

Add a focused apply test to `packages/template-migrator/src/__tests__/apply-command.test.ts` proving the migration rewrites the file (uses the existing temp-dir harness):
```ts
describe("migration 21 swaps isPreviewMode for isAuthBypass", () => {
  it("applies the get-session-args payload over the old file", async () => {
    writeFileAt(appRoot, "src/lib/config/get-session-args.ts", 'import { isPreviewMode } from "../utils";\n');
    writeFileAt(payloadDir, "21/lib/config/get-session-args.ts", 'import { isAuthBypass } from "../utils";\n');
    manifestRef.current = {
      version: 1, cliVersion: "test", template: "demo-v1",
      migrations: [{
        id: "21-session-args-auth-bypass", date: "2026-06-26", requires: [],
        targetFrameworkVersion: null, guideHref: "21.MIGRATIONS-26062026.md", contentHash: "21212121212121212",
        steps: [{ type: "file.write", mode: "replace", path: "src/lib/config/get-session-args.ts", from: "21/lib/config/get-session-args.ts" }],
      }],
    };
    await apply(appRoot, { yes: true, payloadDir });
    expect(readFileSync(join(appRoot, "src/lib/config/get-session-args.ts"), "utf8")).toContain("isAuthBypass");
  });
});
```
Run: `pnpm --filter @igrp/template-migrator exec vitest run src/__tests__/apply-command.test.ts -t "migration 21"` → PASS

- [ ] **Step 6: Build the template + changeset + commit**

Run: `pnpm build:demo`
Expected: Biome format + `next build` clean.

Create `.changeset/p2-migrator-migration-21.md`:
```md
---
"@igrp/template-migrator": patch
---

Add migration `21-session-args-auth-bypass`: rewrites the demo-v1
`get-session-args.ts` to gate session-refetch on `isAuthBypass()` instead of
`isPreviewMode()`, so `AUTH_PROVIDER=none` disables refetch per the bypass
contract.
```
```bash
git add templates/demo-v1/src/lib/config/get-session-args.ts packages/template-migrator/migrations/demo-v1/21.MIGRATIONS-26062026.md packages/template-migrator/migrations/demo-v1/payload/21/ packages/template-migrator/src/__tests__/apply-command.test.ts .changeset/p2-migrator-migration-21.md
git commit -m "$(cat <<'EOF'
fix(demo-v1): session refetch honors isAuthBypass (migration 21)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Final verification (run before handing off P2)

- [ ] `pnpm --filter @igrp/framework-next test` — green (cache + error tests)
- [ ] `pnpm --filter @igrp/template-migrator test && pnpm --filter @igrp/template-migrator check:drift` — green
- [ ] `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/components/horizon/data-table src/components/horizon/input` — green
- [ ] `pnpm build:framework` — clean through the full dependency order
- [ ] `pnpm build:demo` — clean
- [ ] Changesets present for `next`, `template-migrator` (×2: patch-mode + migration 21), `design-system` (×2), `next-ui` (×2: hrefs + menu keys), `next-types`
- [ ] No `dist/` staged; no version bumps; nothing published

## Self-review notes

- **Spec coverage:** Task 1=item 4, Task 2=item 5, Task 3=item 6, Task 4=item 7, Task 5=item 8, Task 6=item 9, Task 7=item 10, Task 8=item 11.
- **Item 4 deviation from spec wording (intentional):** spec said "keep `unstable_cache`, move token inside." Research showed that would leak per-user menus cross-request. Corrected to React `cache()` (request-scoped), matching `use-user.ts`. Side effect: `igrp-menus-*`/`igrp-app-*` revalidation tags + `revalidateMenusAction` become no-ops — flagged for a separate follow-up, not removed here.
- **Tasks 1 & 2 order:** both edit the same hook files; Task 1 rewrites structure (cache), Task 2 edits the catch tail. Implement in order; the Task-1 file blocks already show the post-Task-1 catch so Task 2 is a clean two-line change.
- **next-ui has no unit harness** (Task 6) — verification is grep + build + manual, per repo reality; no test harness added.
- **Migration numbering:** Task 8 creates migration `21`. P3's demo-v1 fixes (items 19, 20) will create migration `22` with `requires: ["21-session-args-auth-bypass"]` — implement P2 before P3.
