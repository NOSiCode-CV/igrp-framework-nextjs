---
"@igrp/framework-next-auth": patch
---

Three session fixes from the 2026-11-25 audit:

- Session store: a write now keeps the stored tokens when they are newer (a later expiry, no error). Before, a pod that read the session before another pod refreshed it could write the old refresh token back, and the next refresh replayed a used token. A refresh on the writing pod still lands.
- In-memory token recovery store: entries now leave only on expiry. Before, a full store dropped the oldest live entry, which could log out a background tab on a busy single-pod app. `maxEntries` now sets when expired entries are swept.
- `igrpMiddlewareDecision` decides the auth bypass with `auth.isPreviewMode() || auth.isAuthDisabled()`, the same answer the handlers use. Before, it read only the env, so a `withIGRPAuth({ provider })` app with a leftover `AUTH_PROVIDER=none` passed every request. `IGRPMiddlewareAuth` now also needs `isPreviewMode` and `isAuthDisabled` (the `withIGRPAuth` instance has both; a hand-written or test mock of `auth` must add them, or the call throws `auth.isPreviewMode is not a function`), and `options.env` is read only for `NEXT_PUBLIC_BASE_PATH`.
