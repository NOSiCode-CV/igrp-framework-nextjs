---
'@igrp/framework-next-auth': patch
---

Cookie isolation, control-flow safety, and refresh/claim correctness in `@igrp/framework-next-auth`.

**Auth cookies are now scoped by basePath (behaviour change — see below)**

NextAuth v4 names its cookies from a fixed basename at `path: "/"`. Two IGRP apps on the same host under different basePaths (`/apps/a`, `/apps/b` — the shape `NEXT_PUBLIC_BASE_PATH` exists for) therefore wrote the *same* cookie name, at the same path, on the same host: signing into one overwrote the other. With a shared `NEXTAUTH_SECRET` the second app silently decoded the first app's token (wrong audience, wrong roles); with different secrets it failed to decode and looped to `/login`.

All six NextAuth cookies (session, callback-url, csrf, pkce verifier, state, nonce) now carry a basePath-derived suffix — csrf and pkce too, because a shared csrf token fails the other app's sign-in POST and a shared verifier breaks concurrent logins. Naming lives in the new `./cookies` entry, and `getToken` is told the resolved name explicitly.

**This renames the session cookie for any app with a basePath, which signs every current session out exactly once on deploy.** Apps at the host root are unaffected (no suffix is applied). Opt out with `withIGRPAuth({ cookieIsolation: 'none' })`.

The `Secure` flag (and the `__Secure-` / `__Host-` prefixes) is derived the same way `next-auth`'s own `detectOrigin()` does — `NEXTAUTH_URL`'s scheme, else https when `VERCEL` / `AUTH_TRUST_HOST` is set, else http. Deriving it from `NEXTAUTH_URL` alone would strip `Secure` from a session cookie served over HTTPS behind a TLS-terminating proxy with `NEXTAUTH_URL` unset. `useSecureCookies` is pinned to the same value, so the writer and `getToken` agree by construction rather than by coincidence. Override with `withIGRPAuth({ secureCookies: false })` for a deployment that really terminates plain http behind a trusted proxy.

**Control flow**

`getSession()` caught *everything* and returned `null`. `getServerSession` reads cookies/headers, so during a prerender it throws Next's static-render bailout — control flow, not failure. Swallowing it reported "no session", the route was never marked dynamic, and the page rendered (and could be cached) as logged out; a `redirect()` from a caller's callback was cancelled the same way. Next's signals and `IGRPAuthConfigError` are now re-thrown; only genuine read failures become "no session". The detector ships as `./runtime`.

**Refresh**

Concurrent refreshes share one network round-trip, but `performRefresh` built its result from whichever caller arrived first and handed that merged token to all of them — so custom fields set by a `callbacks.jwt` extension leaked between sessions. The shared promise now resolves to the auth material only, and each caller applies it to its own token. Rotation-store recovery does the same.

**Token expiry on sign-in**

When the IdP returned no `expires_at`, the JWT assumed a full hour of validity. Against a ~3-minute access token that meant middleware never bounced, the jwt callback never refreshed, and every access-management call 401'd for ~57 minutes with nothing in the session explaining why. Expiry now resolves `expires_at` → `expires_in` → the access token's own `exp` claim → a short 5-minute fallback that the first refresh corrects.

**Claims**

- `decodeIgrpClaims` now decodes `exp` (as `expiresAt`, in ms) and ships `claimsExpired()`. No signature verification was always deliberate — the token arrives sealed in the NextAuth cookie — but that argument covers authenticity, not freshness, and a caller reading the cookie directly (`getToken` decrypts, it does not refresh) was honouring permissions from a long-expired token.

**Other**

- `buildEndSessionUrl` validates `post_logout_redirect_uri` against the app origin plus an optional `IGRP_AUTH_POST_LOGOUT_ALLOWED_ORIGINS` allowlist. It reaches the framework from a Server Action parameter — a publicly callable endpoint — and was previously passed through unchecked. When `NEXTAUTH_URL` is unset the origin cannot be derived, so the value is accepted with a warning rather than breaking logout.
- `introspectOidcToken` no longer fails open in silence; each reason warns once per process.
- Sign-out revocation is bounded as a whole (5s) rather than per fetch — it does discovery *then* revoke, serially, so the per-fetch ceiling allowed roughly double the wait before the cookie was cleared.
- `hasAccessToken` checks the token's value, not just the presence of the key.
- The `next-auth` module augmentation in `./types` is derived from the exported `Session`/`JWT` types instead of restating them; the two copies had already drifted.
- Tests for previously uncovered exports: `escapeHtml`, `interopDefault`, `getLoginPath`, `sanitizeString`, `hasAccessToken`, `getServerSessionStrict`, `isIGRPAuthConfigError`.
