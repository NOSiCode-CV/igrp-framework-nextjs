---
'@igrp/template-migrator': patch
---

Add migration 36 — `36-framework-owned-origin-resolution`.

Replaces `src/middleware.ts` so its three redirects resolve through
`auth.resolveAppUrl` / `auth.getLoginRedirectUrl` instead of
`new URL(path, request.url)`. Behind a TLS-terminating proxy `request.url`
carries the internal origin, so a `Location` built from it points the browser
somewhere it cannot follow. Single-host and local development are unaffected —
`NEXTAUTH_URL` and the request origin are identical there.
