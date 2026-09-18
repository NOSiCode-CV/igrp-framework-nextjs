---
'@igrp/framework-next-auth': patch
---

Share process-wide state across entry chunks, and bring the README back in line with the code.

**Module state was duplicated per entry point**

`tsup` builds with `splitting: false`, so every entry inlines its own copy of every module it imports — and a template loads two of them (`withIGRPAuth` from `/config`, `buildEndSessionUrl` from `/oidc`). `oidc.ts` already knew this: the token recovery store lives on `globalThis` under `Symbol.for` with a comment explaining exactly why. That reasoning was never applied to the state sitting next to it.

The OpenID discovery cache, the in-flight refresh map and the warn-once flags now use the same mechanism, via a new internal `_global-state` module:

- The `/oidc` chunk no longer re-fetches a discovery document the `/config` chunk has already cached — that was an extra IdP round-trip (4s timeout ceiling) on the user-blocking logout path, which is precisely where the fetch budgets exist.
- The in-flight refresh dedup can no longer split. Nothing refreshes through a second entry today, so this was latent rather than broken — but that map exists because a split produces `invalid_grant` and logs users out of healthy sessions, and the invariant protecting it was undocumented.
- "Warn once per process" is now once per process rather than once per chunk.

Test suites that relied on `vi.resetModules()` handing them a fresh cache must call `resetGlobalStateForTests()`; slots deliberately outlive module reloads.

**Provider profile id**

`profile.sub` had no fallback, though every other field in the mapper did. An IdP omitting it produced `id: undefined`, which sign-in tolerates and which then surfaces much later as a permanently empty `session.user.id`. Now falls back to `preferred_username` then `email` with a one-time warning that those are not stable across a rename, and returns `''` — a failed sign-in — when nothing usable exists.

**Documentation**

- `NEXTAUTH_URL_INTERNAL` was still documented as the redirect origin. Its use there was removed as a bug (it names a server-to-server origin, so the browser got a `Location` it could not reach); the README now says so explicitly rather than inviting operators to set it for an effect it no longer has.
- Six environment variables the package reads were undocumented: `AUTH_TRUST_HOST`, `VERCEL`, `NEXT_PUBLIC_BASE_PATH`, `NEXT_PUBLIC_IGRP_APP_HOME_SLUG`, `IGRP_SESSION_REFETCH_INTERVAL`, `IGRP_AUTH_POST_LOGOUT_ALLOWED_ORIGINS` — including the 60s ceiling on the poll interval and how cookie naming and the `Secure` flag are derived.
- Added `withIGRPAuth` options and middleware-primitive tables covering `tokenRecoveryStore` (undocumented since it was introduced), `cookieIsolation`, `secureCookies` and `resolveAppUrl`.
