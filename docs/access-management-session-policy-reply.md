# Re: Session policy — frontend reply

> To: the Access Management (AM) team.
> From: IGRP frontend framework.
> Re: your reply on the session policy (fix `0444154d`) and on `/api/session` / `end_session`.
>
> **Decisions marked `☐ DECISION` are open until the owner fills them in.**

## 1. Summary

Thank you. The diagnosis matches ours and the fix covers the incident. On the frontend side nothing has to change for it:

- Each app keeps its own session cookie and its own token family, which is the per-app model you describe, `sid` included.
- We already log out with `end_session` + `id_token_hint`, so we agree there is no need for a `/api/session/close`.
- We will only use the per-app endpoints you list as stable (`GET /api/session`, `/check`, `/refresh`, `/rotate`). We won't build anything that needs a browser-level view or immediate single logout until the SSO-session model lands.
- Agreed that none of this affects the `Cookie` header size; we handle that separately with a server-side session store.

Below are the answers to your four requests, three questions back, and one point we think needs checking before anyone builds on `device_id`.

## 2. Answers to your requests

### 2.1 Re-test §3.1 (no credential re-prompt)

We agree it most likely already works. The frontend already does **silent SSO**: an app with no session first sends `/oauth2/authorize` with `prompt=none`, and shows the login form only if the IdP answers `login_required`. So "sign in to the app-center, open demo, no password prompt" is exactly the frontend's behaviour, as long as your SSO session is alive.

We will re-test on a build with `0444154d` using steps 1–5 of our original document (`access-management-sso-session-policy.md`, §6).

**We need from you:** which environment and build to test against, and when it's deployed there.

### 2.2 Session cap

`☐ DECISION — maximum concurrent sessions per user: ______ , counted as: ☐ app sessions (now) ☐ SSO sessions (after the model lands)`

Frontend recommendation:

- **Long term:** count **SSO sessions** (browsers), as you suggest. A cap on app sessions penalises users for the number of apps on the platform, which keeps growing.
- **Until then:** size the cap as `apps × devices` you want to allow. With 3 apps on 2 devices the current value of 5 already evicts a live session.
- **In any case:** log every eviction (`SESSION_EVICTED`, with the reason `max-per-user`) and, if possible, return a distinct error to the evicted app. A silent eviction looks exactly like the bug we just closed: a user who is suddenly sent to login for no visible reason.

### 2.3 Single logout UX

`☐ DECISION — logging out of one app logs out all apps on the domain: ☐ yes, intended ☐ no`

Frontend recommendation: **yes, intended.** That is what users expect from one login.

We accept the current **partial** behaviour as temporary: the app that logs out ends immediately, and the others end when their tokens expire and refresh fails. On the frontend side that path already works: a failed refresh sends the user to `/logout` and then to login.

Please confirm which of these the sibling apps see once the SSO session is gone:

- **(a)** a refresh error (`invalid_grant`);
- **(b)** a successful refresh until the access token's own expiry.

### 2.4 One `client_id` per app

`☐ DECISION — give each app its own OIDC client: ☐ yes ☐ not now`

Frontend recommendation: **yes.** On our side it's configuration only: each app sets its own `IGRP_AUTH_CLIENT_ID` / secret, and its own `redirect_uri` and `post_logout_redirect_uri` are registered on its client.

Before we switch, please confirm:

- **Audience:** each app's tokens will carry a different `aud`. Does the AM API accept all of them as a resource server (permissions, `/api/session`, menus)?
- **Claims:** are the permission claims in the access token the same for every client, or do they depend on the client?

## 3. Questions back

### 3.1 Where is `device_id` computed? (please check before building on it)

You describe `device_id = SHA-256(User-Agent, client_ip, client_id)` and say the session opens **on the code exchange**.

In the IGRP frontend, **the code exchange and every refresh are server-to-server calls**: the Next.js server calls `/oauth2/token`, not the browser.

**If `device_id` is derived from the `/oauth2/token` request:**

- `User-Agent` and `client_ip` are the Next.js pod's (or the ingress's), not the user's.
- Every user who goes through the same pod gets the same `device_id` for a given client.
- The "colleagues behind one NAT" problem from your §5 then applies to **all users of an app**, not just to users who share a NAT.
- The "IP changes on mobile" problem disappears, because the pod's IP is what counts — and, with it, any real per-device meaning.

**If it is derived from the `/oauth2/authorize` request** (the browser talks to the authorization server directly there) **and carried with the code**, then `User-Agent` and the IP really are the user's, and your analysis holds.

**Question:** which request is it computed from? If it's `/oauth2/token`, we suggest fixing this before the SSO-session model, since that model depends on a trustworthy browser identifier.

### 3.2 `X-Device-Id`: if you adopt it, the frontend sends it

If you go with a client-supplied, stable `X-Device-Id`, the frontend framework would:

- create a random per-browser identifier, kept in an `httpOnly` cookie at `Path=/`, so every app on the domain shares the same one;
- send it as a header on the server-to-server calls (`/oauth2/token` for code exchange and refresh).

It's a small framework change. We'll build it once the contract is fixed:

- header name and format;
- which requests must carry it (token exchange? refresh? `/authorize`, where the browser can't add headers, so it would have to be a parameter?);
- what the server does when it's missing.

Note that a client-supplied ID is a hint, not proof. It can't on its own decide that one user must sign another out (your §5).

### 3.3 Refresh-token reuse detection: one family or more?

Please confirm the scope before we rely on independent refresh. On our side:

- Apps never share refresh tokens: each one has its own cookie and token family.
- But with several replicas of the same app, two concurrent requests for the same session can refresh with the same refresh token at the same moment. Your reuse detection would see that as reuse, even though no token was stolen.

We will add a lock per session (`sid`) around refresh in the frontend's session store, so only one replica refreshes and the others read the result. That removes our own source of false reuse either way. But if reuse revokes **more than that family**, one app could still take down its siblings, so the answer matters.

## 4. What changes on the frontend

| Item | When |
|---|---|
| Server-side session store (small cookie, tokens in Redis) | Built; released with the next framework version. Opt-in through `IGRP_SESSION_STORE_URL`. |
| Re-test §3.1 / steps 1–5 | Once you give us an environment with `0444154d`. |
| Lock per `sid` around refresh | Next framework version. |
| `X-Device-Id` | After you confirm the contract (§3.2). |
| Separate `client_id` per app | After decision 2.4 and your confirmation on `aud`. |
| Anything that needs an SSO view or immediate single logout | Not before your SSO-session model lands. |
