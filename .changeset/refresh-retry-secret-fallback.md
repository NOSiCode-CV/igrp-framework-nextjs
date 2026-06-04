---
'@igrp/framework-next-auth': patch
---

Harden the OIDC refresh path and tidy two related rough edges:

- `refreshOidcAccessToken` now retries the refresh-token grant once on a **transient** failure (network error, timeout, or 5xx) before giving up, and time-boxes the grant via `fetchWithTimeout`. A single network blip no longer forces an immediate logout. A 4xx (e.g. `invalid_grant` for a consumed/expired refresh token) is permanent and is never retried.
- `getAccessToken` now falls back to `process.env.NEXTAUTH_SECRET` (matching `getTokenFromRequest`) instead of `''`, so the token can still be decoded when no explicit `secret` was passed to `withIGRPAuth`.
- Removed the unreachable `token.error === 'invalid_grant'` branch in `isTokenExpiredOrFailed`; the refresh path only ever sets `error` to `'RefreshAccessTokenError'`, so that is the single failure flag checked everywhere.
