---
'@igrp/framework-next-auth': patch
---

Fix post-login redirects, client-entry packaging and claim resolution in `@igrp/framework-next-auth`.

**Redirects (user-visible)**

- `callbacks.redirect` no longer builds the post-auth destination by concatenating `NEXTAUTH_URL_INTERNAL`. NextAuth v4 requires `NEXTAUTH_URL` to carry an `/api/auth` suffix under a `basePath`, so a sign-in with no `callbackUrl` landed the browser on the NextAuth API root instead of the app home. Destinations now resolve against the app base URL (`baseUrl`/`NEXTAUTH_URL` minus `/api/auth`).
- `NEXTAUTH_URL_INTERNAL` is no longer used for anything that becomes a `Location` header — it names a server-to-server origin that is, by definition, unreachable from the browser in the deployments that set it. This applies to both `callbacks.redirect` and `getLoginRedirectUrl`.
- `getLoginRedirectUrl` recovers the `basePath` from `NEXTAUTH_URL` when `NEXT_PUBLIC_BASE_PATH` is unset, instead of dropping it.
- The auth chrome (`/login`, `/logout`) is no longer a valid post-auth destination; it redirects to home rather than bouncing the user back through the flow they just finished.

**Packaging**

- `./client` now ships a real `"use client"` directive. `next-auth`'s v4 `react` entry has none and esbuild strips top-level directives, so the entry was server-first despite its name.
- The root barrel no longer re-exports `./middleware`, `./jwt` or `./oidc`. A single root import from a page pulled `next-auth/middleware` and the server-side token machinery (refresh, revocation, introspection, recovery store) into that page's bundle. Those symbols remain available from their subpath entries; the corresponding **types** are still re-exported from the root.

**Correctness**

- `session.user.id` is now populated from `token.user.id ?? token.sub`. It was declared in the public `Session` type and the `next-auth` module augmentation but never set, because the IGRP session callback replaces NextAuth's default.
- `decodeIgrpClaims` no longer resolves roles from `aud[0]`. Keycloak commonly issues `aud: ["account", "<client-id>"]`, so the app's roles silently resolved to `resource_access.account` — indistinguishable from "no roles". Resolution is now `azp` → first non-built-in audience carrying roles → sole application entry → any audience carrying roles.
- Introspection client authentication follows RFC 6749 §2.3.1 (form-urlencode before base64) and no longer throws on a non-ASCII client secret, which the surrounding catch turned into a silent fail-open that disabled the revocation gate.
- `sanitizePath` now rejects protocol-relative (`//`), backslash and control-character inputs, and checks `..` by path segment — so a legitimate path such as `/reports/q1..q2` is accepted while traversal is still blocked.

**Diagnostics**

- `withIGRPAuth` warns once in development when `IGRP_SESSION_REFETCH_INTERVAL` is at or beyond the proactive-refresh buffer. The constraint was documented in a comment but never checked, which made the resulting refresh dead zone look like a random logout.
- `env` is now honoured consistently: `secret`, `NEXT_PUBLIC_BASE_PATH` and `NODE_ENV` resolve from the injected `env` map before falling back to `process.env`.
- Documented the IdP assumption behind `revokeOidcSession` (refresh-token revocation is assumed to revoke the whole grant).
