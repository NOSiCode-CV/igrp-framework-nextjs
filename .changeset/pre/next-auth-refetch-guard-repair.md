---
'@igrp/framework-next-auth': patch
---

Repair the `IGRP_SESSION_REFETCH_INTERVAL` check, which could never fire
correctly, and correct the docs around it.

`warnOnRefetchIntervalMisconfiguration` compared the env var against
`TOKEN_REFRESH_BUFFER_MS` and warned when it was too large. Nothing reads that
variable. The client poll cadence is whatever the app passes as
`sessionArgs.refetchInterval` — in `demo-v1`, a hardcoded 600s backstop — so the
check inspected one value while guarding another: it passed on the documented
`45` while the effective interval was `600`, ten times past the ceiling it
existed to enforce.

This is the fourth instance of the silent-no-op guard pattern recorded in the
repo's `KNOWN-ISSUES.md`, after the `'use client'` quote bug, the missing
`check:dist`, and the design system's `froms` regex.

The check now warns about the only thing it can observe and be right about: the
variable is set, and setting it does nothing. That makes it *capable of firing
correctly*, which the previous version was not. Dev-only, warn-once, unchanged
otherwise.

Docs corrected to match:

- `README.md` — the env table row is removed and the "`IGRP_SESSION_REFETCH_INTERVAL`
  has a hard ceiling" section is replaced by "There is no env var for the
  session-poll interval". The underlying constraint (a poll at or beyond the 60s
  proactive-refresh buffer only refreshes in read-only RSC context, where the
  rotated cookie cannot be persisted) is real and is retained — it is why
  `IGRPSessionWatcher` exists, not something a consumer configures.
- The `TOKEN_REFRESH_BUFFER_MS` comment no longer points at the env var.

No behavioural change beyond the warning text.
