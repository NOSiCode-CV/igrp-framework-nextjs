---
'@igrp/framework-next-auth': patch
---

Fix the post-login redirect dropping the app's `basePath`.

next-auth v4 calls `callbacks.redirect({ url, baseUrl })` with `baseUrl` set to
`url.origin` — protocol + host only, the path of `NEXTAUTH_URL` already
stripped. The default callback assumed `baseUrl` carried that path, so under a
basePath deployment (`NEXT_PUBLIC_BASE_PATH=/apps/core`) every post-login
redirect and the app-home fallback landed on `https://host/dashboard` instead of
`https://host/apps/core/dashboard` — outside the ingress prefix, a 404.

- The basePath is now re-derived from `NEXTAUTH_URL` (path minus `/api/auth`),
  falling back to `NEXT_PUBLIC_BASE_PATH`; a disagreement warns once and
  `NEXTAUTH_URL` wins. A `baseUrl` that already carries a path is trusted.
- A relative `callbackUrl` that already carries the basePath is no longer
  double-prefixed; the match is on a segment boundary (`/apps/core-other` is
  not under `/apps/core`). New `stripBasePath` helper in `/sanitize`.
- **Behavior tightening:** a same-origin absolute `callbackUrl` outside the
  basePath now goes to the app home instead of being followed.
- Docs: the `callbacks.redirect` escape hatch now states that it receives an
  origin-only `baseUrl`. Apps that worked around this bug with their own
  `callbacks.redirect` can delete the override after upgrading.
- Tests now feed the real origin-only `baseUrl`, and a contract test pins
  next-auth's behaviour so a library change fails here first.
