# Audit: igrp-application-center vs demo-legacy template

**Date:** 2026-05-11
**Audience:** Fidel (internal reference)
**Scope:** Full — framework wiring, dependency drift, app-specific code patterns
**Method:** Side-by-side structural comparison of both codebases

---

## Summary table

| # | Area | Severity | Type |
|---|------|----------|------|
| 1 | Auth enforcement: `dal.ts` missing, inline layout check | High | Framework divergence |
| 2 | Middleware: static-file regex removed | Medium | Framework divergence |
| 3 | `access-client.ts` pattern not in template | Low | App invented valid workaround |
| 4 | `QueryProvider` inline in layout instead of `src/providers/` | Low | Framework divergence |
| 5 | `@igrp/*` packages pinned to stale `beta.127` | High | Dependency drift |
| 6 | Zod version behind (`^4.1.12` vs template `^4.4.3`) | Medium | Dependency drift |
| 7 | `next-themes` redundant direct dependency | Info | Dependency drift |
| 8 | `ActionResult<T>` pattern not in template | Info | App invented good pattern |
| 9 | `extractApiError()` not in template | Info | App invented good pattern |
| 10 | `lib/errors.ts` dropped, ad-hoc error handling | Medium | App-specific code |
| 11 | `[...not-found]/page.tsx` catch-all instead of `not-found.tsx` | Low | App-specific code |

---

## Section 1 — Framework wiring

### Finding 1 — Auth enforcement: `dal.ts` missing, inline layout check (High)

**Template prescribes:**
`src/lib/dal.ts` owns the "is this user authenticated?" question via a `verifySession()` function wrapped in `React.cache`. The IGRP layout calls `verifySession()` — that's the only auth enforcement point. `getSession()` inside it handles expiry redirects internally.

**App-center does:**
`lib/dal.ts` was dropped entirely. The IGRP layout (`src/app/(igrp)/layout.tsx`) inlines the auth check — it reads `request.headers` to detect if the current path is already `/login` before deciding whether to redirect.

**Why this is a problem:**
- Layout files are presentation-layer. Embedding security decisions there makes it easy to accidentally bypass during refactors (e.g., adding a nested layout that doesn't call the same check).
- The header inspection approach (`headers().get(...)`) is a workaround for redirect-loop prevention that `dal.ts` handles more cleanly by delegating to `getSession()`, which already knows about expiry.
- Auth logic scattered across layout + middleware is harder to reason about and test than a single DAL entry point.

**Fix:**
Restore `src/lib/dal.ts` with `verifySession()`. Call it from `(igrp)/layout.tsx` and remove the inline header inspection.

---

### Finding 2 — Middleware: static-file regex removed (Medium)

**Template prescribes:**
`isPublicPath()` in middleware includes a regex check — `if (/\.[^/]+$/.test(pathname)) return true` — to bypass auth for any request that has a file extension (fonts, images, static assets).

**App-center does:**
Removed that check. Uses only `PUBLIC_PATHS`, `PUBLIC_PREFIXES`, and `STATIC_PREFIXES` string matching.

**Why this matters:**
The regex is a safety net for file-extension requests that fall through the prefix lists. Without it, an uncovered static asset path could trigger an auth redirect instead of being served. `STATIC_PREFIXES` covers `/_next/` but custom static paths (e.g., `/fonts/`, `/icons/`) may not be listed.

**Fix:**
Re-add the regex check to `isPublicPath()`. It's a one-liner and costs nothing.

---

### Finding 3 — `access-client.ts` pattern not in template (Low / Informational)

**What the app-center did:**
Added `src/actions/access-client.ts` — a `getClientAccess()` function that calls `serverSession()` and then explicitly calls `igrpSetAccessClientConfig()` before `igrpGetAccessClient()`.

**Context:**
This was the correct fix for the `React.cache`-in-server-actions bug (config set in layout didn't carry over to POST server action requests). We shipped `@igrp/framework-next@beta.128` today which replaces `React.cache` with a module-level store — but the explicit `igrpSetAccessClientConfig()` call in each server action entry point is still the right pattern for clarity.

**Status:**
Not a divergence problem — the app-center got this right before the framework caught up. No fix needed in the app; consider adding this pattern to the template.

---

### Finding 4 — `QueryProvider` inline in layout instead of `src/providers/` (Low)

**Template prescribes:**
Providers go in `src/providers/` (e.g., `query-client.tsx`), imported and composed in the root layout.

**App-center does:**
`QueryProvider` is wrapped directly inside `(igrp)/layout.tsx` inline.

**Fix:**
Move to `src/providers/query-client-provider.tsx` and import from there. Minor structural issue — doesn't affect functionality.

---

## Section 2 — Dependency drift

### Finding 5 — `@igrp/*` packages pinned to stale `beta.127` (High)

**Current state:**
All `@igrp/*` packages in `package.json` are pinned to `0.1.0-beta.127`.

**What changed in `beta.128`:**
`@igrp/framework-next@beta.128` ships the `React.cache` removal fix — the root cause of the "baseUrl is not configured" server action errors seen today.

**Why pinning is a risk:**
Pinned versions require a manual bump for every bug fix release. The template uses `workspace:*` (local monorepo). For app consumers, a caret range (`^0.1.0-beta.127`) would at least pick up patch bumps automatically — though in pre-release semver, caret behaviour is conservative.

**Fix:**
Bump all `@igrp/*` deps to `0.1.0-beta.128` immediately. Consider whether to stay pinned or move to a range.

---

### Finding 6 — Zod behind template (`^4.1.12` vs `^4.4.3`) (Medium)

**Template prescribes:** `zod ^4.4.3`

**App-center has:** `zod ^4.1.12`

**Risk:**
Zod v4 is in active development. Minor versions between `4.1` and `4.4` included breaking changes to schema inference and error formatting. Any schema using newer inference features from the template would behave differently in the app-center.

**Fix:**
Bump to `^4.4.3` and run the app to surface any schema breakage. Test all Zod schemas in `src/features/*/` and `src/schemas/`.

---

### Finding 7 — `next-themes` redundant direct dependency (Info)

**What happened:**
`next-themes` is listed as a direct dependency in the app-center's `package.json`. However, `@igrp/framework-next-ui` already depends on and re-exports `next-themes` internals.

**Risk:**
Low — mostly a version drift concern if `next-themes` releases a breaking update and the two copies diverge.

**Fix:**
Remove `next-themes` from the app-center's direct dependencies and let the framework package own it.

---

## Section 3 — App-specific code

### Finding 8 — `ActionResult<T>` pattern not in template (Informational / Good)

**What the app-center did:**
All server actions return a discriminated union:
```ts
type ActionResult<T> = { success: true; data: T } | { success: false; error: string }
```

**Assessment:**
This is a clean, type-safe pattern that makes server action error handling predictable across the entire app. The template has no equivalent — server actions in `demo-legacy` either return data directly or throw. This is a pattern worth pulling into the template.

**No fix needed in the app-center.** Flag for template adoption.

---

### Finding 9 — `extractApiError()` not in template (Informational / Good)

**What the app-center did:**
Added a utility in `src/lib/utils.ts` (or similar) that converts `ApiClientError` from the access-management SDK into a user-facing string, with localized fallback messages.

**Assessment:**
Well-structured. No framework equivalent. The app-center correctly owns this since it's domain-specific to the access-management API. Not a divergence — documenting as a good pattern.

---

### Finding 10 — `lib/errors.ts` dropped, ad-hoc error handling (Medium)

**Template prescribes:**
`src/lib/errors.ts` provides typed helpers for catching and rendering `IgrpConfigError` and other framework errors at the layout level, giving error boundaries a structured diagnosis instead of a raw stack trace.

**App-center does:**
Dropped this file. Server actions use `console.error` + `return { success: false, error: '...' }`. Layout-level framework errors (config errors, auth config errors) have no dedicated handler — they'll surface as unhandled exceptions to the nearest `error.tsx`.

**Fix:**
Restore `src/lib/errors.ts` from the template. Wire it into the root error boundary and the IGRP layout error handler.

---

### Finding 11 — `[...not-found]/page.tsx` catch-all instead of `not-found.tsx` (Low)

**Template prescribes:**
`not-found.tsx` at the app root, triggered by calling `notFound()` from any route. This is the Next.js-idiomatic pattern.

**App-center does:**
Uses `src/app/[...not-found]/page.tsx` — a catch-all route that renders a 404 UI for any unmatched path. This works but bypasses Next.js's `notFound()` mechanism, meaning programmatic `notFound()` calls from server components will render the root `not-found.tsx` (if it exists) or a generic Next.js 404 page, not this custom UI.

**Fix:**
Replace the catch-all route with a proper `src/app/not-found.tsx`. If the catch-all was added to handle a specific routing edge case, document why.

---

## Appendix — App-center additions beyond template (not findings, just inventory)

These are intentional app features with no template equivalent. Not divergence — documented for completeness.

| Addition | Purpose |
|----------|---------|
| `src/features/applications/` | Application CRUD, cards, forms |
| `src/features/users/` | User management, roles, invite flow |
| `src/features/departments/` | Hierarchical department tree |
| `src/features/menus/` | Menu type selector, mapper, schemas |
| `src/features/roles/` | Role schemas |
| `src/features/files/` | MinIO file upload/download |
| `src/components/` | 12 shared UI primitives (dialogs, upload, page-header) |
| `src/actions/access-client.ts` | Per-action API client config (see Finding 3) |
| `@dnd-kit/*` | Drag-and-drop (installed, partially used) |
| `@tanstack/react-table` + `react-virtual` | Data table with virtualization |
| `nanoid` | Client-side ID generation |
| Invitation flow (`/invite/`, `/invite/accept/`) | User onboarding pages |
| Settings pages (`/settings/applications`, `/users`, `/departments`) | Admin management UI |
