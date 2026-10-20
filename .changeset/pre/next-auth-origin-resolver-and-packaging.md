---
'@igrp/framework-next-auth': patch
---

One origin resolver for redirects, plus packaging and documentation fixes.

- **`auth.resolveAppUrl(path, request)`** is new: it resolves an app-relative path against the app's browser-reachable origin (preferring `NEXTAUTH_URL` minus its `/api/auth` suffix, recovering the basePath from it when `NEXT_PUBLIC_BASE_PATH` is unset, falling back to the request origin). `getLoginRedirectUrl` is now just this applied to the configured `middleware.loginUrl`.

  Middleware that builds its own redirects with `new URL(path, request.url)` is resolving against the *internal* origin behind a TLS-terminating proxy, which points the browser somewhere it cannot reach. There were two implementations of "where is this app"; this is the one.

- **The `env` option's limit is documented.** It governs everything this package reads, but cannot reach inside `next-auth`, whose `detectOrigin()` reads `process.env.NEXTAUTH_URL` / `VERCEL` / `AUTH_TRUST_HOST` directly and uses that origin for its own `callbackUrl` and for the `baseUrl` passed to `callbacks.redirect`. Use `env` to narrow or validate `process.env`, not to replace it.

- **`DEFAULT_MATCHER` is documented.** Matchers are basePath-*relative*, so the `apps` alternative excludes a top-level `/apps` inside the app — it does not refer to a deployment mounted at `/apps/<name>`, and an app whose basePath is `/apps/template` is matched normally. It protected nothing by itself and read as though it did.

- **Packaging:** the package declared `LICENSE` in `files` but shipped no such file, while declaring `license: "MIT"` — MIT requires the notice to travel with the code. Added, along with `CHANGELOG.md`, which consumers were not receiving.
