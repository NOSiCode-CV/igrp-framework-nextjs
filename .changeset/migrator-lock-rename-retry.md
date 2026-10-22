---
"@igrp/template-migrator": patch
---

On Windows, `apply` no longer aborts with `EPERM` when another process (antivirus, an editor, a dev-server watcher) briefly holds `.igrp-migrations-lock.json` open: the lock rename is retried for about 3 seconds.
