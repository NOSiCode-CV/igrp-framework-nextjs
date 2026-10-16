# Login fails at `/oauth2/token`: duplicate key on `ux_session_user_device_active` returned as bare 401

Hi team,

Login to a Next.js app (demo-v1, client `igrp-access-management`) against
`https://api-demoigrp.nosi.cv/igrp-access-management` fails after the user
enters a correct username and password. The authorization code is issued, but
the token exchange returns **401** with no OAuth error body.

## Cause, from the AM logs (2026-10-16 ~11:01 UTC)

```
ConstraintViolationException: duplicate key value violates unique constraint "ux_session_user_device_active"
Detail: Key (user_id, device_id)=(3a81e0f2-35a4-4707-9415-4bdf5225455e, derived:KiNtn3izR9Y0TkjsMtMjcdt44CuwK2VD) already exists.
[insert into t_user_session (...)]
```

The insert into `t_user_session` during token issuance fails. The exception is
then forwarded to `/error`, and the security chain denies that as anonymous
(`ACCESS_DENIED … anonymousUser … /igrp-access-management/error`). The client
only sees a bare 401.

## Why it repeats

The `device_id` is `derived:`, apparently from the server-to-server token call
(user agent `openid-client/5.7.1`, the IP of the Next.js server), not from the
user's browser. Every login by the same user through the same app server
therefore maps to the same device. Once one active row exists, every later
login fails until that row is closed or expires.

## Requests

1. **Unblock now:** close or expire the active `t_user_session` row for user
   `3a81e0f2-35a4-4707-9415-4bdf5225455e`.
2. **Fix:** when a login arrives for a (user, device) that already has an
   active session, close or reuse that row instead of inserting a duplicate.
3. **Error handling:** don't turn internal errors at `/oauth2/token` into a bare
   401. Return a 500 or a proper OAuth error. The current 401 makes this look
   like a client-credentials problem (a real `invalid_client` returns
   `{"error":"invalid_client"}`).
4. **Device id (worth checking):** deriving it from the token request means
   every user behind the same app server shares one "device". If the intent is
   per-browser, it needs to come from the authorization request instead.

Thanks!
