---
"@igrp/framework-next-ui": patch
---

fix(session-watcher): route to `/logout` when the session carries a failed-refresh error

After a failed token refresh the session cookie still decodes, so `useSession().status` stays `authenticated` even though the access token is dead. `IGRPSessionWatcher` previously only reacted to `status === 'unauthenticated'`, so it ignored this state — the broken session stayed mounted and the next access-token-bearing request 401'd into the global error boundary.

The watcher now also inspects `session.error`: when it equals `'RefreshAccessTokenError'` it navigates to `/logout` for a clean IdP single-logout (consistent with the server-side `onSessionExpired` contract). The existing auth-chrome skip (`/login*`, `/logout*`) still applies, so this can't loop.
