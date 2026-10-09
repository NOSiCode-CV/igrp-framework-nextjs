---
'@igrp/framework-next-auth': patch
---

Review hardening of the token lifecycle, provider resolution and middleware defaults.

**Token lifecycle**

- A refreshed access token's expiry now follows the same order as sign-in: the response's `expires_in`, else the token's own `exp`, else a 5-minute self-correcting guess. The refresh path still assumed a full hour when `expires_in` was missing, so a ~3-minute token was treated as healthy for 57 minutes of guaranteed 401s after every refresh.
- The rotated-refresh-token recovery entry now lives 15 minutes instead of 3, sized to the template's 600s backstop poll. With a backgrounded or closed tab the entry expired before any persist-capable read, the cookie replayed the consumed refresh token, and a healthy session was force-logged-out.
- Sign-out revokes the **live** refresh token: when the cookie still holds a consumed token after an RSC rotation, the rotated token from the recovery store is revoked instead of being silently dropped.
- Refresh and revocation authenticate with HTTP Basic (`client_secret_basic`), as introspection already did, so an authorization server registered for a single client-authentication method no longer breaks one side. The client at the IdP must accept Basic.
- A 200 with a non-JSON body from the token endpoint is a failed refresh, not an exception that rejected every deduped caller.
- An empty-string `refresh_token` in a token response is treated as "no rotation".
- A stale discovery fetch that fails after a newer entry replaced it no longer evicts that newer entry.

**Provider resolution**

- The string form of the `provider` option (`'none'` / `'igrp-auth'`) is honoured by the middleware primitives and by the id stamped on the token, not only by the handlers. Previously `provider: 'none'` served 404 handlers while `isAuthDisabled()` said false and middleware looped to `/login`; the reverse (`provider: 'igrp-auth'` with `AUTH_PROVIDER=none`) let middleware fail open.
- `AUTH_PROVIDER=constructor` (or any inherited `Object.prototype` key) is rejected as unsupported instead of being accepted and crashing with a `TypeError` later.
- Surrounding quotes in `AUTH_PROVIDER` are stripped, as `IGRP_PREVIEW_MODE` already allowed.

**Middleware and misc**

- The default matcher excludes `apps`, `_next` and `favicon.ico` as whole segments, and skips static assets by extension instead of "any path containing a dot". The old pattern left `/appstore`, `/apps-admin`, `/_nextfoo` and every dotted page route (`/users/john.doe`) outside the middleware entirely.
- A throwing `callbacks.jwt` / `callbacks.session` extension no longer ends the session. next-auth clears the session cookie when the jwt callback throws; the IGRP value is now used and the failure logged with the extension's name. Next control-flow signals still pass through.
- NextAuth debug logging is off by default in every environment (it prints OAuth token responses). Enable with the `debug` option or `IGRP_AUTH_DEBUG=true`.
- In production the configuration-error page shows only the error code; the detail naming the missing variables goes to the server log.
- `revokeOidcSession` never throws: missing `IGRP_AUTH_*` configuration is reported as `not_configured` and a failed discovery fetch as `network_error`.
- `staleAuthCookies` gains an opt-in `sweepStockNames` for root-path apps, which expires the pre-terminator stock names (`next-auth.session-token` and chunks). A root app cannot scope its cookies below `Path=/`, so that orphan was sent to every co-hosted app on every request and nothing ever cleared it.
- The NextAuth route handler is constructed once for concurrent first requests.
- A relative `post_logout_redirect_uri` resolves against the app base (origin + basePath), not the host root, and the helper's dev-only warnings respect `process.env.NODE_ENV` when the env map has none.
- `JWT.error` keeps `'RefreshAccessTokenError'` visible in completions.
- Docs: `/jwt` and `/middleware` need the scoped cookie names; the recovery store holds plaintext tokens; entry-point runtimes corrected; KNOWN-ISSUES #1 updated for the shipped sweep.
