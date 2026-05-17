# Issue Report: OIDC Provider — Redirect URI Registration Required

**Date:** 2026-05-17
**Reporter:** igrp-framework-nextjs / demo-legacy
**Target system:** `igrp-access-management` Authorization Server
**Client ID:** `igrp-access-management`
**Issuer:** `https://api-demoigrp.nosi.cv/igrp-access-management`

---

## Status After Live Testing (2026-05-17)

### Resolved
- `offline_access` scope: **not needed**. The provider client is already configured to return a `refresh_token` unconditionally on `authorization_code` grants. All three tokens confirmed present:
  ```
  access_token:   ✅ present
  refresh_token:  ✅ present
  id_token:       ✅ present
  ```
- IdP end-session: **SSO session is being terminated**. Confirmed by the browser hitting the end-session endpoint with a valid `id_token_hint`. Switching users works (old SSO session is destroyed).

### Still Blocking
The IdP does **not redirect back to the application** after logout. The browser lands on the IdP's own page because `post_logout_redirect_uri` is not registered on the client. The end-session URL being sent:

```
https://api-demoigrp.nosi.cv/igrp-access-management/connect/logout
  ?client_id=igrp-access-management
  &post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Flogin
  &id_token_hint=<valid_jwt>
```

The provider receives and ignores the `post_logout_redirect_uri` (not in allowed list), leaving the user stranded on the IdP page instead of returning to `/login`.

---

## Open Issue — Redirect URI Registration

### 1. Login Callback URI

The login flow redirects the browser to the OIDC provider for authentication, then back to the application at the callback URI. This URI **must be registered** on the provider for the client `igrp-access-management`.

| Environment | Callback URI |
|---|---|
| Local development | `http://localhost:3000/api/auth/callback/igrp-auth` |
| Production | `https://<production-domain>/api/auth/callback/igrp-auth` |

If not registered, the provider will reject the authorization request with `redirect_uri_mismatch`.

### 2. Post-Logout Redirect URI

After the IdP terminates the SSO session via `end_session_endpoint`, it redirects the browser back to the application. This URI **must be registered** as an allowed post-logout redirect URI.

| Environment | Post-Logout URI |
|---|---|
| Local development | `http://localhost:3000/login` |
| Production | `https://<production-domain>/login` |

**Impact when missing:** The IdP end-session call either fails silently or shows an error page on the provider side. The local NextAuth session is still cleared, but the SSO session on the provider is not terminated — the user can re-login to other apps in the same SSO session without re-authenticating.

---

## Discovery Document

The `end_session_endpoint` is present and functional:

```
https://api-demoigrp.nosi.cv/igrp-access-management/connect/logout
```

The logout flow constructs the following URL and redirects the browser to it:

```
https://api-demoigrp.nosi.cv/igrp-access-management/connect/logout
  ?client_id=igrp-access-management
  &post_logout_redirect_uri=http://localhost:3000/login
  &id_token_hint=<id_token>
```

The `post_logout_redirect_uri` value (`http://localhost:3000/login`) must be in the client's allowed list for this redirect to succeed.

---

## Verification

After registering both URIs on the provider:

**Login:** Navigate to `http://localhost:3000/login`, sign in — the provider should redirect back to `http://localhost:3000/api/auth/callback/igrp-auth` without error.

**Logout:** Navigate to `http://localhost:3000/logout` — the browser should redirect to `https://api-demoigrp.nosi.cv/igrp-access-management/connect/logout` and then back to `http://localhost:3000/login`. The SSO session should be terminated (re-login on other apps in the same SSO should prompt for credentials again).
