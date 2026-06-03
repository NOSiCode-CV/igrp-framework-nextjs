# Report — Logout does not return to the application (Spring AS `end_session_endpoint`)

> **Framing:** This is a **configuration issue on the IGRP/NOSi Spring Authorization
> Server**, not a defect in the Spring framework or in the relying-party (Next.js) code.
> Spring's refusal to redirect to an **unregistered** `post_logout_redirect_uri` is
> spec-compliant and intentional (OIDC RP-Initiated Logout 1.0, open-redirect defense).
> File this against the team that owns the auth-server client configuration.

- **Date:** 2026-06-02
- **Severity:** Medium (functional / logout UX — the SSO session *is* terminated; the
  browser just isn't returned to the app)
- **Component:** IGRP / NOSi Spring Authorization Server — OIDC RP-Initiated Logout
  (`/connect/logout`)
- **Reported by:** Fidel da Luz — IGRP Framework (Next.js template `demo-legacy`)
- **RP source:** `packages/framework/next-auth/src/oidc.ts`,
  `templates/demo-legacy/src/app/(auth)/logout/page.tsx`

## Environment (observed during repro)

| Field | Value |
|---|---|
| Issuer | `https://api-demoigrp.nosi.cv/igrp-access-management` |
| `end_session_endpoint` | `https://api-demoigrp.nosi.cv/igrp-access-management/connect/logout` |
| `revocation_endpoint` | `https://api-demoigrp.nosi.cv/igrp-access-management/oauth2/revoke` |
| Client ID | `igrp-access-management` |
| App origin + basePath | `http://localhost:3000/apps/template` |
| `post_logout_redirect_uri` sent | `http://localhost:3000/apps/template/login` |
| Access-token TTL | ~180s (`expires_at − iat`) |
| ID-token TTL | ~30 min |

## Observed behavior

On logout, the relying party clears its local NextAuth session, revokes the refresh
token (confirmed `200`), and navigates the browser to the Authorization Server's
`end_session_endpoint` with `client_id`, `post_logout_redirect_uri`, and a valid
`id_token_hint`. The Authorization Server terminates the SSO session correctly **but
stops on its own `…/connect/logout` page** instead of redirecting the browser back to
the application's login page.

## Expected behavior

After ending the session, the Authorization Server should redirect the browser to the
supplied `post_logout_redirect_uri` (the app's `/login`), per OIDC RP-Initiated Logout
1.0 §2.

## Evidence (captured from the dev server, secrets redacted)

The RP sends a complete, valid end-session request:

```
[oidc.buildEndSessionUrl] built URL {
  endSessionEndpoint:       'https://api-demoigrp.nosi.cv/igrp-access-management/connect/logout',
  hasClientId:              true,
  hasPostLogoutRedirectUri: true,
  postLogoutRedirectUri:    'http://localhost:3000/apps/template/login',
  hasIdTokenHint:           true        ← a valid id_token_hint IS present
}

[next-auth.events.signOut] token shape {
  hasIdToken: true, hasAccessToken: true, hasRefreshToken: true,
  authProviderId: 'igrp-auth', error: undefined
}
[next-auth.events.signOut] token revocation succeeded { ok: true, status: 200 }
```

The `id_token` was freshly issued at login (its `sid` matches the active session), so a
stale-`sid` mismatch is not a factor in this case.

## Root cause (confirmed)

**The `post_logout_redirect_uri` `http://localhost:3000/apps/template/login` is not
registered in the client's `postLogoutRedirectUris`.** All other prerequisites are
satisfied — `end_session_endpoint` exists, `client_id` is sent, a valid `id_token_hint`
is present (so Spring can resolve the client from the hint's `aud`), and revocation
succeeded. The only thing that makes Spring decline to redirect is an unregistered /
non-matching `post_logout_redirect_uri`, which it validates exactly (scheme, host, port,
basePath, trailing slash) before redirecting.

> Ruled out: missing `id_token_hint`, stale-`sid`, missing `end_session_endpoint`,
> failed revocation.

## Requested fix / configuration

1. **Add the exact application login URL(s) to the client's `postLogoutRedirectUris`**
   for client `igrp-access-management`:
   - Dev: `http://localhost:3000/apps/template/login`
   - Prod: the deployed equivalent (e.g. `https://<host><basePath>/login`)

   It must match byte-for-byte what the RP sends (see Evidence).

2. **(Robustness, not required for this repro)** Confirm the client **re-issues an
   `id_token` on the refresh-token grant** (Spring AS requires the `openid` scope on the
   refresh grant). With a ~180s access-token TTL, refreshes are frequent; if a refresh
   does not return a fresh `id_token`, the stored `id_token`'s `sid` goes stale and a
   *later* logout (after a refresh) can no-op even once #1 is fixed.

## Note on Spring's logout confirmation page

Depending on Spring AS version/configuration, `/connect/logout` may render a logout
**confirmation page** before redirecting. If that appears even after #1 is applied, it
is expected Spring behavior (the RP cannot suppress it); the redirect to
`post_logout_redirect_uri` should then occur after the user confirms.

## Not recommended (RP-side workarounds)

- **Hidden iframe / front-channel logout** to regain control after the IdP — unreliable
  due to CSP `frame-ancestors` / `X-Frame-Options` and `SameSite` cookie rules; Spring
  expects a top-level navigation with `id_token_hint`.
- **Local-only logout** (skip the IdP) — leaves the IdP SSO session alive, so the next
  login silently re-authenticates without a prompt. This is the opposite of a real
  logout.

## Unrelated observation

During the same session the access-management API returned
`IGRP_AUTH_APPLICATION_NOT_FOUND_BY_CODE` (404) for app code
`APP_DEMO_IGRP_FRAMEWORK` (menu load). Not related to logout, but flagged in case the
app-code registration is unexpected.
