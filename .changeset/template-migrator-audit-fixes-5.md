---
'@igrp/template-migrator': patch
---

Migration 88: the demo-v1 logout page sets the silent sign-in guard before going to `/login`, so a local-only logout (IdP slow, unreachable or without `end_session_endpoint`) no longer signs the user straight back in. `src/lib/auth.ts` drops its duplicate `NEXTAUTH_SECRET` check and uses `isNextControlFlowError`.

Migrator fixes:

- `file.delete` of a file that is already gone records an undo that rolls back cleanly. Before, an interrupted run left a journal that blocked every later `apply`. Deleting a directory is refused.
- A failed unwind keeps the journal and says which paths to restore, instead of reporting "rolled back".
- The journal is written before each step, so a kill mid-step can still be recovered.
- Undo content for binary files is stored as base64, so rollback restores them byte for byte.
- `env.add` / `env.remove` recognise `export KEY=` lines.
- `deps.*` steps leave `package.json` untouched when nothing changes, and keep its indentation.
- `rollback` reports every undo step that fails and leaves the migration recorded when one does.
