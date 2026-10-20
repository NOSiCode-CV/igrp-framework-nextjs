# Access Management — session policy: one SSO session per device, several app sessions under it

> Audience: the Access Management (AM) team.
> Origin: the 2026-10-13 incident on `demoigrp.nosi.cv` (cluster `guine-bissau-teste`, namespace
> `demo-igrp-stack`), with the app-center (`/`), demo (`/apps/demo`) and app-b (`/apps/app-b`) on the same domain.
> Agreed decision: AM moves from **"one active session per user and device"** to **"one SSO session per user
> and device, with several app sessions under it"**.

## 1. The problem

Today AM allows only **one active session per user and device**. IGRP apps on the same domain run in the same
browser, so AM sees them as the **same device**.

Each Next.js app has its own session (its own cookie, its own tokens). When the user opens a second app, that
app has no session yet and runs its own authorization flow (`/oauth2/authorize` → code → `/oauth2/token`).
That is where AM replaces the previous session:

1. The user logs into the app-center. AM creates **session A**.
2. The user opens `/apps/demo`. Demo requests authorization from AM.
3. AM records `SESSION_REPLACED` + `SESSION_CREATED`: **session A is invalidated** and **session B** is created.
4. The app-center makes its next call to AM with session A's tokens and gets `401 Unauthorized`.
5. The app-center sends the user to log in again, which replaces session B, and the cycle repeats.

Excerpt from the incident logs (local time):

| Time | Event |
|---|---|
| 07:16:39 | demo: `POST /apps/demo/api/auth/signin/igrp-auth` |
| 07:16:39 | AM: **`SESSION_REPLACED`** + `SESSION_CREATED` |
| 07:16:40 | app-center: `401 Unauthorized` from AM → `/login?callbackUrl=/` → new login |

Result for the user: apps on the same domain "steal" each other's session. Only **one** app can be signed in at
a time, and every switch between apps forces a new login.

## 2. The target model

This is the standard OpenID Connect model: **one login session at AM (the SSO session) per browser**, which
can serve **several applications**, each with its own tokens.

```
SSO session at AM  (one per user + device/browser)
 ├─ app session: app-center   → its own access/refresh/id token
 ├─ app session: demo         → its own access/refresh/id token
 └─ app session: app-b        → its own access/refresh/id token
```

With this model, when demo requests authorization:

- AM recognises the SSO session already present in the browser (the app-center login);
- it **does not ask for credentials again** and returns the authorization code to demo;
- it issues new tokens for demo **without invalidating** the app-center's tokens.

The "one session per user and device" limit still exists, but it now applies to the **SSO session**, not to
each app session.

## 3. Requirements for AM

### 3.1 Authorization with an existing SSO session
- An `/oauth2/authorize` from a browser that already has a valid SSO session must issue the code **without
  interactive authentication** (unless the request carries `prompt=login` or an expired `max_age`).
- This request **must not** produce `SESSION_REPLACED` or revoke tokens already issued under the same SSO
  session.

### 3.2 Several app sessions for the same `client_id`
**Important:** today all three apps use **the same OIDC client** (`igrp-access-management`). "One session per
client" under the SSO session is therefore not enough. AM must accept **several authorizations from the same
`client_id`** under the same SSO session, one per code exchange (`authorization_code` → `/oauth2/token`). Each
exchange opens an independent **token family**.

If each app gets its own `client_id` in the future, this requirement still holds: the model must not depend on
the clients being different.

### 3.3 Independent refresh tokens per family
- Rotating one app's refresh token **must not** invalidate another app's refresh tokens.
- Reuse detection (an already-consumed refresh token presented again) must revoke **only that token's
  family**, not the whole SSO session or the other families.
- Revoking a refresh token (RFC 7009) from one app revokes only that family.

### 3.4 Logout
- App-initiated logout (`end_session_endpoint` with `id_token_hint` and `post_logout_redirect_uri`) **ends the
  browser's SSO session**.
- Recommended: ending the SSO session also revokes **every app session** under it (single logout). The other
  apps detect this on their next refresh (`invalid_grant`) and log out locally; the framework already handles
  that case.
- The `id_token_hint` of **any** app under the SSO session must be accepted at the `end_session_endpoint`, not
  only that of the last app that logged in.
- Each app still needs its own `post_logout_redirect_uri` registered (e.g.
  `https://<domain>/apps/demo/login`).

### 3.5 Expiry
- The SSO session has its own lifetime (idle and absolute).
- An app session can never outlive the SSO session it came from. When the SSO session expires, refresh for the
  associated families must fail with `invalid_grant`.

### 3.6 Audit events
To keep the logs useful, we suggest distinguishing:
- `SSO_SESSION_CREATED` / `SSO_SESSION_REPLACED` / `SSO_SESSION_ENDED`
- `APP_SESSION_CREATED` / `APP_SESSION_REVOKED` (with the `client_id` and the app's `redirect_uri`)

`SESSION_REPLACED` should only appear when the **SSO session** changes (e.g. a different user logs in on the
same browser), never when opening another app.

## 4. What does not change on the app side

- No changes to the apps or to `@igrp/framework-next-auth`: the apps already run the `authorization_code` +
  PKCE + `nonce` flow and log out with `id_token_hint`.
- Each app keeps its own session cookie, isolated by its `basePath`.
- The `redirect_uri` and `post_logout_redirect_uri` values registered on the client stay the same.

## 5. What this change does **not** fix

The size of the `Cookie` header (the `400 Request Header Or Cookie Too Large` error). Each app still has its
own session cookie, and the app-center's (at the root, `Path=/`) is sent to every app. That is handled
separately (access-token size and token storage) and does not depend on this change.

## 6. How to validate

Environment with the app-center at `/`, demo at `/apps/demo` and app-b at `/apps/app-b`, all using the
`igrp-access-management` client. Start with the domain's cookies cleared.

1. Log into the app-center.
   **Expected:** one `SSO_SESSION_CREATED` and one `APP_SESSION_CREATED`.
2. Open `/apps/demo`.
   **Expected:** demo signs in **without asking for credentials**; AM shows only `APP_SESSION_CREATED`,
   **no** `SESSION_REPLACED`.
3. Go back to the app-center and navigate (pages that call AM).
   **Expected:** no `401`, no new login.
4. Open `/apps/app-b`, then switch between the three apps several times.
   **Expected:** none asks for login; no `SESSION_REPLACED`.
5. Let one app's access token expire (or force a refresh) and keep navigating in the others.
   **Expected:** one app's refresh does not affect the others.
6. Log out from demo.
   **Expected:** `SSO_SESSION_ENDED`; demo goes to `/apps/demo/login`; the app-center and app-b log out locally
   on their next refresh.
7. Log in as **a different user** on the same browser.
   **Expected:** this time `SSO_SESSION_REPLACED` does appear, and the previous user's app sessions are
   revoked.
