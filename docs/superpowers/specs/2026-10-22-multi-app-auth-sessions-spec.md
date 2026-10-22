# Multi-App Auth Sessions: Spec

**Status:** draft, not planned · **Scope:** `framework-next-auth`, `framework-next`, `framework-next-ui`, `templates/demo-v1` · **Companion specs:** AM API `access-management-api/plans/sso-session-logout-cascade/requirements.md`, AM client `packages/client/docs/specs/2026-10-22-session-client-alignment.md` · **Builds on:** the basePath cookie scoping in `framework-next-auth/src/cookies.ts`

## Problem Statement

The target deployment is several template-based apps on one host: an Application Center at `/` and apps under `/apps/a`, `/apps/b`, all signing in through Access Management (AM). Sign-in already carries across apps: each app keeps its own session cookie, and `/login` tries a silent `prompt=none` sign-in that succeeds while AM's browser session is alive. Logout and session loss do not carry across, and a review of the cookie policy found defects that only show up in this shape.

- **Logout ends one app, not the user's sign-in.** AM revokes only the session of the app that logged out. Every other app keeps a valid local session. Fixing this server-side is the AM API spec. This spec covers what the apps can do on their own in the same browser.
- **An app notices a dead session late and handles it badly.** When AM answers `401 session_revoked`, `fetchMenus` / `useApplications` / `useUser` redirect to `/login` but leave the NextAuth cookie valid. The middleware keeps admitting the user to pages that fail on their next AM call.
- **403 is treated as "sign in again".** The same handlers send a 403 to `/login`. A user without access to app B goes `/login` → silent sign-in → B → 403 → `/login`, then sees the form for 60 s, signs in, and lands on the 403 again.
- **Marker cookies lose `Secure` handling over plain HTTP.** `logout-pending.ts` and `silent-sso.ts` add `Secure` when `NODE_ENV === "production"`. A production build served over HTTP on a non-localhost host drops both cookies. Without the logout marker, `LogoutCompletion` never runs: the IdP session ends but the local session survives and its refresh token is never revoked.
- **Token recovery can read another app's cookie.** `recoverAccessTokenFromCookies` (`framework-next/src/lib/permissions.ts`) falls back to `getToken`'s stock cookie name when this app's own cookie is absent. NextAuth collects every cookie whose name *starts with* that name, so a Server Action in `/apps/a` can decode the Center's `next-auth.session-token~` (sent at `Path=/`). With a shared `NEXTAUTH_SECRET` it decodes, and `requireSession()` passes with the Center's token.
- **Secure-name detection reads every app's cookies.** `resolveSecureCookie` returns `true` for any `__Secure-next-auth.session-token*` in the jar, including the Center's. An app whose own cookies are unprefixed then looks for a `__Secure-` name it never wrote and loops to `/login`, while `getServerSession` (which uses the configured names) still sees a valid session.
- **An idle tab cannot tell its AM session ended.** Detection waits for the next AM call or refresh, up to the 1 h access-token lifetime.

## Solution

Two phases.

- **Phase 1 (no AM dependency):**
  - Fixes 1–3: marker cookies decide `Secure` from the page's protocol; token recovery never falls back to a cookie it did not write; secure-name detection looks only at this app's names.
  - A 401 from AM ends this app's local session and returns the user to `/login`, where silent sign-in can restore it.
  - A 403 from AM renders the forbidden page.
  - A host-wide logout signal: an explicit logout in any app ends every other app's session **in the same browser** on its next request.
- **Phase 2 (needs the AM client's `checkSession()`):** the session watcher checks the AM session when a tab regains focus, so an idle tab notices a revoked session (including a cascaded logout from the AM API spec) without waiting for an AM call.

## User Stories

1. As a user, I want signing out of any app to sign me out of every app on the host in this browser, so that a shared computer does not stay signed in to the apps I did not close.
2. As a user, I want to move between apps without signing in again. (Already true; must stay true.)
3. As a user who signed out and back in, I want the other apps to rejoin my new sign-in silently, so that a re-login does not cost one click per app.
4. As a user without access to an app, I want a "no access" page, so that I am not bounced through sign-in forever.
5. As a user whose session was revoked, I want the app to send me to sign-in on my next action, not show broken screens.
6. As a user returning to an idle tab, I want it to notice my session ended elsewhere before I act on stale data.
7. As an operator running a production build over plain HTTP on an internal host, I want logout and silent sign-in to work, so that the deployment's scheme does not silently break them.
8. As an operator co-hosting apps with a shared `NEXTAUTH_SECRET`, I want no app to ever authenticate with another app's cookie, so that path scoping actually isolates sessions.
9. As an operator with mixed `NEXTAUTH_URL` schemes across apps, I want each app to read only its own cookie name, so that one app's `__Secure-` cookie cannot put another into a login loop.

## Implementation Decisions

### Phase 1

- **Fix 1, marker cookie `Secure` (template):**
  - `markLogoutPending`, `clearLogoutPending` and `markSilentSsoTried` decide `Secure` from `window.location.protocol === "https:"`. All three run only in the browser, where the page's own protocol is exactly what the browser checks.
  - Their `cookiePath()` copies are replaced by `basePathCookiePath` from `@igrp/framework-next-auth/cookies`.
- **Fix 2, no foreign-cookie fallback (`framework-next`):**
  - `scopedCookieNameOption` keeps its "decided from the jar" design. It falls back to `getToken`'s derived name only when a cookie named **exactly** the stock name, or a `.N` chunk of it, is present.
  - With neither this app's scoped name nor an exact stock name in the jar, `recoverAccessTokenFromCookies` returns `''` without calling `getToken`. `requireSession()` then refuses as it does today for "no session".
  - `cookieIsolation: 'none'` keeps working, because its cookie is exactly the stock name.
- **Fix 3, own-name secure detection (`framework-next-auth/cookies`):**
  - `resolveSecureCookie(cookieNames, basePath?)` gains an optional `basePath`. When given (including `''`), only names that start with this app's own `sessionCookieName(basePath, false)` or `sessionCookieName(basePath, true)` count.
  - When omitted, it behaves as today. This keeps `cookieIsolation: 'none'` and external callers unchanged.
  - Callers pass `basePath`: `getTokenFromRequest` and `getAccessToken` in `config.ts` (only when `authCookies` is set), and `recoverAccessTokenFromCookies` in `permissions.ts`.
- **401 from AM (`framework-next` + template):**
  - One shared helper replaces the three copies in `use-menus.ts`, `use-applications.ts` and `use-user.ts`. Any 401 redirects to `/login?reason=session_ended`, keeping a sanitized `callbackUrl`.
  - Any 401 is enough: `session_revoked`, `session_expired`, `tokens_invalidated` and a plain expired JWT all mean the same thing to the app, namely that this token is finished. The reason is logged, not branched on.
  - An app whose login page does not handle `reason` (not yet migrated) just shows its login page, which is today's behaviour.
  - A render cannot clear cookies, so the clearing happens on `/login`. When `reason=session_ended` is present, the login page renders a `SessionEndedCompletion` client component.
  - `SessionEndedCompletion` runs `signOut({ redirect: false })` (a POST with CSRF, which fires `events.signOut` and revokes the refresh token), then reloads `/login` without `reason`. Unlike `LogoutCompletion`, it does **not** call `markSilentSsoTried()`.
  - So if AM's browser session is still alive (the app's own session idled out, say), the reload signs the user straight back in. If it is not alive, the form is shown.
  - The existing silent-sign-in guard covers loops: `SilentSignIn` marks the attempt before it runs. A second `session_ended` within 60 s therefore shows the form instead of trying again.
- **403 from AM (`framework-next`):**
  - The same helper calls `forbidden()` from `next/navigation` instead of redirecting.
  - `igrpAssertAuthorize` already depends on `experimental.authInterrupts`, so this adds no new consumer requirement. The template's `(igrp)/forbidden.tsx` renders.
- **Host-wide logout signal (`framework-next-auth` + template):**
  - **Cookie:** `igrp.logout-at` (exported as `HOST_LOGOUT_COOKIE` from `./cookies`). `Path=/`, deliberately not basePath-scoped. `HttpOnly`, `SameSite=Lax`, `Max-Age` 30 days (NextAuth's longest default session), value = unix seconds.
  - **Writer:** a template server action `markHostLogout()`. `LogoutCompletion` calls it after `signOut` succeeds, and the no-IdP fallback branch of the logout page calls it too.
    - It is written on the **server** so the timestamp comes from a server clock, the same kind of clock that stamps `authTime`. A browser clock running ahead of the server would otherwise sign out every fresh re-login until it caught up.
    - `Secure` comes from `igrpIsSecureRequest(await headers())` (`framework-next/i18n`), already the framework's single rule for forwarded HTTPS. In a server action it falls back to `origin`.
    - The action is safe to expose: the worst a forged call does is sign the caller's own browser out of every app.
  - **`authTime` claim:** set in the `jwt` callback's sign-in branch (`account` present, silent sign-in included), as unix seconds, and carried unchanged through refresh. It is not in `session-store`'s `STORED_FIELDS`, so it stays in the cookie and Edge middleware can read it with no store change.
  - **Reader:** a new instance method `auth.isEndedByHostLogout(token, request)` returns `true` when `igrp.logout-at` is present and `token.authTime` is missing or `<= logoutAt`.
    - A token minted before this release has no `authTime`. Its user signs in once more, and only when a logout signal exists.
    - The template middleware treats `true` like an expired token: redirect to `/login?reason=session_ended`, which clears the local session and allows silent sign-in.
    - After a logout the IdP session is gone too, so the form is shown. After a logout-then-login in another app, the user rejoins silently.
  - `igrpDeleteAuthCookies` and `staleAuthCookies` must never touch `igrp.logout-at`.
  - App servers on one host must keep their clocks in sync (NTP). A few seconds of skew is harmless.
- **Template migration:** `75-…` writes the changed template files (`lib/logout-pending.ts`, `lib/silent-sso.ts`, `middleware.ts`, `(auth)/login/page.tsx`, the new completion component and server action) and bumps the framework dependencies. Run `sync:template-lock` afterwards.
- **Release:** `patch` changesets for `framework-next-auth` and `framework-next`, built in dependency order.

### Phase 2

- **Prerequisite:** the AM client release with `checkSession()` and without `initializeSession()` / `rotateSession()` (companion spec).
- Bump `@igrp/platform-access-management-client-ts` in `framework-next` and `framework-next-types`.
- Delete the `rotateSession` entry in `SESSION_CLIENT_TRAPS` (`framework-next/src/lib/api-client.ts`) and its test. `guardSessionClient` already skips missing methods.
- A new server action `igrpCheckAccessSession()` (`framework-next`) returns `{ valid, reason }`, or `{ valid: true }` under auth bypass and when AM is unreachable. An outage must never sign users out.
- `IGRPSessionWatcher` (`next-ui`) calls it on `visibilitychange` to visible, at most once per 60 s. `valid: false` navigates to `/login?reason=session_ended`.
- `next-ui` sits below `framework-next` in the dependency order, so the watcher cannot import the action. It takes it as an optional `checkSession` prop, threaded through `IGRPNestedProviders`. `IGRPRootLayout` passes `igrpCheckAccessSession`, the same server-action-as-prop pattern as `IGRPLocaleSwitcher action={setLocale}`. With no prop, the watcher behaves as today.
- **Release:** `patch` changesets for `framework-next-ui`, `framework-next` and `framework-next-types`.

## Testing Decisions

- **What a good test is:** behaviour through a public seam (an exported function's result, the `Set-Cookie` on a response, the redirect a handler throws), never internals.
- **Seams:**
  - `framework-next-auth`: `resolveSecureCookie`, `sessionCookieName`, the `jwt` callback through `withIGRPAuth`, and `auth.isEndedByHostLogout`.
  - `framework-next`: `recoverAccessTokenFromCookies` through `igrpEnsureAccessClientConfig`, the 401/403 helper through `fetchMenus`, and `igrpCheckAccessSession`.
  - `framework-next-ui`: `IGRPSessionWatcher` with a mocked `checkSession` prop.
- **Prior art:** `cookies.test.ts`, `secure-cookie-name.test.ts` and `config.test.ts` (next-auth); `permissions-basepath-cookie.test.ts`, `permissions-action-context.test.ts` and `api-client.test.ts` (next).
- **Edge cases that must be covered:**
  - Fix 2: a jar holding only another app's `next-auth.session-token~` returns no token; a jar holding exactly `next-auth.session-token` (isolation `'none'`) still decodes; a jar with `next-auth.session-token.0` + `.1` still decodes.
  - Fix 3: a jar with the Center's `__Secure-next-auth.session-token~` and this app's plain scoped cookie resolves `false`; with no own cookie it resolves `undefined`.
  - 401 → redirect carries `reason=session_ended` and the sanitized `callbackUrl`; 403 → `forbidden()`; 5xx and timeouts still throw to the error boundary.
  - Host logout: a token with `authTime` before, equal to and after `logout-at`; a token without `authTime`, with and without the cookie.
  - `authTime` survives a refresh unchanged and is set again on a silent sign-in.
  - `igrpCheckAccessSession` returns `valid: true` when AM times out; the watcher calls it at most once per 60 s.
- **Manual check, once per phase:** the Center plus two apps on one host behind a proxy, over HTTPS. Sign in, move between apps, sign out of one, and check the others.

## Out of Scope

- **Logout across browsers and across apps server-side.** That is the AM API spec (SSO-session link + logout cascade). Once it ships, Phase 1's 401 handling and Phase 2's focus check are how the apps notice; no further framework change is needed.
- **OIDC back-channel and front-channel logout.** Back-channel needs an OP feature AM does not have. Front-channel needs framing, which the apps forbid (`X-Frame-Options: DENY`), and SameSite=Lax cookies are not sent in cross-site iframes.
- **Keeping access and ID tokens out of the browser session.** `callbacks.session` exposes `accessToken` and `idToken` to client JavaScript. That deserves its own spec: `next-ui`'s live-claims resolution reads `accessToken` in the browser.
- **Enforcing the CSP** (today report-only).
- **Subdomain deployment.** Recommended when apps differ in trust level, but it needs no framework change.

## Further Notes

**Verified facts** (framework `development`, AM client `0.2.0-beta.20`, AM API `development`, 2026-10-22):
- AM's 401 body is `{"error":"invalid_token","error_description":"session_revoked"}`, and `ApiClientError.details` keeps it.
- Access-token TTL is 3600 s. The AM session slides by `max(1800, 3600 + 300)` s per refresh, with an absolute limit of 28800 s from each app's own sign-in.
- AM's `JSESSIONID` is `SameSite=Lax; Secure; HttpOnly`. RP-initiated logout clears AM's browser session only when the app and AM are same-site: it works for `demoigrp.nosi.cv` / `api-demoigrp.nosi.cv`, but not for `localhost` against a remote AM. Document this for developers testing logout locally.

**Open question:** what does `GET /api/users/me/applications/{code}/menus` return for an app the user is not assigned to: 403 or an empty list? An empty list makes the 403 change moot for that case.

**Configuration checklist for a co-hosted deployment** (docs only, no code):
- One `NEXTAUTH_SECRET` per app.
- The same `https://` scheme in every `NEXTAUTH_URL`.
- `IGRP_SESSION_STORE_URL` set in every app.
- `IGRP_SESSION_MAX_AGE=28800`.
- The same framework release in every app.
- Preferably one OAuth client per app.
