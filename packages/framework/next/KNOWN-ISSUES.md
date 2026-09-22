# Known issues — `@igrp/framework-next`

Defects that are understood and reproducible but not yet fixed. Each entry is a
handover note: enough to act on without re-deriving the diagnosis.

---

_No open issues._

Entry 1 — `igrpGetClaims()` recovering no token in an app deployed under a
`basePath` — was **fixed on 2026-09-21**. `recoverAccessTokenFromCookies` now
passes `cookieName: sessionCookieName(basePath, …)`, delegating the naming to
`@igrp/framework-next-auth/cookies` rather than copying it.

The name is chosen by **probing the cookie jar**, not by reading
`NEXT_PUBLIC_BASE_PATH` alone. A first cut did the latter and thereby broke
`cookieIsolation: 'none'`, which keeps the stock cookie names even under a
basePath — `withIGRPAuth` gates its own `cookieName` on the isolation mode, and
this package cannot see that option. Do not "simplify" the probe back to an env
check; `permissions-basepath-cookie.test.ts` fails if you do. `resolveSecureCookiesFlag` moved to that same entry point so the
`secure` fallback is shared with `withIGRPAuth.getAccessToken()` instead of
duplicated. Regression cover: `src/lib/__tests__/permissions-basepath-cookie.test.ts`.
