---
"@igrp/template-migrator": patch
---

Honest rollback: `apply` now captures the prior content of overwritten/deleted files into the lock entry (`undoPayloads`), and `rollback` restores them. For lock entries written by older CLI versions (no stored payloads), `rollback` now refuses with a clear file list instead of silently half-reverting; `--force` keeps the old skip behavior explicitly. Adds the package's first test suite (executeStep, lock, convert, apply, rollback).
