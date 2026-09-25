---
"@igrp/template-migrator": patch
---

Slim the shipped template lock, and ship migration `41-query-client-comment-trim`.

**Lock shape.** `LockEntry.undo` and `LockEntry.fileHashes` are now optional, and the template's shipped `.igrp-migrations-lock.json` omits them. Every one of its entries is a *baseline* entry — the template ships its own lock so a scaffolded app opens with every migration already applied, but nothing was executed against a file tree there, so there is no undo to record. Forty-one copies of `undo: []` and `fileHashes: {}` stated nothing the absence of the fields does not. Each entry is now:

```json
{ "id": "...", "appliedAt": "...", "cliVersion": "...", "manifestHash": "..." }
```

Readers treat missing as empty (`entry.undo ?? []`). An entry that carries real undo content keeps it — that can only come from a lock a consumer actually ran against.

`scripts/sync-template-lock.ts` now compares the serialised bytes, not just the semantics. It previously reported "already up to date" whenever the ids and hashes matched, which meant a lock left in an outdated shape was something it could not repair despite owning the file.

**Migration 41** re-captures `src/providers/query-client.server.ts` after a comment-only trim in the template, so apps upgraded through the CLI and apps scaffolded from the zip agree byte-for-byte. No runtime change.
