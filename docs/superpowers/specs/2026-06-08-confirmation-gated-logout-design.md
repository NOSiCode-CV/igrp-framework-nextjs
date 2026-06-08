# Confirmation-gated logout (Option A) — design

**Date:** 2026-06-08
**Scope:** `templates/demo-legacy` only (`@igrp/framework-next-template`)
**Files touched:** `src/app/(auth)/logout/page.tsx`, `src/app/(auth)/login/page.tsx`, a new `LogoutCompletion` client component, `src/middleware.ts`

## Problem

Today the logout page (`src/app/(auth)/logout/page.tsx`) runs the local NextAuth
`signOut()` **unconditionally and first**, before POSTing to the IdP
`end_session_endpoint`. This guarantees the local session is always torn down
even if the IdP hangs or errors.

The desired behavior is the opposite ordering: clear the local session **only
after the IdP confirms** the logout. The IdP end-session request is a top-level
cross-origin form POST — its response is never delivered back to app JS, so it
cannot be awaited. The only confirmation signal available is the IdP's redirect
back to `post_logout_redirect_uri` (`/login`).

Option A reinterprets "confirmation of the POST" as "the redirect-back landed on
`/login`", and defers the local `signOut()` to that landing. The known cost —
if the IdP never redirects back, the local session would persist — is closed by
a `logout_pending` cookie + middleware backstop.

## Non-goals

- No change to bypass mode (`IGRP_PREVIEW_MODE=true` / `AUTH_PROVIDER=none`).
  Bypass redirects `/logout` → `/` and never reaches the IdP-POST path.
- No change to the `getLogoutUrl()` server action.
- No iframe-based confirmation (fragile: framing blocked, third-party cookies,
  `load` fires on errors). No OIDC back-channel logout (heavyweight; needs IdP
  support + server session store).

## Control flow

### Logout page (`src/app/(auth)/logout/page.tsx`)

1. `getLogoutUrl(buildLoginUrl())` runs **first**, while the session is still
   alive (`id_token_hint` needs the access/ID token). Unchanged. Still raced
   against `LOOKUP_TIMEOUT_MS`.
2. **If `endSessionUrl` exists** (the IdP round-trip path):
   - Set the `logout_pending` cookie (see below).
   - Render + auto-submit the end-session POST form to the IdP.
   - **Do NOT call `signOut()` here.** Teardown is deferred to `/login`.
3. **Else** (no token / IdP has no `end_session_endpoint` / lookup timed out):
   - Run `signOut({ redirect: false })` locally.
   - `hardNavigate(buildLoginUrl())`.
   - This is exactly today's fallback — unchanged. There is no round-trip to
     confirm, so there is nothing to defer.

Preserved invariants from the current page:

- `logoutStarted` module-scoped guard (one effect run per module lifetime).
- `settled` flag + `hardNavigate` "every exit path navigates away" invariant.
- `FALLBACK_TIMEOUT_MS` watchdog — now guards the cookie-set + form-submit path
  instead of a hung local `signOut()`. Still `> LOOKUP_TIMEOUT_MS`.
- All existing `[logout][client]` debug `console.log` lines kept consistent with
  the new branch ordering so the active logout-tracing branch still works.

### `logout_pending` cookie

- **Set** client-side immediately before the IdP POST:
  `logout_pending=1; path=<BASE_PATH || "/">; max-age=300; samesite=lax`
  plus `secure` in production.
- `SameSite=Lax` is required: the IdP redirect back to `/login` is a top-level
  GET navigation, and Lax sends the cookie on top-level GET navigations.
- `path` scoped to `NEXT_PUBLIC_BASE_PATH` (falling back to `/`) so it does not
  leak across apps sharing a domain.
- 300s TTL: long enough for the IdP round-trip, short enough to self-heal if the
  user abandons mid-flow.
- **Cleared** by `LogoutCompletion` on `/login` after `signOut()` completes
  (`max-age=0`, same path).

### `/login` landing — deferred teardown

`/login` (`src/app/(auth)/login/page.tsx`) stays a server component. It renders
a new client component `LogoutCompletion` that, on mount:

1. Reads `logout_pending` from `document.cookie`.
2. **Absent** → render nothing; normal login flow is untouched (a normal
   "session expired → /login" visit has no cookie).
3. **Present** → show `IGRPTemplateLoading`, call `signOut({ redirect: false })`,
   delete the cookie (`max-age=0`), then reveal the login form.

This is the point where `signOut()` finally runs — only after the IdP confirmed
by redirecting back. `/login` does not redirect authenticated users away (it
only redirects in bypass), so a still-locally-authenticated user landing here
does not loop.

### Middleware backstop (`src/middleware.ts`)

In the **real-auth path only** — after the bypass branch, and after
`isPublicPath(pathname)` returns (so `/login` and `/api/auth/*` are never
caught): if the request carries a `logout_pending` cookie, redirect to
`${BASE_PATH}/login` with **no** `callbackUrl`, regardless of token state.
`/login`'s `LogoutCompletion` then completes teardown and clears the cookie.

This catches the failure Option A introduces: IdP POST succeeded but the browser
never returned (hang / IdP error page / closed tab), the user comes back to a
protected route within the cookie TTL, and is forced through `/login` to finish
logout instead of being let in on a still-live session.

Placement detail: the check must run before the token check and must not apply
to `/login` (loop) or `/api/auth/*` (the client `signOut()` POSTs to
`/api/auth/signout`). `isPublicPath` already short-circuits both before this
point.

## Failure modes

| Scenario | Outcome |
|---|---|
| Happy path: IdP clears SSO, redirects to `/login` | `LogoutCompletion` runs `signOut`, clears cookie, shows form. |
| No `endSessionUrl` (token gone / no `end_session_endpoint` / lookup timeout) | Else branch: local `signOut` + navigate to `/login`. Same as today. |
| IdP POST sent, never redirects back; user returns within TTL | Middleware sees `logout_pending` → forces `/login` → teardown. |
| IdP never redirects back; user returns after TTL | Cookie expired; valid session lets them in. Accepted degradation (best-effort beyond the window). |
| Bypass mode | `/logout` → `/`; cookie never set; backstop never engages. |

## Testing / verification

Auth-critical middleware — verify with the dev server:

1. **Real-auth happy path:** log in, log out → IdP round-trip → land on `/login`,
   confirm session cookie is gone (e.g. visiting a protected route redirects to
   login).
2. **IdP-fails case:** simulate no redirect-back (or stop at IdP), reopen a
   protected route within TTL → middleware forces `/login` and teardown runs.
3. **Bypass mode** (`AUTH_PROVIDER=none`): `/logout` still redirects to `/`,
   no regression.
4. Confirm `[logout]` trace lines still print coherently through the new
   ordering.
