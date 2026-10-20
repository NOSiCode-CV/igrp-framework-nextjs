---
"@igrp/framework-next": patch
"@igrp/framework-next-types": patch
"@igrp/framework-next-ui": patch
---

Permissions hardening: server-action claims recovery + live client claims

**`@igrp/framework-next`**

- `igrpGetClaims()` now recovers the access token from the session cookie when no
  `AsyncLocalStorage` store was established, and seeds the store so the Access
  Management client works in the same call. Previously, calling `igrpAuthorize()`
  from a Server Action or Route Handler denied **every** user — super admins
  included — because the token was only reachable through a store that a fresh
  async context never enters. The recovery uses `getToken` + cookies (not
  `getServerSession`, which needs the app's `NextAuthOptions` and would return a
  session with no `accessToken`), behind dynamic imports so the module graph is
  unchanged for existing importers.
- `igrpGetClaims()` no longer swallows Next.js control-flow signals. The
  cookie-recovery path can raise the static-render bailout (`cookies()` read
  during prerender), `redirect()`, or `forbidden()`; these are now re-thrown
  instead of being converted into a claims error state, so Next still marks the
  route dynamic rather than failing the build with a confusing 5xx. A genuine
  cookie/JWT failure (no `digest`) still fail-closes as before.
- Dev-only diagnostic: `igrpGetClaims()` warns once per request when a
  non-super-admin token carries no `org` claim, which silently denies every
  bare-name permission check and is otherwise indistinguishable from a real
  denial.
- `igrpAssertAuthorize` is documented as **pages only** — an action has no
  `forbidden.tsx` boundary, so use `igrpAuthorize` there.

**`@igrp/framework-next-ui`**

- `IGRPSectionPermissions` now re-decodes claims from the live session instead of
  freezing the server-seeded value for the whole page load. The seeded prop only
  ever arrived once per full page load (token rotation does not call
  `router.refresh()`, and shared layouts do not re-render on client navigation),
  so client gating answered from login-time claims until a reload. Guarded three
  ways: no `SessionProvider` mounted → keep the seeded state (read via
  `SessionContext`, because `useSession()` throws without a provider); session
  `loading` → keep the seeded state; non-JWT token (preview mode) → keep the
  seeded state. `setState` now sets an explicit override, the seam for a future
  active-role switch.
- `IGRPForbidden` gains a "Voltar à Página Inicial" action, matching
  `IGRPTemplateNotFound`'s pattern (`IGRPButton asChild` + `next/link`, so
  `basePath` is applied automatically). Label and destination are overridable
  via the new `homeLabel` / `homeHref` props; pass `homeHref={null}` to render
  no action when the surrounding shell already offers navigation.

**`@igrp/framework-next-types`**

- New `IGRPPermissionCatalogEntry` (`{ name, description?, enabled }`) — a
  permission an app **declares** for registration in the Access Management
  catalog. Deliberately distinct from `IGRPPermissionArgs`, which is the record
  AM *returns* (it carries AM's `id`, `status` and `departmentCode`), and from a
  permission **claim** on the access token. Registering an entry does not make
  it checkable.
- New `apiManagementConfig.syncPermissions` (default `false`) and
  `apiManagementConfig.onCodePermissions`.

**`@igrp/framework-next` — permission catalog sync**

- New `igrpSyncPermissions`, wired as a fourth arm of the existing startup-sync
  pipeline alongside routes and menus. Gated by `syncPermissions` on top of the
  existing `syncAccess` / `previewMode` gates, so enabling the capability cannot
  make an existing deployment start writing to the shared AM without opting in.
- Idempotent upsert keyed on `name`; entries removed from the catalog are not
  deleted in AM. An empty catalog is skipped rather than sent as an empty upsert.
- `planAccessManagementSync` validates catalog names against
  `^[A-Za-z0-9._-]{1,255}$` and **skips** malformed entries with a warning
  instead of throwing — one bad name should not stop an app from booting. It
  also warns off-production when a catalog name contains a dot, because
  `claimsAllow` treats such a name as already department-qualified and a
  bare-name check would silently deny.
- `id` is omitted from the wire payload rather than sent as `0`, which a backend
  matching on id could misread as an update.

Both permission-gating changes above are additive: each affects only states that
previously failed outright.
