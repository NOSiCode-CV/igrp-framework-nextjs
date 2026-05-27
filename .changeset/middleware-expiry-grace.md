---
"@igrp/framework-next-auth": patch
---

fix(config): give middleware a small expiry grace so the client refresh can win

`isTokenExpiredOrFailed` (used by middleware to decide the `/login` redirect) shared the 60s `TOKEN_REFRESH_BUFFER_MS` with the jwt callback's proactive refresh. That meant middleware redirected to `/login` at exactly the moment the client session poll would have refreshed the token, so navigations near expiry were bounced before any silent refresh could land.

Middleware now uses a separate, much smaller `TOKEN_EXPIRY_GRACE_MS` (10s), so it stays lenient through the proactive-refresh window and only redirects once the access token is effectively expired — letting the client poll / focus-refetch rotate the session cookie first (and, when it can't, falling back to a silent IdP-SSO re-login via `/login`). Refresh-error tokens are still treated as expired immediately.
