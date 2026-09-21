# Known issues — `@igrp/framework-next-auth`

Understood, reproducible defects that are not yet fixed. Each entry is a
handover note: enough to act on without re-deriving the diagnosis. Cross-package
items live in the [repo-wide register](../../../KNOWN-ISSUES.md).

---

## 1. The pre-rename session cookie is orphaned, never swept

**Status:** open · introduced deliberately, with eyes open, by the basePath
cookie-terminator fix (2026-09-21) · documented rather than automated

**Severity:** low, but it grows with cookie size — see "why it is not purely
cosmetic".

### Symptom

After upgrading an app that sets `NEXT_PUBLIC_BASE_PATH`, every existing user's
browser keeps **two** session cookies for the app's host: the live
`next-auth.session-token.<slug>~` and the dead, pre-upgrade
`next-auth.session-token.<slug>`. The dead one is never read and never cleared.

### Root cause

The terminator fix renames auth cookies so that one app's name can no longer
prefix another's (see `src/cookies.ts` → `SUFFIX_TERMINATOR`). NextAuth clears
cookies through `SessionStore#clean()`, which only expires names matching **the
name it is currently configured with**. After the rename that no longer matches
the old cookie, so nothing in the sign-out path can reach it.

The user is not stuck — the old cookie is simply invisible to `getToken`, so the
session reads as absent, the user signs in once and gets a correctly named
cookie. Only the corpse remains.

### Why it is not purely cosmetic

A NextAuth session cookie holding an access token + id_token is routinely 2–4 KB
and is chunked above ~3.9 KB. Carrying a dead copy roughly doubles the auth
cookie weight sent on **every** request to the host, and several ingress
proxies default to an 8 KB request-header ceiling (`431 Request Header Fields
Too Large` / nginx `large_client_header_buffers`). Apps near that ceiling —
co-hosted apps under one domain are exactly the deployments this package's
cookie isolation exists for, and they share a cookie jar — can tip over it.

It self-resolves when the old cookie expires: NextAuth's default session
`maxAge` is 30 days, or sooner if the app sets `IGRP_SESSION_MAX_AGE`.

### Why it was not automated

Clearing a cookie requires emitting `Set-Cookie` on a **response**. This package
builds NextAuth options and Edge-safe helpers; it never owns a response object.
The only places that do are the consumer's `middleware.ts` and route handlers,
so any automatic sweep has to be wired in the template or the app — it cannot
live here without inventing a response-mutating API this package otherwise has
no need for.

### Fix

Two options, in increasing order of effort.

1. **Operational (available today, zero code).** `igrpDeleteAuthCookies()` from
   `@igrp/framework-next` matches by basename, so it already removes both the
   old and new forms. Call it on the logout path. Documented in this package's
   `README.md` under "Cookies → Upgrading".
2. **Automatic sweep.** Export a helper here, e.g.
   `staleAuthCookieNames(basePath, presentCookieNames): string[]` — pure, in
   `src/cookies.ts`, returning session-cookie names that share the basename but
   are not the current name. The template's middleware then expires each one on
   the response it already builds. Keep the naming logic in `src/cookies.ts`;
   a second copy downstream is how cookie naming drifts, which is the whole
   reason `./cookies` is a shared entry point.

Whichever is chosen, it is worth doing **before** the next basePath-affecting
cookie change, so the sweep exists the next time a rename happens.

### References

- `src/cookies.ts` — `SUFFIX_TERMINATOR`, `basePathCookieSuffix`,
  `sessionCookieName`
- `README.md` → "Cookies" → the upgrade note
- `packages/framework/next/src/lib/delete-auth-cookies.ts` — `igrpDeleteAuthCookies`,
  the basename matcher that already covers both forms
- `.changeset/*.md` for the release carrying the rename — the ⚠️ deploy note
