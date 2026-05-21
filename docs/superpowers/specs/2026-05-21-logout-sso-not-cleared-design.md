# Logout — SSO session not cleared on IGRP server — Design Spec

**Date:** 2026-05-21
**Status:** Draft
**Scope:** `packages/framework/next-auth`, `templates/demo-legacy`
**Supersedes (extends):** `2026-05-15-logout-oidc-fix-design.md`

---

## Problem

When a user clicks logout in `templates/demo-legacy`, the **local NextAuth session cookie is cleared** but the **SSO session on the IGRP Access Management server is not**. Effects:

- Re-visiting `/login` and clicking Sign In immediately auto-completes the OIDC flow against `api-demoigrp.nosi.cv` without prompting for credentials (proof that the SSO session survived).
- The refresh token presented to the IGRP server is **not revoked**, leaving a usable long-lived credential after the user thought they were logged out.

The fix from `2026-05-15-logout-oidc-fix-design.md` (build `end_session_endpoint` URL even without `idToken`; preserve `idToken` across refreshes with `||`) **is applied** in the current tree. Logout still doesn't terminate the SSO session, so this is a **second-layer issue**, not a regression of the 2026-05-15 fix.

---

## Evidence

### Server capability (verified via discovery doc)

`https://api-demoigrp.nosi.cv/igrp-access-management/.well-known/openid-configuration` advertises:

| Endpoint | URL |
|---|---|
| `end_session_endpoint` | `https://api-demoigrp.nosi.cv/igrp-access-management/connect/logout` |
| `revocation_endpoint` | `https://api-demoigrp.nosi.cv/igrp-access-management/oauth2/revoke` |
| `introspection_endpoint` | `https://api-demoigrp.nosi.cv/igrp-access-management/oauth2/introspect` |
| `revocation_endpoint_auth_methods_supported` | `client_secret_basic, client_secret_post, client_secret_jwt, private_key_jwt, tls_client_auth, self_signed_tls_client_auth` |

So **server support for RP-initiated logout and token revocation is present**. Failure is on the client side, in the issuer's session-clearing behavior, or in client registration.

### Server identification: Spring Authorization Server

The endpoint path layout (`/oauth2/{authorize,token,par,jwks,revoke,introspect}` + `/connect/logout` + `/oauth2/par` for PAR) is the **signature shape of Spring Authorization Server** (Spring Security project). This identification matters because Spring AS's logout endpoint (`OidcLogoutEndpointFilter`) has specific documented behavior:

- **`id_token_hint` is effectively required.** Without it, Spring renders an HTML "Do you want to log out?" confirmation page and does **not** clear the session until the user clicks. Programmatic redirect via `window.location.replace` lands the user on that confirmation page, not back on `/login`.
- **`client_id` must match** the `aud` claim of `id_token_hint` if both are present.
- **`post_logout_redirect_uri` must exactly match a registered URI** on the client. Mismatch → Spring returns 400 and refuses to clear the session.
- **On success** → 302 to `post_logout_redirect_uri` (with `state` echoed back if sent).

This converts H1 + H2 below from "generic OIDC concern" to "concrete documented behavior of this server."

### Discovery-doc anomalies worth noting

- **`scopes_supported: ["openid"]`** — only `openid`. The current `.env` requests `IGRP_AUTH_SCOPES=openid email`. Authorize requests with `email` succeed (login works), which means either (a) `email` is registered on the client without being in the global advertise list, or (b) Spring silently drops the unknown scope and the issued id_token is missing email/profile claims. Not a direct logout failure cause, but means the id_token may be sparser than expected. Treated separately in F6 below.
- **`code_challenge_methods_supported: ["S256"]`** — PKCE is supported but not required for confidential clients (which we are — `IGRP_AUTH_CLIENT_SECRET` is set). Earlier debug logs showed `checks: ['state']`, no PKCE. Not a logout issue, but if the client is ever switched to public (no secret), PKCE becomes mandatory.
- **No `frontchannel_logout_supported` / `backchannel_logout_supported` keys** — only `end_session_endpoint`. RP-initiated front-channel logout (the browser-redirect approach we already use) is the **only** mechanism the server exposes. Confirms back-channel logout is firmly out of scope.
- **`tls_client_certificate_bound_access_tokens: true`** — server can bind access tokens to TLS client certs. Not relevant to this flow (we don't use mTLS). Listed for completeness.
- **`id_token_signing_alg_values_supported: ["RS256"]`** — id_tokens signed RS256. NextAuth v4 validates via `openid-client` against `jwks_uri`. No concern.

### Client side — current flow (relevant code paths)

```
/logout page  (templates/demo-legacy/src/app/(auth)/logout/page.tsx)
├── getLogoutUrl(postLogoutRedirectUri)         ← server action
│   ├── auth.getAccessToken()                   ← reads JWT cookie (Node runtime)
│   ├── warns when token is null
│   ├── warns when token.idToken is missing
│   └── buildEndSessionUrl(token, env, postLogoutRedirectUri)
│       ├── providerId === 'none' → null
│       ├── fetch discovery doc
│       ├── no end_session_endpoint → null
│       └── build URL: client_id + post_logout_redirect_uri + id_token_hint (if present)
├── signOut({ redirect: false })                ← clears NextAuth cookie, fires events.signOut
│   └── events.signOut (config.ts)
│       └── void revokeOidcSession(token, env)  ← fire-and-forget, errors logged but swallowed
│           ├── no refresh_token → return
│           ├── no revocation_endpoint → return
│           └── POST refresh_token to /oauth2/revoke
└── window.location.replace(endSessionUrl)      ← browser hits IGRP /connect/logout
```

### What we know works and what's unverified

| Step | Evidence |
|---|---|
| `auth.getAccessToken()` returns a token | Login worked, cookie exists. ✓ |
| `token.idToken` is populated on initial sign-in | **Unverified.** Depends on whether IGRP returns `id_token` in the token response for the requested scopes. |
| `token.idToken` survives refresh | `oidc.ts:116` uses `\|\|` (2026-05-15 fix). ✓ for the refresh path. |
| `buildEndSessionUrl` returns a non-null URL | **Unverified at runtime.** Depends on `idToken` and discovery success. |
| `revokeOidcSession` POST succeeds | **Unverified.** Errors are caught and only `console.error`-logged on the server. |
| IGRP `/connect/logout` clears the SSO session when the URL is hit | **Unverified.** Could fail for: unregistered `post_logout_redirect_uri`, invalid/expired `id_token_hint`, client config requires a confirmation page. |
| IGRP `/oauth2/revoke` actually invalidates the refresh token | **Unverified.** Likely fine if 200 OK is returned, but we never inspect the response. |

---

## Hypotheses (ordered by likelihood)

### H1 — `post_logout_redirect_uri` is not registered on the IGRP client

The client `igrp-access-management` on `api-demoigrp.nosi.cv` must have the post-logout redirect URI **registered** (just like the OIDC callback URI must be registered). With `basePath=/apps/template` and `NEXT_PUBLIC_BASE_PATH` propagated through `/logout/page.tsx`, the URL the framework sends is:

```
post_logout_redirect_uri = http://localhost:3000/apps/template/login
```

If this exact URL is not registered, the IGRP server typically:
- Rejects the logout request (no SSO clear, no redirect), or
- Shows an error page on `connect/logout`, or
- Clears the session but redirects to a default URL (which may look like the user "lost" the redirect).

Verification: ask the IGRP admin (or check the OAuth client config UI) whether `http://localhost:3000/apps/template/login` is in the registered post-logout redirect URIs for client `igrp-access-management`. Symmetric concern to the OAuth callback URI registration the user already had to fix earlier.

### H2 — `token.idToken` is empty, server rejects logout without `id_token_hint`

Spring Authorization Server (which IGRP appears to be running based on the `/oauth2/*` endpoint shapes) **may require `id_token_hint`** to clear the session — without it, the server has no way to identify which session to terminate, so it either shows a confirmation page or silently no-ops.

The framework already handles refresh correctly (`||`), but the initial sign-in path stores `idToken` from `account.id_token`:

```ts
// packages/framework/next-auth/src/config.ts (jwt callback)
idToken: accountTyped.id_token,
```

If the OIDC token response from IGRP doesn't include `id_token` (e.g. because the requested scopes don't trigger one, or the client is configured with a non-OIDC `response_type`), then `idToken` is `undefined` from the moment the session is created. `buildEndSessionUrl` then omits `id_token_hint`, and IGRP refuses to clear the session.

The IGRP discovery doc advertises `scopes_supported: openid` (only). The current env requests `openid email` — `openid` alone is sufficient to get an `id_token`, so this *should* work. **Unverified at runtime.**

### H3 — `revokeOidcSession` errors are invisible

`config.ts:512-514` swallows revocation errors. If the IGRP `/oauth2/revoke` POST is failing (wrong auth method, network, 4xx response body), we never know — only a `console.error` line that's easy to miss. Even when end-session works, the refresh token would remain usable until it expires naturally.

This is the most likely silent failure: **the SSO session might be clearable via end-session, but the refresh token stays valid** because we never confirm the revoke succeeded.

### H4 — Browser race: `window.location.replace` fires before the NextAuth `signOut` POST is fully done

`logout/page.tsx`:

```ts
await signOut({ redirect: false });
clearTimeout(timeout);
if (endSessionUrl) {
  window.location.replace(endSessionUrl);
}
```

`signOut({ redirect: false })` resolves after the server POST to `/api/auth/signout` returns. That POST is what fires `events.signOut → revokeOidcSession`. **But** `revokeOidcSession` is fire-and-forget (`void`), so the network call to `/oauth2/revoke` may not have completed by the time we navigate the browser to the end-session URL. Browsers do **not** wait for in-flight `fetch()` calls before navigation — they're aborted.

Result: revocation request is started, then **aborted mid-flight** when the page navigates. The IGRP server may or may not have received and processed it.

### H5 — IGRP `/connect/logout` requires `POST`, not `GET`

OIDC RP-Initiated Logout 1.0 §3 specifies the IdP **must** accept `GET` (and optionally `POST`). Spring Authorization Server's `OidcLogoutEndpointFilter` accepts both. Likely fine, but worth flagging — `window.location.replace` is always a `GET`.

### H6 — `useSecureCookies` mismatch in dev

`config.ts:408` sets `useSecureCookies: process.env.NODE_ENV === 'production'`. In dev, cookies are non-secure. Local sign-out clears them fine. Not a likely contributor to *server-side* SSO not clearing, but listed for completeness.

---

## Diagnostic plan (Phase 1 — gather evidence before more fixes)

Add **explicit, visible** logging on every branch of the logout pipeline so we know which hypothesis applies. **No behavior changes** in Phase 1 — only observability.

### D1. Log the actual `endSessionUrl` and the inputs that built it

**File:** `packages/framework/next-auth/src/oidc.ts`, `buildEndSessionUrl`.

Currently returns `null` silently in two cases (`providerId === 'none'`, missing endpoint). Add `console.warn` for each, including the discovery URL that was consulted. Also, before returning the built URL, `console.debug` the URL and which of `id_token_hint`, `client_id`, `post_logout_redirect_uri` were set.

Dev-only (`if (env.NODE_ENV !== 'production')`).

### D2. Make `revokeOidcSession` outcome visible

**File:** `packages/framework/next-auth/src/oidc.ts`, `revokeOidcSession`.

Currently does `fetch(...)` and discards the response. Change to:

- Capture `response.status` and `response.ok`.
- Log on non-2xx: status + response body (text) so we can see what IGRP rejects.
- Return a tagged result: `{ ok: true } | { ok: false; reason: string; status?: number; body?: string }`.

Caller in `config.ts` `events.signOut`:

- Await the result (don't fire-and-forget) **and tie the await into a non-blocking promise that the `/api/auth/signout` handler can settle on**. NextAuth `events.signOut` is `async` — returning a promise from it actually delays the signout response, which gives our revoke a chance to complete before the browser navigates away.

This addresses **H3 + H4 simultaneously**.

### D3. Confirm `token.idToken` presence on signout

**File:** `packages/framework/next-auth/src/config.ts`, `events.signOut`.

Add a dev-mode `console.debug` showing `{ hasIdToken: !!token.idToken, hasRefreshToken: !!token.refreshToken, hasAccessToken: !!token.accessToken, authProviderId: token.authProviderId }`. This tells us at signout time whether the JWT actually has the fields needed for end-session + revoke.

### D4. Confirm what `getLogoutUrl` produced before the redirect

**File:** `templates/demo-legacy/src/app/(auth)/logout/page.tsx`.

Already has the right shape (calls `getLogoutUrl`, then `signOut`, then `window.location.replace`). Add a dev `console.log` of the `endSessionUrl` before the redirect so we can copy/paste it into the browser and see what IGRP actually does with it manually.

---

## Fix plan (Phase 2 — after diagnostics narrow the cause)

The matrix below is what we'll apply depending on what D1–D4 reveal. Each fix is independent; some may be combined.

### F1. Wait for revoke to finish before navigating to end-session (always)

**File:** `templates/demo-legacy/src/app/(auth)/logout/page.tsx`.

Sequence problem: `signOut({ redirect: false })` triggers the server-side `events.signOut`, which fires `revokeOidcSession` as fire-and-forget. The browser then navigates to `endSessionUrl`, aborting any in-flight revoke request.

Two options to remove the race:

**(F1a — Preferred)** Make `revokeOidcSession` blocking by returning it from the `events.signOut` handler. NextAuth awaits `events.signOut` before responding to the signout POST. The signout POST then returns only after the revoke is done, and only then does `await signOut({ redirect: false })` resolve client-side, only then do we navigate to end-session. Single source of truth for sequence, no client changes.

**(F1b — Fallback)** Call a server action `revokeRefreshToken()` from the logout page **before** `signOut()`, instead of via the NextAuth event. This decouples the revoke from signout entirely and makes the await explicit on the client.

Recommend F1a — it stays inside the framework and consumers get the correct behavior for free.

### F2. Defensive: always include `client_id`, also include `client_secret` if the revoke endpoint requires it

Already done — `buildEndSessionUrl` always sets `client_id`. `revokeOidcSession` sends `client_id` + `client_secret` in form body (matches `client_secret_post` auth method, which IGRP advertises as supported). No change unless logs from D2 show an auth-method rejection (in which case switch to `client_secret_basic` via the `Authorization` header).

### F3. Surface logout failures to the user (instead of silently landing on `/login`)

**File:** `templates/demo-legacy/src/app/(auth)/logout/page.tsx`.

Currently any error → `router.replace("/login")`. A user who fails to log out from the IdP has no way of knowing. Add:

- A query param on the fallback: `/login?logoutWarning=remote-session-active`.
- The login page reads this param and shows a non-blocking banner above the form: "Your local session was cleared, but you may still be signed in elsewhere — close your browser to fully sign out."

Optional; nice-to-have. Defer to a follow-up unless logs show this is a frequent path.

### F4. Verify and document `post_logout_redirect_uri` registration requirement

Not code — operations/docs:

- Add a line to `templates/demo-legacy/.env.example` stating: "After setting `NEXTAUTH_URL`, the `post_logout_redirect_uri = <NEXT_PUBLIC_BASE_PATH>/login` (e.g. `http://localhost:3000/apps/template/login`) must be **registered** on the IGRP auth server, alongside the OAuth callback URI."
- Add the same note to `templates/demo-legacy/README.md` in the env-setup section.

This is **H1** — the most likely silent server-side cause. We cannot fix it from code; we can only document it.

### F6. Align `IGRP_AUTH_SCOPES` with what the server advertises

**File:** `templates/demo-legacy/.env` (and `.env.example` guidance).

Current: `IGRP_AUTH_SCOPES=openid email`. Server's `scopes_supported` is `["openid"]` only. The `email` scope either is registered on the client without being advertised globally, or is being silently dropped by Spring AS.

- **Cheap test:** decode the current id_token at jwt.io. If it has no `email` claim, scope was dropped — change `.env` to `IGRP_AUTH_SCOPES=openid` to match reality.
- **If email claim is wanted:** ask the IGRP admin to register `email` (and possibly `profile`) as scopes on the `igrp-access-management` client config, then leave them in `.env`.

Not a direct fix for the SSO-not-cleared symptom, but worth doing in the same pass — a sparser-than-expected id_token is a latent surprise.

### F5. (If logs show `idToken` is missing on initial sign-in) — request additional scopes

If D3 reveals `hasIdToken: false` at signout time even on a fresh login, the IGRP token response didn't include `id_token`. Possible mitigations:

- Confirm `IGRP_AUTH_SCOPES=openid` is sufficient on this specific client config (it should be, per OIDC spec).
- Try `IGRP_AUTH_SCOPES=openid profile email` and re-test.
- If still empty, check that the client `igrp-access-management` is configured as an **OIDC** client (not OAuth2-only) on the IGRP admin side.

---

## Acceptance criteria

A. Click logout in `templates/demo-legacy` while signed in.
B. Server log shows:
   - `[oidc.buildEndSessionUrl] returning URL: …/connect/logout?client_id=…&post_logout_redirect_uri=…&id_token_hint=…`
   - `[oidc.revokeOidcSession] revoke returned 200` (or another success indicator).
C. Browser navigates to the IGRP end-session URL, IGRP responds with 302 back to `http://localhost:3000/apps/template/login` (verify in DevTools Network tab).
D. Visit `/apps/template/login` again, click Sign In:
   - Expected (logout actually worked): IGRP shows the credential form. Re-authentication required.
   - Symptom (logout still broken): IGRP auto-redirects with a fresh code without prompting. **This case means the SSO session was NOT cleared and we need to revisit H1/H2.**
E. After logout, attempt to use the previous refresh token directly against `/oauth2/token` with `grant_type=refresh_token` (curl or Postman). Expected: 400 `invalid_grant`. If 200 with new tokens, revoke didn't actually invalidate it — back to H3.

---

## Out of scope

- Back-channel logout (OIDC Back-Channel Logout 1.0, requires the IdP to POST a logout token to a registered logout URI on every RP).
- Single Sign-Out across multiple RPs (multi-app SSO logout coordination).
- Migrating to NextAuth v5 / Auth.js.
- Changes to `templates/demo` (already removed from the monorepo).
- Front-channel logout iframe handling.

---

## Affected packages and dependency-order implications

| Package | Change | Build needed? |
|---|---|---|
| `@igrp/framework-next-auth` (D1, D2, F1a) | `oidc.ts`, `config.ts` | `pnpm build:auth` then `pnpm build:framework` (root package — downstream rebuilds) |
| `templates/demo-legacy` (D4, F3, F4) | `app/(auth)/logout/page.tsx`, `.env.example`, `README.md` | Template-local, no package rebuild |

Per `.claude/shared/hard-rules.md`: changes in `@igrp/framework-next-auth` are publishable → require a `patch` changeset.

---

## Implementation order

1. **Phase 1 — Diagnostics** (D1–D4). Land all four in one branch. No behavior change. Rebuild framework, restart dev, **collect a fresh round of logout logs from the user**.
2. **Decide on fixes** based on what the logs show. Choose from F1/F2/F3/F5.
3. **Phase 2 — Fixes**. Land selected fixes. Verify against acceptance criteria.
4. **F4** (documentation) lands regardless — `post_logout_redirect_uri` registration is a real prerequisite that must be in the setup docs.
5. **Changeset** (`patch`, `@igrp/framework-next-auth`) once Phase 2 lands.

---

## Risks

- **Diagnostic logs may leak token fields.** D3 logs booleans only (`hasIdToken`) — never the token value. D1 logs the end-session URL which contains `id_token_hint` (the actual id_token JWT). That's sensitive. Gate behind `NODE_ENV !== 'production'` and document in the spec that staging logs should not be archived long-term.
- **F1a changes the timing of the signout response.** Could marginally slow the perceived "click logout" → "page change" latency (waiting for the revoke POST round-trip). Acceptable trade for correctness; revoke endpoint is local-network in production.
- **F4 alone might fix the symptom** if H1 is the actual cause. Worth a quick check with the IGRP admin before code work begins — if they confirm the post-logout redirect URI is not registered, just register it and re-test before touching code.

---

## Decision log

- **Why not Phase 1 + Phase 2 in one branch?** Keeping diagnostics separate lets us roll back the fix branch without losing observability. Diagnostics stay even after fixes ship — they protect against future regressions.
- **Why not migrate to back-channel logout?** Out of scope: requires IdP-side configuration plus a registered logout URI on every RP. Too large for the symptom we're chasing.
- **Why not just call `revokeOidcSession` directly from the logout page instead of `events.signOut`?** Considered (F1b). Rejected as primary because it splits the revoke logic across template and framework. F1a keeps everything in the framework.
