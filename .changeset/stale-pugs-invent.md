---
'@igrp/framework-next-types': patch
'@igrp/framework-next-ui': patch
'@igrp/framework-next': patch
---

Fix the `next-types` package boundary and gate its Access Management types against the real DTO contract.

**`@igrp/framework-next-types`**

- The manifest advertised `main` / `module` / an `import` condition pointing at `dist/index.js`, which the declaration-only build never emits. `exports` now carries a `types` condition only — no phantom runtime entry.
- Declared the peers the public surface actually embeds: `IGRPConfigArgs.sessionArgs` is `Partial<SessionProviderProps>`, which is React-typed, so `react` and `next` are now (optional) peers alongside `next-auth`.
- `declarationMap` was on while `files` shipped `dist` only, so every published `.d.ts.map` pointed at sources that were not in the tarball. `src` now ships too.
- Realigned the AM types with `@igrp/platform-access-management-client-ts`, which they mirror by hand and had drifted from: `IGRPPermissionArgs.description`, `IGRPRoleArgs.description` / `parentCode` and `IGRPDepartmentArgs.description` accept `null`; `IGRPRoleArgs.name` and `IGRPDepartmentArgs.status` are optional; `IGRPRoleArgs`, `IGRPResourceArgs` and `IGRPResourceItem` carry permission **names** (`string[]`) rather than permission objects; `IGRPResourceArgs.id` / `status` and `IGRPResourceItem.id` are optional; `IGRPFileUrlArgs.expiration` accepts a `Date`.
- Added `contract/am-contract.ts` plus `pnpm check:contract` (wired into `build`): a build-time assertion that every AM DTO is assignable to its framework counterpart, so this drift cannot recur silently. The AM client is a devDependency and never reaches the published output.
- `IGRPRoleDepartmentArgs` is now exported from the barrel — it is the element type of the required `IGRPMenuItemArgs.roles` but could not be named by consumers.
- `IGRPHeaderDataArgs`: the eight `show*` flags are optional (default `false`, matching the renderer's existing truthiness checks) instead of all required.
- `IGRPNotificationArgs.timestamp` accepts `string | Date`; ISO 8601 strings are now the documented form.
- Marked the unused pure AM mirrors `@deprecated` in favour of the client's own DTOs: `IGRPResourceArgs`, `IGRPResourceItem`, `IGRPResourceType`, `IGRPGlobalConfigurationArgs`, `IGRPConfigurationType`, `IGRPFileUrlArgs`, `IGRPRoleUserArgs`.
- `IGRPConfigArgs.layoutMockData` references `IGRPMockDataAsync` instead of re-declaring it inline; `Session` is imported from the `@igrp/framework-next-auth/session` subpath rather than the root barrel.
- Added the missing `LICENSE`, and corrected a README that documented type names which do not exist (`IGRPConfig`, `IGRPSidebarConfig`, `IGRPHeaderConfig`), a `Session`/`JWT` re-export that does not happen, and the wrong Node/next-auth ranges.

**`@igrp/framework-next`**

- Dropped the unchecked `as IGRPStatus` / `as IGRPMenuType` / `as IGRPTargetType` casts from the application and menu mappers. TypeScript accepts a string enum where its literal union is expected, so the casts were never load-bearing — they only hid drift, and the contract gate now proves the assignment is sound.
- `mapApplication` no longer silently drops `lastAccess`.

**`@igrp/framework-next-ui`**

- `IGRPTemplateNotifications` called `.toLocaleString()` straight on `timestamp`, which throws when notifications come from a JSON API (a string, not a `Date`), and formatted with the ambient locale and time zone, producing a hydration mismatch on every row. It now accepts both forms, renders inside a `<time dateTime>` element, takes a `locale` prop (default `pt-PT`), and renders empty rather than `Invalid Date` for unparseable input.
