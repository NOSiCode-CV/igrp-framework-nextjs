---
'@igrp/framework-next': patch
'@igrp/framework-next-ui': patch
---

Stop pointing developers at `IGRP_SESSION_REFETCH_INTERVAL`, which nothing
reads.

`@igrp/framework-next` — the claims-expired error returned by
`src/lib/permissions.ts` told the reader their poll interval was "too high" and
named the env var as the thing to lower. Following that advice does nothing.
The message now names what actually recovers the session (`IGRPSessionWatcher`
scheduling a refresh from `session.expiresAt`) and what to check when it does
not: that the watcher is mounted, and that the IdP is still issuing refresh
tokens.

`@igrp/framework-next-ui` — the comment in `IGRPSessionWatcher` describing the
fallback poll cited the env var and a "default 150s" that has not been true
since the adaptive scheduler landed. It now points at `sessionArgs.refetchInterval`
and states there is no env var for it.

Comment and message text only; no behavioural change.
