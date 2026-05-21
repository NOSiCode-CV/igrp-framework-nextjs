# Auth Improvements Design

**Date:** 2026-05-05
**Scope:** `packages/framework/next-auth` + `templates/demo-legacy`
**Reference:** [Next.js 15 Authentication Guide](https://nextjs.org/docs/15/app/guides/authentication)

## Background

A review of the project's authentication implementation against the Next.js 15 authentication guide identified four gaps:

1. OIDC tokens are not revoked when a user logs out.
2. No Data Access Layer (DAL) exists — auth checks are scattered across layouts and server actions.
3. Deprecated provider names (`keycloak`, `autentika`, `oauth2`) still appear in framework comments and error messages.
4. When the refresh token expires or fails, the client does not react immediately — the user stays on the current page until their next navigation triggers middleware.

The improvements are independent and non-breaking. `templates/demo-legacy` is the canonical (and only) reference template.

---

## Improvement 1 — Token Revocation on Logout

### Problem

`logout/page.tsx` calls `signOut({ redirect: false })`, which clears the NextAuth cookie. However, the OIDC provider's tokens (access + refresh) remain valid until their natural expiry. An intercepted token can be replayed against the provider.

The framework already has `revokeOidcSession()` in `packages/framework/next-auth/src/oidc.ts` — it is simply never called.

### Current flow

```
logout/page.tsx → signOut() → NextAuth clears cookie
                              ↑ OIDC token still alive on provider
```

### New flow

```
logout/page.tsx → signOut() → NextAuth events.signOut callback
                                → revokeOidcSession(token) [fire-and-forget]
                                → on failure: log error, do not throw
                              → NextAuth clears cookie → done
```

### Design decisions

- **Non-blocking.** Revocation failure (network error, provider doesn't support it, token already expired) must never prevent logout from completing. The call is fire-and-forget; errors are logged via the existing `reportError()` pattern.
- **Wired in `withIGRPAuth()`** via the NextAuth `events.signOut` callback. No template changes required — all consumers get it automatically.
- **Skipped when auth is bypassed.** If `AUTH_PROVIDER=none` or `IGRP_PREVIEW_MODE=true`, there is no real token to revoke; the callback exits early.
- **No new env vars, no breaking changes.**

### Files affected

| File | Change |
|---|---|
| `packages/framework/next-auth/src/config.ts` | Add `events.signOut` callback inside `withIGRPAuth()` that calls `revokeOidcSession()` non-blocking |
| `packages/framework/next-auth/src/oidc.ts` | No logic change; `revokeOidcSession()` already exists |

---

## Improvement 2 — Data Access Layer (DAL)

### Problem

Auth verification is spread across multiple files in `demo-legacy`:

- `src/app/(igrp)/layout.tsx` — checks `session === null`, redirects to login
- `src/actions/igrp/layout.ts` — calls `auth.getAccessToken()` directly
- `src/actions/igrp/auth.ts` — re-exports `serverSession()` / `getSession()`

There is no single authoritative place to say "this data requires an authenticated user." The Next.js 15 guide identifies this as the most important authorization pattern: security checks should live as close to the data as possible, backed up by (not replaced by) middleware.

### Design

New file: `templates/demo-legacy/src/lib/dal.ts`

**`verifySession()`**
- Wrapped in React `cache()` — executes once per request regardless of how many server components call it.
- In normal mode: calls `getSession()` from `src/lib/auth.ts`; throws `redirect('/login')` if null.
- In preview/bypass mode: returns the mock session from `configLayout()` — consistent with existing behaviour.
- Return type: the full verified session (internal use only).

**`getAuthenticatedUser()`**
- Calls `verifySession()` internally.
- Returns a **DTO** — only the fields UI components need:
  ```ts
  { id: string; name: string; email: string; accessToken: string }
  ```
- Never exposes refresh token, internal error flags, or raw JWT claims to components.

### What changes in the template

| File | Change |
|---|---|
| `src/lib/dal.ts` | **New** — `verifySession()` + `getAuthenticatedUser()` |
| `src/app/(igrp)/layout.tsx` | Replace direct `session === null` guard with `verifySession()` from DAL |
| `src/actions/igrp/layout.ts` | `configLayout()` uses `verifySession()` from DAL instead of calling `auth.getAccessToken()` directly |

### What does NOT change

- Middleware remains an optimistic check (cookie read only, no DB). This is correct per the guide.
- `src/lib/auth.ts` is unchanged — DAL imports from it, not the reverse.
- Preview mode behaviour is preserved — `isAuthBypass()` check inside `verifySession()`.

### Architecture after change

```
Middleware (optimistic)     → fast cookie check, redirects obvious unauthenticated requests
DAL verifySession() (secure) → authoritative check, called by layouts + server actions
getAuthenticatedUser() (DTO) → filtered data, safe to pass to any server component
```

---

## Improvement 3 — Stale Provider Env Var Cleanup

### Problem

`packages/framework/next-auth/src/providers.ts` still references deprecated provider aliases (`keycloak`, `autentika`, `oauth2`) in code comments and the `Unsupported AUTH_PROVIDER` error message. The runtime already rejects these values. The stale references cause confusion for developers reading the source.

### Changes

| File | Change |
|---|---|
| `packages/framework/next-auth/src/providers.ts` | Remove deprecated provider name references from comments; update error message to list only `"igrp-auth"` and `"none"` as valid values |
| Any other comments/docs in the package | Remove references to `KEYCLOAK_*`, `AUTENTIKA_*`, `OAUTH2_*` if present |

`templates/demo-legacy/.env.example` is already clean — no changes needed there.

---

## Improvement 4 — Client-Side Forced Logout on Refresh Failure

### Problem

When the OIDC refresh token expires or the refresh call fails, the server sets `forceLogout: true` on the session JWT. The middleware correctly catches this on the **next navigation** and redirects to `/login`.

However, if the user is sitting idle on a page (no navigation), nothing reacts to `forceLogout: true` until they click something. The user sees a stale, expired session displayed in the UI with no indication they have been logged out.

### How sessions reach the client

`<SessionProvider>` (wired inside `IGRPRootProviders` in `framework-next-ui`) polls `GET /api/auth/session` every 5 minutes (`refetchInterval: 300`). Each poll returns the current session object, including any `forceLogout` or `error` fields set by the JWT callback.

### Design

Add a watcher inside `useSafeSession()` in `packages/framework/next-ui` that reacts to the session error state:

```
useSafeSession() watches session.forceLogout === true
                        OR session.error === 'RefreshAccessTokenError'
  → call signOut({ callbackUrl: '/login' }) immediately
  → user is redirected to /login without needing to navigate
```

**Key decisions:**

- **Wired in `useSafeSession()`** — this hook is already used throughout the framework's client components. One change covers all consumers.
- **Triggers on the next poll at most.** The 5-minute refetch means a user could sit with an expired session for up to 5 minutes before the client detects it. This is acceptable — the next poll fires the reaction. If faster detection is needed, `refetchInterval` can be lowered (separate concern).
- **Skipped in preview/bypass mode.** `useSafeSession()` already knows the auth context; no forced logout when `AUTH_PROVIDER=none` or `IGRP_PREVIEW_MODE=true`.
- **No new env vars, no breaking changes.**

### Flow after change

```
Refresh token expires
  → JWT callback sets forceLogout: true on session
  → client polls /api/auth/session (within 5 min)
  → useSafeSession() detects forceLogout: true
  → calls signOut({ callbackUrl: '/login' })
  → user redirected to /login immediately
```

### Files affected

| File | Change |
|---|---|
| `packages/framework/next-ui/src/...` (wherever `useSafeSession` is defined) | Add `useEffect` watching `session.forceLogout` / `session.error`, call `signOut()` when triggered |

---

## Out of Scope

- **NextAuth v4 → Auth.js v5 migration.** Breaking change, significant effort, separate initiative.
- **Database-backed sessions.** JWT stateless sessions are correct for this use case.
- **Role-based access control (RBAC) in DAL.** Out of scope for this improvement; RBAC belongs in a future iteration once the DAL foundation exists.
- **`templates/demo` changes.** This template was removed from the monorepo; only `templates/demo-legacy` remains.

---

## Dependency order

These four improvements are independent and can be implemented in parallel. If sequenced:

1. Improvement 3 (doc cleanup) — no risk, do first
2. Improvement 1 (token revocation) — framework change, needs changeset
3. Improvement 4 (client forced logout) — framework change, needs changeset; can run parallel to #2
4. Improvement 2 (DAL) — template change, after framework build passes
