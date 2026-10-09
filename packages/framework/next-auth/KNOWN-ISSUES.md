# Known issues — `@igrp/framework-next-auth`

Understood, reproducible defects that are not yet fixed. Each entry is a
handover note: enough to act on without re-deriving the diagnosis. Cross-package
items live in the [repo-wide register](../../../KNOWN-ISSUES.md).

---

## 1. The pre-rename session cookie is orphaned, never swept

**Status:** mostly closed — the automatic sweep (`staleAuthCookies`, option 2
below) shipped on 2026-10-06 and the template middleware runs it. As of
2026-10-09: **(a)** root-path apps' stock-named orphan can now be swept with
`staleAuthCookies(basePath, names, { sweepStockNames: true })` — opt-in,
because the stock name could be a live cookie of an older co-hosted app; the
application center (a root-path app whose orphan reaches every co-hosted app
on every request) should wire it into its middleware. **(b)** the unhashed
names of a lossy basePath remain deliberately unswept and expire on their own.
Re-check this entry when the next basePath-affecting cookie change lands.
Introduced deliberately, with eyes open, by the basePath cookie-terminator fix
(2026-09-21).

**Severity:** low, but it grows with cookie size — see "why it is not purely
cosmetic".

> **2026-09-22 — a second, narrower rename now exists.** The injectivity fix in
> `basePathCookieSuffix` appends a disambiguating hash when slugging is lossy,
> so a basePath containing uppercase, `_`, `.` or a literal `-` renames once
> more and orphans one more cookie. Deployments on the ordinary shape
> (lowercase alphanumeric segments — `/apps/template`, `/apps/hr`, `/apps/a/b`)
> are deliberately **unaffected**: the hash is conditional precisely so the
> common case keeps the name it already has and this entry does not get worse
> for everyone. The remediation below is unchanged and covers both renames —
> `igrpDeleteAuthCookies()` matches by basename.
>
> This is the second rename in as many changes, which strengthens the closing
> argument: **do the sweep before the next basePath-affecting cookie change.**

> **2026-09-30 — a third rename: root-path apps.** An app without
> `NEXT_PUBLIC_BASE_PATH` now writes `next-auth.session-token~` instead of the
> stock name, because the stock name prefixed every co-hosted app's cookie
> (see `basePathCookieSuffix`). Each such app orphans its stock-named cookie
> once. The orphan is harmless to the fixed apps, none of which read it by
> prefix any more, but it adds header weight until it expires. Same remediation.

> **2026-10-06 — fourth rename, and the sweep now exists.** BasePath apps'
> auth cookies moved from `Path=/` to `Path=<basePath>` (`basePathCookiePath`)
> and were renamed `.<slug>~` → `.<slug>_p~` (`authCookieSuffix`), because at
> `Path=/` every co-hosted app's session cookie was sent on every request to
> the host and broke the IdP logout with `431` / `ERR_HTTP2_PROTOCOL_ERROR`.
> This time the sweep ships with the rename, as option 2 below:
> `staleAuthCookies(basePath, presentNames)` returns this app's previous
> names — the terminated and pre-terminator forms, with chunks — and the
> template middleware expires them at `Path=/`. Two gaps remain: root-path apps
> (their stock-named orphan from the third rename is not swept, because the
> stock name may be a live cookie of an older co-hosted app), and the unhashed
> names of a lossy basePath (shared with its lossless sibling). Both expire on
> their own. Existing apps get the sweep only once their `middleware.ts` picks
> up `expireStaleAuthCookies`.

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

Both options below are now in place.

1. **Operational.** `igrpDeleteAuthCookies()` from `@igrp/framework-next`
   matches by basename and expires each match at the path it was set at, so it
   removes every form on the logout path. Documented in this package's
   `README.md` under "Cookies → Upgrading".
2. **Automatic sweep — DONE 2026-10-06.** `staleAuthCookies(basePath,
presentCookieNames)` in `src/cookies.ts` returns this app's previous names
   (terminated and pre-terminator forms, with chunks, with or without the
   `__Secure-` prefix) and the options that expire them; the template's
   `middleware.ts` applies it to every response. Naming logic stays in
   `src/cookies.ts` only.

What the sweep cannot cover, by design, is listed under **Status**. The
sweep exists now, so the next basePath-affecting cookie change should extend
`staleAuthCookies` with the name it retires rather than orphan another cookie.

### References

- `src/cookies.ts` — `SUFFIX_TERMINATOR`, `basePathCookieSuffix`,
  `sessionCookieName`
- `README.md` → "Cookies" → the upgrade note
- `packages/framework/next/src/lib/delete-auth-cookies.ts` — `igrpDeleteAuthCookies`,
  the basename matcher that already covers both forms
- `.changeset/*.md` for the release carrying the rename — the ⚠️ deploy note
