---
'@igrp/framework-next-auth': patch
---

Fix a set of auth defects found across two deep reviews of
`@igrp/framework-next-auth`. **Three behaviour changes need reading before
deploying** — they are marked below.

### ⚠️ Auth cookies are renamed under a basePath

basePath cookie suffixes were not prefix-free, and NextAuth's `SessionStore`
collects every cookie whose name `startsWith` the configured one (that is how it
reassembles `.0`/`.1` chunks). `/apps/hr` therefore collected `/apps/hr-admin`'s
session cookie as one of its own chunks, concatenated the values, failed to
decrypt the result and saw no session — a permanent `/login` loop with a valid
cookie present. `SessionStore#clean()` then expired every collected name, so
signing in or out of `/apps/hr` deleted `/apps/hr-admin`'s session.

Suffixes now end in a `~` terminator (`next-auth.session-token.apps-hr~`), which
makes the set prefix-free. **This signs out current sessions once**, and the
pre-rename cookie is not cleared automatically — `igrpDeleteAuthCookies()` from
`@igrp/framework-next` matches by basename and sweeps both forms.

### ⚠️ An absent `AUTH_PROVIDER` no longer disables authentication

The default was `none`, so an app that never set the variable ran with auth off
— while the README documented `igrp-auth` as the default. The default is now
`igrp-auth`: an unconfigured app fails closed with the `IGRPAuthConfigError`
page (missing `IGRP_AUTH_*`) instead of serving unauthenticated traffic.
Disabling auth still works, but must be explicit: `AUTH_PROVIDER=none`.

### ⚠️ `AUTH_PROVIDER=` (empty) is refused, not defaulted

An empty assignment now throws with code `AUTH_PROVIDER_EMPTY`. It is deliberately
not treated as "absent": the value this variable falls back to decides whether
auth runs at all, so a typo must not be able to switch it off. `isAuthEnabled`
maps the throw to "enabled", i.e. the failure is closed as well as loud.

### Other fixes

- **Custom providers no longer expire on a schedule.** `withIGRPAuth({ provider:
  GitHubProvider({...}) })` stamped `authProviderId` from `AUTH_PROVIDER` (unset
  in that case), so the session was labelled `"none"`, discovery resolved to `''`,
  `fetch('')` threw and the first refresh force-logged the user out. The id now
  comes from the resolved provider; the jwt callback skips the whole OIDC
  lifecycle for a provider this package does not manage; and no access-token
  expiry is invented for one, so its session lasts as long as the NextAuth
  cookie instead of dying at the 5-minute fallback.
- **A missing `NEXTAUTH_SECRET` is an `IGRPAuthConfigError`** (`AUTH_SECRET_MISSING`)
  in production instead of a silent `/login` loop — `getToken` does not throw on
  a missing secret, it returns `null` for every request. Development warns only.
- **Warn when the IdP's access-token lifetime sits inside the 60 s
  proactive-refresh buffer**, where every session read refreshes and every server
  render treats the fresh session as expired and redirects to `/logout`. Checked
  on refreshed tokens too, not just at sign-in.
- **Rotation-recovery entries are validated and re-checked.** A recovered token
  whose access token is spent is still adopted (it carries the rotated refresh
  token) but now triggers a refresh instead of being returned dead; a malformed
  entry is ignored. Sign-out drops the session's entry via the new optional
  `IGRPTokenRecoveryStore.delete`, inside the existing sign-out time budget —
  which now covers every remote hop the event makes, not just the revoke.
- **`sanitizeRedirectUrl` keeps the fragment** on a same-origin absolute URL, so a
  deep link resolves identically whether passed absolute or relative.
- **`typecheck` runs before publish.** `release` is now `build && typecheck &&
  test && publish`. The compile-time guard for the `next-auth` module
  augmentation is only ever run by `tsc`, and nothing ran `tsc`. The package also
  enables `noUnusedLocals` / `noUnusedParameters`, since it has no ESLint config
  and `pnpm lint` silently skips packages without a `lint` script.

Also adds `isOidcManagedProviderId`, `forgetRecoveredToken`,
`isUsableRecoveredToken` and the `SessionAuthProviderId` type; makes
`getAuthProviderDefinition` throw a named error for an unknown id; and tightens
`dist-contract.test.ts` to reject a `.d.ts` that exports nothing.
