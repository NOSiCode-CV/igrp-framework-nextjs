---
"@igrp/framework-next-auth": patch
---

fix(auth): stop double signOut race and clear stale refresh-error from still-valid tokens

- `useSafeSession` no longer calls `signOut()` on `RefreshAccessTokenError`.
  That responsibility was already owned by `IGRPSessionWatcher` (path-aware,
  routes to `/logout` for a clean IdP single-logout). Having both fire meant
  two concurrent `POST /api/auth/signout` calls when a layout consumer
  mounted alongside the logout page, racing the page's own end-session
  redirect and leaving the UI stuck on "A terminar sessão…". The function
  signature keeps `forceLogoutCallbackUrl` as an inert option for
  backwards-compatibility with existing call sites.
- The `jwt` callback's still-valid early-return now clears any leftover
  `error` / `forceLogout` flags before returning. Otherwise a successful
  refresh inside a server-component tree (where `cookies()` is read-only
  and the rotated token can't be persisted) would leave the cookie token
  tagged with `RefreshAccessTokenError`; the next route-handler poll would
  see "still valid" + stale error and return it untouched, sticking the
  user in an auto-logout loop.
