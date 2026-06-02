---
"@igrp/framework-next-template": patch
---

Fix logout hanging on the "A terminar sessão…" spinner without clearing the session.

- **template (`(auth)/logout/page.tsx`):** the 8s hard-navigation fallback timer was armed inside `useEffect` and cleared in its cleanup, but the module-scoped `logoutStarted` guard prevents the effect body from re-running. A remount during the logout window (React Strict Mode in dev, or `IGRPSessionWatcher` re-rendering the subtree on a session refetch) ran the cleanup — destroying the only safety net — while the guard blocked re-arming it, so a stalled async logout left the spinner up forever. The fallback timer is no longer cleared on unmount; the existing `settled` flag already prevents a double navigation.
