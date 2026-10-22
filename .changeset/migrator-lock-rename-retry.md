---
"@igrp/template-migrator": patch
---

- On Windows, `apply` no longer aborts with `EPERM` when another process (antivirus, an editor, a dev-server watcher) briefly holds `.igrp-migrations-lock.json` open: the lock rename is retried for about 3 seconds.
- `deps.bump` no longer downgrades a dependency the app already moved past by hand (for example `@igrp/framework-next` 0.2.0-beta.12 when the migration pins 0.2.0-beta.9). It keeps the app's version and prints a warning. Rollback and the crash-recovery undo still restore older versions.
- `env.add` creates the env file's folder when the app deleted it, so migration 71 no longer fails on apps without `docker/development/`.
