---
"@igrp/template-migrator": patch
---

Hardening: numeric migration-file ordering (9 < 10 < 100); line-anchored
`env.add` idempotency + a real `env.remove` undo (rollback now strips added
keys); path-containment guard in `executeStep`; and `apply` enforces each
migration's `requires` before running it.
