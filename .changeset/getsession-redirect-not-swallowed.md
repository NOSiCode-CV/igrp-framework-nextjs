---
"@igrp/framework-next-auth": patch
---

fix(framework-next-auth): don't swallow the `onSessionExpired` redirect in `getSession`

When a session was expired or its refresh had failed (`error: 'RefreshAccessTokenError'`), `getSession()` invoked `onSessionExpired()` (typically `redirect('/logout')`) from *inside* a `try/catch`. `redirect()` signals via a thrown `NEXT_REDIRECT` error, so the bare `catch` swallowed it — the intended redirect was silently cancelled and a dead session stayed mounted until the next access-token-bearing request 401'd into the error boundary (surfacing as `global-error`).

`getSession` now keeps only `serverSession()` inside the `try/catch` (where a thrown error legitimately means "no session"), and runs the expiry/refresh check plus `onSessionExpired()` afterwards so the redirect propagates as intended.
