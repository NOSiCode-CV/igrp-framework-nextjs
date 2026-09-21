# @igrp/framework-next-types

Shared TypeScript types for the IGRP Framework — **declaration-only**. The published package contains `.d.ts` files and their sources; there is no JavaScript entry point and nothing to import at runtime.

## Requirements

- **Node.js** ≥ 22
- **next-auth** ^4.24.0 (peer)
- **react** ^19.0.0 (optional peer — needed only because `IGRPConfigArgs.sessionArgs` embeds `SessionProviderProps`, which is React-typed)

There is no `next` peer: nothing in this package references a Next.js type.

---

## Installation

```bash
pnpm add -D @igrp/framework-next-types
```

Since nothing here survives compilation, a dev dependency is usually the right call.

---

## What's exported

Every export is a **type**; importing one with a value import will not resolve.

| Module                | Types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Access management** | `IGRPMenuType`, `IGRPMenuTypeCRUD`, `IGRPMenuTypeSyncable`, `IGRPApplicationTypeSyncable`, `IGRPStatus`, `IGRPTargetType`, `IGRPApplicationType`, `IGRPConfigurationType`, `IGRPApplicationArgs`, `IGRPMenuItemArgs`, `IGRPRoleDepartmentArgs`, `IGRPMenuCRUDArgs`, `IGRPRoleArgs`, `IGRPRoleUserArgs`, `IGRPDepartmentArgs`, `IGRPGlobalConfigurationArgs`, `IGRPFileUrlArgs`, `IGRPPermissionArgs`, `IGRPPermissionCatalogEntry`, `IGRPResourceType`, `IGRPResourceItem`, `IGRPResourceArgs`, `IGRPUserArgs` |
| **Globals**           | `IGRPMockDataAsync`, `IGRPMockData`, `IGRPToasterPosition`, `IGRPPackageJson`                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Header**            | `IGRPHeaderDataArgs`, `IGRPNotificationArgs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **IGRP config**       | `IGRPConfigArgs`, `IGRPConfigClient`, `IGRPLayoutConfigArgs`                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Sidebar**           | `IGRPSidebarDataArgs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Claims**            | `IGRPAccessClaims`, `IGRPClaimsState` — re-exported from `@igrp/framework-next-auth/claims`                                                                                                                                                                                                                                                                                                                                                                                                                    |

`Session` and `JWT` are **not** re-exported here. Import them from `@igrp/framework-next-auth/session` and `@igrp/framework-next-auth/jwt`.

---

## Usage

```ts
import type { IGRPConfigArgs, IGRPSidebarDataArgs } from '@igrp/framework-next-types';
```

---

## Relationship to the Access Management client

`IGRPApplicationArgs`, `IGRPMenuItemArgs`, `IGRPStatus` and friends mirror the DTOs of `@igrp/platform-access-management-client-ts` rather than re-exporting them. That is deliberate: the client models `status` / `type` as `declare enum`s, while templates author menus as object literals with plain strings (`type: 'MENU_PAGE'`). A literal union is the only shape that is both hand-authorable and assignable from the enum.

Hand-mirroring drifts, so it is gated rather than trusted. `contract/am-contract.ts` asserts two things at build time:

1. **Assignability** — every DTO is assignable to its framework counterpart, so the framework type is never _wider_ than the wire.
2. **Field coverage** — every DTO property is mirrored, so the framework type is never _narrower_. Assignability alone cannot see this: a DTO that grows a field is still assignable to the old, smaller framework type. That is how `IGRPUserDTO`'s `nic`, `phoneNumber`, `emailVerified` and `metadata` drifted in unnoticed while the gate stayed green. Fields the framework deliberately does not carry are named explicitly in the assertion.

Both run together:

```bash
pnpm --filter @igrp/framework-next-types check:contract
```

It runs as part of `pnpm build`. When it fails, the AM client changed — update `src/types/access-management.ts` to match, or narrow the assertion and record why. Never silence it with a cast.

The AM client is a **devDependency** only; it never reaches the published `dist/` or a consumer's install.

---

## Build

```bash
# From repo root
pnpm build:next-types

# From package directory
pnpm build
```

Plain **`tsc -b`** — no Babel, no tsup. Emits only `.d.ts` and `.d.ts.map`.
`check:dist` then verifies the emitted declarations: relative specifiers must
carry a `.js` extension, or the package is unresolvable under `node16` /
`nodenext` — silently, since `skipLibCheck` hides the error inside a `.d.ts` and
every exported type becomes `any`. The sources those maps point at ship alongside them, so "go to definition" lands in real code.

This package declares `composite: true` because it is the one workspace project genuinely built by `tsc -b`, and the only one the root `tsconfig.json` still references.

It deliberately does **not** declare a project reference to `@igrp/framework-next-auth`. Two things block it: a reference target may not disable emit (TS6310), and the only config over there that does emit would write `.d.ts` into the `dist/` that `tsup` already owns. Moving that emit off tsup would change the published declarations from bundled to file-per-module, which is not worth it for build ordering that `pnpm build:framework` already guarantees — see `.claude/shared/dependency-order.md`.

---

## Dependency note

This package depends on `@igrp/framework-next-auth` for session and claims types, and is consumed by `framework-next-ui`, `framework-next` and `templates/demo-v1`.

The chain below is the **build order** that `pnpm build:framework` runs, not a dependency graph — `design-system` sits in it but has no dependency on this package:

```
framework-next-auth → framework-next-types → design-system → framework-next-ui → framework-next
```

A type change here can break every downstream package. Prefer **additive** changes; keep old type aliases for at least one release before removing them.

After any type change, run `pnpm build:framework` to catch downstream breakage.

---

## License

MIT © IGRP Labs
