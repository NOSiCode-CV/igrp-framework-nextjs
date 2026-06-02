---
"@igrp/framework-next-auth": patch
---

Fix logout hanging on the "A terminar sessão…" spinner without clearing the session.

- **next-auth (`oidc.ts`):** `events.signOut` awaits `revokeOidcSession` (and the OpenID discovery fetch before it), which blocks the `/api/auth/signout` response — and therefore the session-cookie clear — until it resolves. Those `fetch` calls had no timeout, so a slow or unreachable IdP hung sign-out indefinitely. Both the discovery and revocation requests on the sign-out critical path are now time-boxed via an `AbortController` (`IDP_FETCH_TIMEOUT_MS`), so local sign-out always completes promptly and the existing network-error handling kicks in.
