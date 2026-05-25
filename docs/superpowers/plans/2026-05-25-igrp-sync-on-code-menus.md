# `IGRP_SYNC_ON_CODE_MENUS` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-introduce `IGRP_SYNC_ON_CODE_MENUS` as a runtime flag that gates whether the framework pushes the template-defined `IGRP_DEFAULT_MENU` array to Access Management at startup, with AM unchanged when the flag is `false`.

**Architecture:** New optional fields `syncOnCodeMenus: boolean` and `onCodeMenus: IGRPMenuItemArgs[]` on `apiManagementConfig`. `IGRPRootLayout` sources sync-menus input from `onCodeMenus` (instead of the AM-loaded `sidebarData.menuItems`). `igrpSyncMenus` gets an inner `syncEnabled` gate that short-circuits the push when `false`. Outer `IGRP_SYNC_ACCESS` + `IGRP_PREVIEW_MODE` gating in `planAccessManagementSync` stays untouched.

**Tech Stack:** TypeScript, Next.js 15, vitest, `@igrp/platform-access-management-client-ts`, pnpm workspaces.

---

## Spec reference

This plan implements `docs/superpowers/specs/2026-05-25-igrp-sync-on-code-menus-design.md`.

## File map

**Modify:**
- `packages/framework/next-types/src/types/igrp.ts` — add the two optional fields to `apiManagementConfig`.
- `packages/framework/next/src/lib/sync-plan.ts` — propagate `syncOnCodeMenus` through `IGRPPlanAccessManagementSyncArgs` and `IGRPAccessManagementSyncPlan`.
- `packages/framework/next/src/lib/sync-menus.ts` — add `syncEnabled` arg + early-return gate.
- `packages/framework/next/src/lib/startup-sync.ts` — forward `syncOnCodeMenus` from `plan` into `igrpSyncMenus`.
- `packages/framework/next/src/layouts/igrp-root-layout.tsx` — source `menus` from `apiManagementConfig.onCodeMenus` instead of `sidebarData.menuItems`; pass `syncOnCodeMenus`.
- `templates/demo-legacy/src/igrp.template.config.ts` — import `IGRP_DEFAULT_MENU` and pass `syncOnCodeMenus` + `onCodeMenus` into `apiManagementConfig`.
- `templates/demo-legacy/.env.example` — add `IGRP_SYNC_ON_CODE_MENUS=false` with doc comment.

**Create:**
- `packages/framework/next/src/lib/__tests__/sync-menus.test.ts` — unit tests for the new gate.
- `packages/template-migrator/migrations/demo-legacy/09.MIGRATIONS-25052026.md` — migration guide.
- `packages/template-migrator/migrations/demo-legacy/payload/09/igrp.template.config.ts` — payload copy.
- `packages/template-migrator/migrations/demo-legacy/payload/09/.env.example` — payload copy.
- `.changeset/sync-on-code-menus.md` — changeset entry.

---

## Task 1: Add `syncOnCodeMenus` + `onCodeMenus` to the public config type

**Files:**
- Modify: `packages/framework/next-types/src/types/igrp.ts`

- [ ] **Step 1: Add `IGRPMenuItemArgs` import if absent**

Open `packages/framework/next-types/src/types/igrp.ts`. Check the existing imports at the top. `IGRPMenuItemArgs` is **not** currently imported in this file. Add it from the local sidebar types module:

```ts
import { IGRPSidebarDataArgs } from './sidebar';
```

is already there. After it, add (or merge with the existing line if it exports `IGRPMenuItemArgs`):

```ts
import type { IGRPMenuItemArgs } from './sidebar';
```

> Verify that `IGRPMenuItemArgs` is exported from `./sidebar`. If it lives under a different module (e.g. `./menu`), use that path. Run:
> ```
> grep -rn "export.*IGRPMenuItemArgs" packages/framework/next-types/src
> ```
> and use whichever module owns the type.

- [ ] **Step 2: Add the two optional fields**

Inside the `apiManagementConfig?: {…}` block (lines 20–63), add the two new optional fields just before the closing `}`. Place them after `paramMapBody?: string;`:

```ts
    /**
     * When `true`, the framework pushes `onCodeMenus` to Access Management at
     * startup via `client.m2m.syncApplicationMenus`. The push is an inner
     * phase of the AM sync pipeline and only runs when the outer gates are
     * also satisfied (`syncAccess === true` and `previewMode === false`).
     *
     * When `false` (the default for templates that omit it), AM remains the
     * source of truth and no menu push occurs.
     *
     * Sourced from `process.env.IGRP_SYNC_ON_CODE_MENUS === "true"` in the
     * template.
     */
    syncOnCodeMenus?: boolean;
    /**
     * The template-defined menu array pushed to Access Management when
     * `syncOnCodeMenus` is true. This is the source of truth at push time —
     * AM is reconciled to match it. Typically points at
     * `src/temp/menus/menus.ts` (`IGRP_DEFAULT_MENU`).
     *
     * Required only when `syncOnCodeMenus` is true. Omitting it is a no-op
     * because the gate short-circuits before reading the array.
     */
    onCodeMenus?: IGRPMenuItemArgs[];
```

- [ ] **Step 3: Build the types package**

Run: `pnpm build:next-types`
Expected: clean `tsc -b` output with no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/framework/next-types/src/types/igrp.ts
git commit -m "feat(next-types): add syncOnCodeMenus + onCodeMenus to apiManagementConfig"
```

---

## Task 2: Thread `syncOnCodeMenus` through the sync plan

**Files:**
- Modify: `packages/framework/next/src/lib/sync-plan.ts:19-36`, `:144-152`

- [ ] **Step 1: Add `syncOnCodeMenus` to both plan types**

In `packages/framework/next/src/lib/sync-plan.ts`, modify the `IGRPAccessManagementSyncPlan` type (lines 19–27) — add `syncOnCodeMenus`:

```ts
export type IGRPAccessManagementSyncPlan = {
  client: AccessManagementClient;
  appCode: string;
  serviceId: string;
  appInformation: IGRPPackageJson;
  menus: IGRPMenuItemArgs[];
  syncOnCodeMenus: boolean;
  appRoutes?: string[];
  paramMapBody?: string;
};
```

`syncOnCodeMenus` is **required** on the plan (not optional). The planner is responsible for resolving the field to a concrete boolean; downstream code must not have to guard against `undefined`.

- [ ] **Step 2: Populate `syncOnCodeMenus` in the returned plan**

In the same file, update the return object at lines 144–152:

```ts
  return {
    client,
    appCode,
    serviceId: rawServiceId,
    appInformation: args.appInformation,
    menus: args.menus,
    syncOnCodeMenus: cfg!.syncOnCodeMenus === true,
    appRoutes: cfg!.appRoutes,
    paramMapBody: cfg!.paramMapBody,
  };
```

The `=== true` coercion turns `undefined` into `false` explicitly, so templates that don't set the field default to the safe no-push behavior.

- [ ] **Step 3: Build to verify**

Run: `pnpm build:next`
Expected: SWC + Babel + types build clean.

- [ ] **Step 4: Commit**

```bash
git add packages/framework/next/src/lib/sync-plan.ts
git commit -m "feat(next): carry syncOnCodeMenus through the AM sync plan"
```

---

## Task 3: Add the inner gate to `igrpSyncMenus` (TDD)

**Files:**
- Create: `packages/framework/next/src/lib/__tests__/sync-menus.test.ts`
- Modify: `packages/framework/next/src/lib/sync-menus.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/framework/next/src/lib/__tests__/sync-menus.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { igrpSyncMenus } from '../sync-menus';

const makeClient = () => ({
  m2m: {
    syncApplicationMenus: vi.fn().mockResolvedValue(undefined),
  },
});

describe('igrpSyncMenus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('skips the push and logs an info message when syncEnabled=false', async () => {
    const client = makeClient();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    await igrpSyncMenus({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: client as any,
      appCode: 'APP_TEST_1',
      menus: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { id: 1, code: 'M1', name: 'M1', type: 'MENU_PAGE', status: 'ACTIVE' } as any,
      ],
      syncEnabled: false,
    });

    expect(client.m2m.syncApplicationMenus).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'On-code menus sync skipped (IGRP_SYNC_ON_CODE_MENUS=false).',
    );
  });

  it('calls syncApplicationMenus with mapped menus when syncEnabled=true', async () => {
    const client = makeClient();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    const menus = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 1, code: 'M1', name: 'M1', type: 'MENU_PAGE', status: 'ACTIVE' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 2, code: 'M2', name: 'M2', type: 'FOLDER', status: 'ACTIVE' } as any,
    ];

    await igrpSyncMenus({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: client as any,
      appCode: 'APP_TEST_1',
      menus,
      syncEnabled: true,
    });

    expect(client.m2m.syncApplicationMenus).toHaveBeenCalledTimes(1);
    expect(client.m2m.syncApplicationMenus).toHaveBeenCalledWith(
      'APP_TEST_1',
      expect.arrayContaining([
        expect.objectContaining({ code: 'M1', type: 'MENU_PAGE', status: 'ACTIVE' }),
        expect.objectContaining({ code: 'M2', type: 'FOLDER', status: 'ACTIVE' }),
      ]),
    );
    expect(info).toHaveBeenCalledWith('On-code menus synchronized successfully.');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @igrp/framework-next test -- sync-menus`
Expected: test file fails to type-check or both tests fail because the current `igrpSyncMenus` does not accept `syncEnabled` and never short-circuits.

- [ ] **Step 3: Add the gate to `igrpSyncMenus`**

Edit `packages/framework/next/src/lib/sync-menus.ts`. Replace the entire file with:

```ts
import 'server-only';

import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  type AccessManagementClient,
  type MenuType,
  type Status,
} from '@igrp/platform-access-management-client-ts';

export interface IGRPSyncMenusArgs {
  client: AccessManagementClient;
  appCode: string;
  menus: IGRPMenuItemArgs[];
  syncEnabled: boolean;
}

export async function igrpSyncMenus({
  client,
  appCode,
  menus,
  syncEnabled,
}: IGRPSyncMenusArgs) {
  if (!syncEnabled) {
    console.info('On-code menus sync skipped (IGRP_SYNC_ON_CODE_MENUS=false).');
    return;
  }

  await client.m2m.syncApplicationMenus(
    appCode,
    menus.map((i: IGRPMenuItemArgs) => {
      return {
        ...i,
        type: i.type as MenuType,
        status: i.status as Status,
      };
    }),
  );

  console.info('On-code menus synchronized successfully.');
}
```

`syncEnabled` is **required** (no default) so a caller that forgets to thread it through fails compilation rather than silently skipping the sync.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @igrp/framework-next test -- sync-menus`
Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/framework/next/src/lib/sync-menus.ts packages/framework/next/src/lib/__tests__/sync-menus.test.ts
git commit -m "feat(next): gate igrpSyncMenus push on syncEnabled"
```

---

## Task 4: Forward `syncOnCodeMenus` from `igrpStartupSync` into `igrpSyncMenus`

**Files:**
- Modify: `packages/framework/next/src/lib/startup-sync.ts:52-56`

- [ ] **Step 1: Pass `syncEnabled` from the plan**

Open `packages/framework/next/src/lib/startup-sync.ts`. In the `Promise.all` block (lines 45–57), update the `igrpSyncMenus` call:

```ts
        igrpSyncMenus({
          client: plan.client,
          appCode: plan.appCode,
          menus: plan.menus,
          syncEnabled: plan.syncOnCodeMenus,
        }),
```

No other change is needed in this file — `plan.syncOnCodeMenus` is required on the plan type after Task 2, so TypeScript will catch any missed wire-through.

- [ ] **Step 2: Build to verify**

Run: `pnpm build:next`
Expected: SWC + Babel + types build clean.

- [ ] **Step 3: Run all framework-next tests**

Run: `pnpm --filter @igrp/framework-next test`
Expected: all tests pass (including the existing `api-config` / `api-client` suites and the new `sync-menus` suite).

- [ ] **Step 4: Commit**

```bash
git add packages/framework/next/src/lib/startup-sync.ts
git commit -m "feat(next): forward syncOnCodeMenus into igrpSyncMenus"
```

---

## Task 5: Source `menus` from `onCodeMenus` in `IGRPRootLayout`

**Files:**
- Modify: `packages/framework/next/src/layouts/igrp-root-layout.tsx:40-47`

- [ ] **Step 1: Update the `planAccessManagementSync` call**

Open `packages/framework/next/src/layouts/igrp-root-layout.tsx`. Replace the `menus:` line in the `planAccessManagementSync` call (currently line 45):

Before:
```ts
    menus: sidebarData.menuItems ?? [],
```

After:
```ts
    menus: apiManagementConfig?.onCodeMenus ?? [],
```

This is the **semantic core** of the feature. Previously the sync was echoing AM-loaded menus back to AM; now it pushes the template-defined `IGRP_DEFAULT_MENU` array, which is the only source of truth that makes the flag meaningful.

`sidebarData.menuItems` continues to drive the rendered sidebar (it is loaded just above the `planAccessManagementSync` call) — only the *sync input* changes.

- [ ] **Step 2: Build to verify**

Run: `pnpm build:next`
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/layouts/igrp-root-layout.tsx
git commit -m "feat(next): source AM menu push from apiManagementConfig.onCodeMenus"
```

---

## Task 6: Rebuild the framework chain

**Files:** (none modified — sanity rebuild)

- [ ] **Step 1: Run the ordered framework build**

Run: `pnpm build:framework`
Expected: all five packages build clean in the documented order (`next-auth → next-types → design-system → next-ui → next`).

If any package fails, stop and fix before proceeding — `build:framework` failing means the template build in Task 8 will also fail.

---

## Task 7: Wire the template config to pass `onCodeMenus` + `syncOnCodeMenus`

**Files:**
- Modify: `templates/demo-legacy/src/igrp.template.config.ts`

- [ ] **Step 1: Import the on-code menu array**

Open `templates/demo-legacy/src/igrp.template.config.ts`. Add the import near the other `@/temp/*` imports (alongside the existing `import { getMockApps } from "@/temp/applications/use-mock-apps";`):

```ts
import { IGRP_DEFAULT_MENU } from "@/temp/menus/menus";
```

- [ ] **Step 2: Pass both fields into `apiManagementConfig`**

In the same file, locate the `apiManagementConfig: { … }` block (around lines 67–74). Add the two new fields after `m2mClientSecret`:

```ts
    apiManagementConfig: {
      baseUrl: process.env.IGRP_ACCESS_MANAGEMENT_API || "",
      serviceId: process.env.IGRP_SERVICE_ID || "",
      m2mClientId: process.env.IGRP_M2M_CLIENT_ID || "",
      m2mClientSecret: process.env.IGRP_M2M_CLIENT_SECRET || "",
      syncOnCodeMenus: process.env.IGRP_SYNC_ON_CODE_MENUS === "true",
      onCodeMenus: IGRP_DEFAULT_MENU,
      appRoutes,
      paramMapBody,
    },
```

- [ ] **Step 3: Type-check / build the template**

Run: `pnpm build:demo`
Expected: Biome format pass, then `next build` succeeds.

- [ ] **Step 4: Commit**

```bash
git add templates/demo-legacy/src/igrp.template.config.ts
git commit -m "feat(template): pass IGRP_DEFAULT_MENU + syncOnCodeMenus to igrpBuildConfig"
```

---

## Task 8: Document the env var

**Files:**
- Modify: `templates/demo-legacy/.env.example`

- [ ] **Step 1: Find the AM section**

Open `templates/demo-legacy/.env.example`. Locate the block that defines `IGRP_SYNC_ACCESS`, `IGRP_ACCESS_MANAGEMENT_API`, `IGRP_SERVICE_ID`, `IGRP_M2M_CLIENT_ID`, `IGRP_M2M_CLIENT_SECRET`. Verify the exact lines before editing — the existing comment style and key ordering should be preserved.

- [ ] **Step 2: Add the new variable**

Append (or insert at an appropriate place inside that block, after `IGRP_M2M_CLIENT_SECRET`):

```
# When true, the framework pushes `src/temp/menus/menus.ts` (IGRP_DEFAULT_MENU)
# to Access Management at startup via syncApplicationMenus. Requires
# IGRP_SYNC_ACCESS=true and IGRP_PREVIEW_MODE=false to take effect.
# When false (default), AM remains the source of truth and no push happens.
# NOTE: enabling this overwrites the menus on the AM side with the local array.
IGRP_SYNC_ON_CODE_MENUS=false
```

- [ ] **Step 3: Commit**

```bash
git add templates/demo-legacy/.env.example
git commit -m "docs(template): document IGRP_SYNC_ON_CODE_MENUS in .env.example"
```

---

## Task 9: Migration guide + payload

**Files:**
- Create: `packages/template-migrator/migrations/demo-legacy/09.MIGRATIONS-25052026.md`
- Create: `packages/template-migrator/migrations/demo-legacy/payload/09/igrp.template.config.ts`
- Create: `packages/template-migrator/migrations/demo-legacy/payload/09/.env.example`

- [ ] **Step 1: Look up the framework target version**

Run: `cat packages/framework/next/package.json | grep '"version"'`
Note the current version (something like `0.1.0-beta.NNN`). The next published version will be `0.1.0-beta.NNN+1`. Use that as `targetFrameworkVersion` below.

- [ ] **Step 2: Copy the post-change template files into the payload directory**

```bash
mkdir -p packages/template-migrator/migrations/demo-legacy/payload/09
cp templates/demo-legacy/src/igrp.template.config.ts packages/template-migrator/migrations/demo-legacy/payload/09/igrp.template.config.ts
cp templates/demo-legacy/.env.example packages/template-migrator/migrations/demo-legacy/payload/09/.env.example
```

- [ ] **Step 3: Write the migration markdown**

Create `packages/template-migrator/migrations/demo-legacy/09.MIGRATIONS-25052026.md`:

```markdown
---
id: 09-sync-on-code-menus
date: 2026-05-25
targetFrameworkVersion: 0.1.0-beta.NNN  # replace with the bumped framework-next version from Step 1
requires: ["08-m2m-oauth2-client-credentials"]
steps:
  - type: file.write
    path: src/igrp.template.config.ts
    mode: replace
    from: payload/09/igrp.template.config.ts
  - type: file.write
    path: .env.example
    mode: replace
    from: payload/09/.env.example
  - type: deps.bump
    manifest: package.json
    ranges:
      "@igrp/framework-next": "0.1.0-beta.NNN"  # same version as targetFrameworkVersion
      "@igrp/framework-next-types": "0.1.0-beta.MMM"  # bumped next-types version
---

# Migration Guide — Re-introduce IGRP_SYNC_ON_CODE_MENUS

This document covers the changes made on **2026-05-25**, following migration `08.MIGRATIONS-21052026.md`. The on-code menu push to Access Management is now controlled by `IGRP_SYNC_ON_CODE_MENUS`, and the menu array sent to AM is the template-defined `IGRP_DEFAULT_MENU` rather than whatever the layout loaded.

## What changed

1. **`IGRP_SYNC_ON_CODE_MENUS` is re-introduced** as a boolean env var. When `true` (and the outer `IGRP_SYNC_ACCESS=true`, `IGRP_PREVIEW_MODE=false` gates are satisfied), the framework pushes `src/temp/menus/menus.ts` (`IGRP_DEFAULT_MENU`) to AM at startup. When `false` (the default), nothing is pushed and AM stays untouched.
2. **`apiManagementConfig.syncOnCodeMenus` and `apiManagementConfig.onCodeMenus` are added** to the type at `@igrp/framework-next-types`. The template's `igrp.template.config.ts` now imports `IGRP_DEFAULT_MENU` and forwards both fields.
3. **The AM menu push now uses `onCodeMenus`, not the AM-loaded sidebar menus.** Previously the framework was echoing menus loaded from AM back to AM — a no-op disguised as a sync. Now the push is meaningful: the local array is the source of truth.

## Why

- The original `IGRP_SYNC_ON_CODE_MENUS` (introduced in migration 02, removed in migration 08) was dead because no inner gate read the field. This re-introduction wires the field to the actual `igrpSyncMenus` call site.
- Sourcing `menus` from `onCodeMenus` instead of `sidebarData.menuItems` is what makes the flag have any operational effect. Without this, the push would still be a round-trip echo.

## Manual review steps

This migration replaces `src/igrp.template.config.ts` and `.env.example` wholesale.

1. **Diff your local `.env`** and add:
   ```
   IGRP_SYNC_ON_CODE_MENUS=false
   ```
   Leave it `false` unless you specifically want to overwrite AM with your local menus.
2. **Restart the dev server.** With `IGRP_SYNC_ACCESS=true` and `IGRP_SYNC_ON_CODE_MENUS=true`, the server log shows `On-code menus synchronized successfully.` With `IGRP_SYNC_ON_CODE_MENUS=false`, the log shows `On-code menus sync skipped (IGRP_SYNC_ON_CODE_MENUS=false).`

## Caution

Enabling `IGRP_SYNC_ON_CODE_MENUS=true` is **destructive on the AM side** — `syncApplicationMenus` reconciles AM to match `IGRP_DEFAULT_MENU`. Only enable it in environments where the local array is authoritative.
```

- [ ] **Step 4: Commit**

```bash
git add packages/template-migrator/migrations/demo-legacy/09.MIGRATIONS-25052026.md packages/template-migrator/migrations/demo-legacy/payload/09/
git commit -m "docs(migrations): add 09 — re-introduce IGRP_SYNC_ON_CODE_MENUS"
```

---

## Task 10: Changesets

**Files:**
- Create: `.changeset/sync-on-code-menus-types.md`
- Create: `.changeset/sync-on-code-menus-next.md`
- Create: `.changeset/sync-on-code-menus-template.md`

Per the repo hard rule, **every changeset uses `patch`** — pre-release mode in this repo treats `minor`/`major` as breaking changes to the `0.1.0-beta.*` pattern.

- [ ] **Step 1: Create the next-types changeset**

Create `.changeset/sync-on-code-menus-types.md`:

```markdown
---
'@igrp/framework-next-types': patch
---

feat(next-types): add `syncOnCodeMenus` and `onCodeMenus` to `apiManagementConfig`

Two new optional fields on `IGRPConfigArgs['apiManagementConfig']`:

- `syncOnCodeMenus?: boolean` — when true, the framework pushes `onCodeMenus` to Access Management at startup.
- `onCodeMenus?: IGRPMenuItemArgs[]` — the template-defined menu array used as the push payload.

Both are optional; omitting them keeps the current (post-migration-08) no-push behavior.
```

- [ ] **Step 2: Create the framework-next changeset**

Create `.changeset/sync-on-code-menus-next.md`:

```markdown
---
'@igrp/framework-next': patch
---

feat(next): gate AM menu push on `IGRP_SYNC_ON_CODE_MENUS`

`igrpSyncMenus` now requires a `syncEnabled` arg. When `false`, the push is skipped and a `console.info` line is emitted. `IGRPRootLayout` sources the push payload from `apiManagementConfig.onCodeMenus` instead of the AM-loaded sidebar menus, so the push is meaningful (template-defined array → AM) rather than a no-op echo.

Outer sync gating on `IGRP_SYNC_ACCESS` / `IGRP_PREVIEW_MODE` is unchanged.
```

- [ ] **Step 3: Create the template changeset**

Create `.changeset/sync-on-code-menus-template.md`:

```markdown
---
'@igrp/framework-next-template': patch
---

feat(template): wire `IGRP_SYNC_ON_CODE_MENUS` end-to-end

- `.env.example` now documents `IGRP_SYNC_ON_CODE_MENUS=false` (default).
- `src/igrp.template.config.ts` imports `IGRP_DEFAULT_MENU` and forwards `syncOnCodeMenus` + `onCodeMenus` into `igrpBuildConfig`.
- See `packages/template-migrator/migrations/demo-legacy/09.MIGRATIONS-25052026.md` for the full migration guide.
```

- [ ] **Step 4: Commit**

```bash
git add .changeset/sync-on-code-menus-types.md .changeset/sync-on-code-menus-next.md .changeset/sync-on-code-menus-template.md
git commit -m "chore(changeset): IGRP_SYNC_ON_CODE_MENUS across types, next, template"
```

---

## Task 11: Manual verification matrix

**Files:** (none — runtime check)

- [ ] **Step 1: Ensure framework + template are built**

Run: `pnpm build:framework && pnpm build:demo`
Expected: clean.

- [ ] **Step 2: Verify push enabled**

Set in `templates/demo-legacy/.env` (do NOT commit this file):
```
IGRP_PREVIEW_MODE=false
IGRP_SYNC_ACCESS=true
IGRP_SYNC_ON_CODE_MENUS=true
```
Set the other required AM env vars per your existing setup. Run: `pnpm dev:demo`
Expected: server console shows `On-code menus synchronized successfully.` and `Access Management sync completed.`

- [ ] **Step 3: Verify push disabled**

Flip the .env:
```
IGRP_SYNC_ON_CODE_MENUS=false
```
Restart: `pnpm dev:demo`
Expected: server console shows `On-code menus sync skipped (IGRP_SYNC_ON_CODE_MENUS=false).` and `Access Management sync completed.`

- [ ] **Step 4: Verify preview mode short-circuits regardless of the new flag**

Flip the .env:
```
IGRP_PREVIEW_MODE=true
IGRP_SYNC_ACCESS=true
IGRP_SYNC_ON_CODE_MENUS=true
```
Restart: `pnpm dev:demo`
Expected: console shows the warning `[igrp] IGRP_SYNC_ACCESS=true is being ignored because IGRP_PREVIEW_MODE=true.` and **no** `On-code menus` log line (sync pipeline is short-circuited at `planAccessManagementSync` before reaching `igrpSyncMenus`).

If any of the three matrices behaves differently than expected, do NOT release — go back and diagnose. The most likely failure mode is missing wire-through somewhere between `igrp.template.config.ts` and `igrpSyncMenus`.

---

## Self-review summary

- **Spec coverage:** every section of `docs/superpowers/specs/2026-05-25-igrp-sync-on-code-menus-design.md` (`@igrp/framework-next-types` change → Task 1; sync-plan thread → Task 2; `igrpSyncMenus` gate → Task 3; orchestrator → Task 4; root-layout source switch → Task 5; framework rebuild → Task 6; template config → Task 7; `.env.example` → Task 8; migration + payload → Task 9; changesets → Task 10; testing matrix → Task 11) has a task.
- **No placeholders.** The two `NNN`/`MMM` tokens in the migration frontmatter are explicitly flagged as "replace with the bumped framework-next version from Step 1" — they are intentional version lookups the implementer must perform at execution time, not hidden TODOs.
- **Type consistency:** `syncOnCodeMenus` appears as optional `?: boolean` on the public type (Task 1), required `: boolean` on the internal plan (Task 2), and required on `IGRPSyncMenusArgs.syncEnabled` (Task 3). The narrowing (`cfg!.syncOnCodeMenus === true`) at the planner step is what bridges optional → required.
