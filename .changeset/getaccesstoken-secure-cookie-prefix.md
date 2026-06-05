---
"@igrp/framework-next-auth": patch
---

Fix `getAccessToken` returning null (and RP-initiated logout failing with `[getLogoutUrl] no active token found`) on HTTPS deployments behind a TLS-terminating proxy.

`getToken` infers the session-cookie name solely from `NEXTAUTH_URL`'s scheme, but NextAuth's request handler writes the `__Secure-`-prefixed cookie based on the request origin (`x-forwarded-proto`, `AUTH_TRUST_HOST`, or a build-time-inlined `NEXTAUTH_URL` in the Edge middleware). When the app runs over HTTPS via a proxy while the Node runtime's `NEXTAUTH_URL` is `http`/unset, the handler stores `__Secure-next-auth.session-token` while `getToken` looks for the bare `next-auth.session-token` and finds nothing — login keeps working but `getAccessToken` silently fails.

`getAccessToken` and `getTokenFromRequest` now detect the actual session-cookie prefix present on the request and pass an explicit `secureCookie` flag to `getToken`, keeping the reader in sync with the writer regardless of how the scheme was detected.
