# Re-introduce `IGRP_SYNC_ON_CODE_MENUS`

**Date:** 2026-05-25
**Status:** Approved (design)
**Affects:** `@igrp/framework-next-types`, `@igrp/framework-next`, `templates/demo-legacy` (`@igrp/framework-next-template`)

## Background

`IGRP_SYNC_ON_CODE_MENUS` was introduced in migration `02.MIGRATIONS-05122025.md` and removed in migration `08.MIGRATIONS-21052026.md` because the flag had no effect — every sync phase, including on-code menu sync, was gated on `IGRP_SYNC_ACCESS` and there was no inner gate that read the field. The corresponding type fields (`syncOnCodeMenus`, `onCodeMenus` semantics via a menus array) were dropped from `apiManagementConfig`.

We now want to re-introduce the flag with meaningful semantics: control whether the framework **pushes** the template's on-code menus (`templates/demo-legacy/src/temp/menus/menus.ts`) to Access Management at startup.

## Goal

Give operators a per-deployment switch to enable or disable pushing the locally-defined menus array (`IGRP_DEFAULT_MENU`) to AM via `client.m2m.syncApplicationMenus`. When disabled, AM remains the unmodified source of truth; when enabled, AM is reconciled to match the code-defined menus on each startup that already passes the outer `IGRP_SYNC_ACCESS` / `IGRP_PREVIEW_MODE` gates.

## Non-goals

- Changing the **read** path. Sidebar menu loading continues to come from AM via the existing server action (`fetchMenusAction`) in non-preview, and from `getMockMenus()` in preview. There is no new "serve menus from `menus.ts` at runtime" path.
- Replacing or relaxing the outer sync gate. `IGRP_SYNC_ACCESS=true` + `IGRP_PREVIEW_MODE=false` remain prerequisites; the new flag is an inner gate for the menu phase only.
- Reviving any of the dead M2M token fields removed in migration 08 (`m2mToken`, `m2mServiceId`, etc.). The OAuth2 `client_credentials` flow stays.

## Design

### Data flow

```
.env  →  igrp.template.config.ts  →  igrpBuildConfig({ apiManagementConfig })
                                          │
                                          ▼
                                 framework sync pipeline
                                 (outer gate: IGRP_SYNC_ACCESS + !IGRP_PREVIEW_MODE)
                                          │
                                          ▼
                                  igrpSyncMenus({ syncEnabled, menus, ... })
                                          │
                              ┌───────────┴───────────┐
                            true                    false
                              │                        │
                              ▼                        ▼
                  client.m2m.syncApplicationMenus    no-op + console.info
```

### Change surface

#### 1. `@igrp/framework-next-types` — `apiManagementConfig` shape

Restore two optional fields:

```ts
interface IGRPApiManagementConfig {
  // existing fields…
  syncOnCodeMenus?: boolean;
  onCodeMenus?: IGRPMenuItemArgs[];
}
```

Both optional so older templates that don't supply them keep type-checking; the framework treats absent as `false` / `[]` and skips the push.

#### 2. `templates/demo-legacy/src/igrp.template.config.ts`

Import the local menus array and forward both new fields:

```ts
import { IGRP_DEFAULT_MENU } from "@/temp/menus/menus";

// inside igrpBuildConfig({ apiManagementConfig: { … } })
syncOnCodeMenus: process.env.IGRP_SYNC_ON_CODE_MENUS === "true",
onCodeMenus: IGRP_DEFAULT_MENU,
```

No other template files change.

#### 3. `templates/demo-legacy/.env.example`

Add the variable with documentation comment:

```
# When true, the framework pushes `src/temp/menus/menus.ts` to Access Management
# at startup via syncApplicationMenus. Requires IGRP_SYNC_ACCESS=true and
# IGRP_PREVIEW_MODE=false to take effect. When false, AM remains the source of
# truth and no push happens.
IGRP_SYNC_ON_CODE_MENUS=false
```

Default is `false` to preserve the current (post-migration-08) behavior for existing `.env` files that don't declare the variable.

#### 4. `packages/framework/next/src/lib/sync-menus.ts`

Add the inner gate. Function name and push behavior unchanged; only adds the `syncEnabled` arg and early-return path:

```ts
export interface IGRPSyncMenusArgs {
  client: AccessManagementClient;
  appCode: string;
  menus: IGRPMenuItemArgs[];
  syncEnabled: boolean;
}

export async function igrpSyncMenus({ client, appCode, menus, syncEnabled }: IGRPSyncMenusArgs) {
  if (!syncEnabled) {
    console.info('On-code menus sync skipped (IGRP_SYNC_ON_CODE_MENUS=false).');
    return;
  }
  await client.m2m.syncApplicationMenus(
    appCode,
    menus.map((i) => ({ ...i, type: i.type as MenuType, status: i.status as Status })),
  );
  console.info('On-code menus synchronized successfully.');
}
```

#### 5. The caller of `igrpSyncMenus` inside `@igrp/framework-next`

The orchestrator that invokes `igrpSyncMenus` (the sync pipeline triggered downstream of `IGRPRootLayout` / `igrpBuildConfig`) reads `apiManagementConfig.syncOnCodeMenus` and `apiManagementConfig.onCodeMenus` from the assembled config and forwards them. The outer `IGRP_SYNC_ACCESS` / `IGRP_PREVIEW_MODE` gate stays unchanged — this is only an additional inner check inside the menu phase.

The exact file and call site is identified during plan-writing (see "Open investigation").

## Open investigation (for the implementation plan)

1. Confirm the current call site of `igrpSyncMenus` inside `packages/framework/next/src/`. The change must thread `syncEnabled` and `menus` through without disturbing the existing outer gate.
2. Confirm `IGRPMenuItemArgs` is the type exported by `@igrp/framework-next-types` that matches `IGRP_DEFAULT_MENU`'s annotation in `templates/demo-legacy/src/temp/menus/menus.ts` (it is, as of the file we read — but verify it has not drifted).

Both are mechanical lookups, not design questions.

## Migration & docs

This is a new feature on top of migration 08, not a rollback. It requires a new migration file:

- `packages/template-migrator/migrations/demo-legacy/09.MIGRATIONS-25052026.md` — describes the env-var addition, the template config diff, and target framework version (a fresh beta).
- `payload/09/.env.example` and `payload/09/igrp.template.config.ts` — canonical copies after the change.
- A changeset entry per affected publishable package using `patch` (per repo hard rules — pre-release `0.1.0-beta.*`).

## Testing

- **Type-check:** `pnpm build:framework` (ordered build, types ripple `next-types → next`).
- **Template compile:** `pnpm build:demo` after framework build.
- **Manual smoke:**
  - With `IGRP_SYNC_ACCESS=true`, `IGRP_PREVIEW_MODE=false`, `IGRP_SYNC_ON_CODE_MENUS=true` → server log shows `On-code menus synchronized successfully.` and AM reflects the contents of `menus.ts`.
  - Same env but `IGRP_SYNC_ON_CODE_MENUS=false` → server log shows the skipped message; AM untouched.
  - `IGRP_PREVIEW_MODE=true` → sync pipeline is short-circuited by the outer gate regardless of the new flag (no log from `igrpSyncMenus`).

## Risks

- Re-introducing a flag that was previously dead invites the same drift if the orchestrator forgets to pass `syncEnabled`. Mitigated by making the field **required** on `IGRPSyncMenusArgs` (no default) so a missed wire-through is a compile error, not silent dead config.
- `IGRP_DEFAULT_MENU` currently doubles as the *preview-mode mock*. Pushing it to a real AM in non-preview overwrites whatever an operator has configured in AM. That's the intended behavior of the flag, but the README and migration guide must call it out as destructive-on-AM-side.
