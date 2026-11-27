---
"@igrp/template-migrator": patch
---

`package.json` fields other than the dependencies now reach upgraded apps, and the test files from migrations 92 and 94 are removed.

- New step `pkg.set`: sets `package.json` fields except `name`, `description`, `displayName` and the dependencies. An object field such as `scripts` is merged, so scripts the app added stay. `null` removes a field or key.
- `check:drift` fails when a template `package.json` field differs from what the `pkg.set` steps leave behind.
- `file.delete` takes an optional `expect` payload. The file is deleted only when it still matches it; a changed file is kept, with a warning.
- Migration 102: `package.json` gets the template's `version`, `private`, `keywords`, `author`, `license`, `engines` and `scripts`. `vitest.config.mts` sets `passWithNoTests`. The 7 test files from 92 and 94 are deleted when unchanged.
