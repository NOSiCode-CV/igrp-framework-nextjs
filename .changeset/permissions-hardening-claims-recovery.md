---
"@igrp/framework-next": patch
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

Both changes are additive: each affects only states that previously failed
outright.
