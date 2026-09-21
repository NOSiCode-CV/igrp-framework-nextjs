# Known issues — `@igrp/framework-next`

Defects that are understood and reproducible but not yet fixed. Each entry is a
handover note: enough to act on without re-deriving the diagnosis.

---

## 1. `igrpGetClaims()` recovers no token in an app deployed under a `basePath`

**Status:** open · pre-existing · found 2026-09-21 during a review of
`@igrp/framework-next-auth` (not caused by that review's changes)

**Severity:** medium — permission checks fail closed (deny), they do not
over-grant. Confined to apps that set `NEXT_PUBLIC_BASE_PATH`.

### Symptom

In an app with `NEXT_PUBLIC_BASE_PATH` set, every permission check made from a
**Server Action** or **Route Handler** denies. `igrpGetClaims()` returns
`{ status: 'error' }`, so `igrpAssertAuthorize` / `IGRPAuthorization` refuse a
user who genuinely holds the permission. The same check made from a Server
Component render succeeds, which is what makes this look intermittent and
context-dependent rather than deterministic.

### Root cause

[`src/lib/permissions.ts:42`](src/lib/permissions.ts) —
`recoverAccessTokenFromCookies()` calls `getToken` without a `cookieName`:

```ts
const secureCookie = resolveSecureCookie(all.map((c) => c.name));
const token = await getToken({
  req: { cookies: Object.fromEntries(all.map((c) => [c.name, c.value])) },
  secret: process.env.NEXTAUTH_SECRET,
  ...(secureCookie !== undefined ? { secureCookie } : {}),
  // ← no cookieName
});
```

With `cookieName` omitted, `getToken` derives the **stock** NextAuth name
(`next-auth.session-token` / `__Secure-next-auth.session-token`). But
`withIGRPAuth` scopes every auth cookie name by the basePath whenever
`cookieIsolation` is `'basePath'` — its default — so the cookie actually present
is `next-auth.session-token.<slug>~` (e.g.
`next-auth.session-token.apps-template~`). No match, `getToken` returns `null`,
and the helper returns `''`.

`decodeIgrpClaims('')` then throws, which `igrpGetClaims` maps to its error
state. Nothing logs at the point of failure, so the deny surfaces far from the
cause.

This is exactly the case the rule in
[`packages/framework/next-auth/CLAUDE.md`](../next-auth/CLAUDE.md) exists to
prevent:

> Anything that reads the session cookie must go through `sessionCookieName()` /
> `resolveSecureCookie()`, never a hardcoded `next-auth.session-token`.

Half the rule is already followed here — `resolveSecureCookie` is imported and
used on the line above. Only the name half is missing.

### Why it only bites Server Actions / Route Handlers

`igrpGetClaims` prefers the token already in the AsyncLocalStorage store, which
the `(igrp)` layout seeds via `igrpSetAccessClientConfig`. The cookie-recovery
path runs only when no store was established — i.e. outside a render. See the
comment at `src/lib/permissions.ts:115`.

### Fix

`sessionCookieName` is already exported from `@igrp/framework-next-auth/cookies`,
the module this file imports `resolveSecureCookie` from. Pass it when a basePath
is set, and keep `getToken`'s own derivation when there is none:

```ts
import { resolveSecureCookie, sessionCookieName } from '@igrp/framework-next-auth/cookies';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const secureCookie = resolveSecureCookie(all.map((c) => c.name));
const token = await getToken({
  req: { cookies: Object.fromEntries(all.map((c) => [c.name, c.value])) },
  secret: process.env.NEXTAUTH_SECRET,
  ...(secureCookie !== undefined ? { secureCookie } : {}),
  ...(basePath
    ? { cookieName: sessionCookieName(basePath, secureCookie ?? <derived>) }
    : {}),
});
```

`withIGRPAuth.getAccessToken()` in
[`packages/framework/next-auth/src/config.ts`](../next-auth/src/config.ts) does
precisely this and is the reference implementation — including how it resolves
the `secure` flag when no session cookie is present to read it from.

**Do not** reimplement the naming here. A second copy of cookie naming is how the
two drift, which is why `@igrp/framework-next-auth/cookies` is a shared entry
point in the first place.

### Verification

- Unit test alongside the existing cases in `src/lib/__tests__/` — assert that
  with `NEXT_PUBLIC_BASE_PATH` set, `getToken` is called with the suffixed
  `cookieName`, and without it when the basePath is empty.
- Manual: run `templates/demo-v1` with `NEXT_PUBLIC_BASE_PATH=/apps/template`
  and call a permission-gated Server Action. It denies before the fix and
  succeeds after.
- Ship a `patch` changeset (patch only — see `.claude/shared/hard-rules.md`) and
  run `pnpm --filter @igrp/framework-next test` plus `pnpm build:next`.

### References

- `src/lib/permissions.ts:42` — `recoverAccessTokenFromCookies`
- `src/lib/permissions.ts:115` — why the path only runs outside a render
- `packages/framework/next-auth/src/cookies.ts` — `sessionCookieName`,
  `basePathCookieSuffix`, and why the suffix carries a `~` terminator
- `packages/framework/next-auth/src/config.ts` — `getAccessToken` /
  `getTokenFromRequest`, the two call sites that get this right
