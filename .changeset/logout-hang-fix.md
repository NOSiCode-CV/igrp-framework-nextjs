---
"@igrp/framework-next-auth": patch
"@igrp/framework-next-template": patch
---

Fix logout hanging on the "A terminar sessão…" spinner without clearing the session.

Two stacked defects caused RP-initiated logout to stall and leave the user still signed in:

- **next-auth (`oidc.ts`):** `events.signOut` awaits `revokeOidcSession` (and the OpenID discovery fetch before it), which blocks the `/api/auth/signout` response — and therefore the session-cookie clear — until it resolves. Those `fetch` calls had no timeout, so a slow or unreachable IdP hung sign-out indefinitely. Both the discovery and revocation requests on the sign-out critical path are now time-boxed via an `AbortController` (`IDP_FETCH_TIMEOUT_MS`), so local sign-out always completes promptly and the existing network-error handling kicks in.

- **template (`(auth)/logout/page.tsx`):** the 8s hard-navigation fallback timer was armed inside `useEffect` and cleared in its cleanup, but the module-scoped `logoutStarted` guard prevents the effect body from re-running. A remount during the logout window (React Strict Mode in dev, or `IGRPSessionWatcher` re-rendering the subtree on a session refetch) ran the cleanup — destroying the only safety net — while the guard blocked re-arming it, so a stalled async logout left the spinner up forever. The fallback timer is no longer cleared on unmount; the existing `settled` flag already prevents a double navigation.
