---
'@igrp/framework-next': patch
'@igrp/framework-next-ui': patch
---

A tab that regains focus now asks Access Management whether its session is still alive, so an idle tab notices a session that ended elsewhere (a logout cascade, an admin kill) before the user acts on stale data.

- `@igrp/framework-next`: new server action `igrpCheckAccessSession()` in `./actions`, returning `{ valid, reason }`. It answers `valid: true` under auth bypass, with no session, and on any failure, so an AM outage never signs users out. `IGRPRootLayout` passes it to the providers (not in preview mode).
- `@igrp/framework-next-ui`: `IGRPSessionWatcher` and `IGRPNestedProviders` take an optional `checkSession` prop. On `visibilitychange` to visible, at most once per 60 s, a `valid: false` goes to `/login?reason=session_ended`: a session AM only evicted (`SESSION_LIMIT_EXCEEDED`) comes back through silent sign-in, a real logout (`USER_LOGOUT`) shows the form. Without the prop the watcher behaves as before.
