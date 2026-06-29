---
"@igrp/template-migrator": patch
---

Validate migration `requires` at pack time. `pack.ts` now rejects duplicate
migration ids and any `requires` entry that doesn't resolve to a strictly earlier
migration (forward reference, typo, or unknown id). `apply` checks `requires`
against applied ids but executes in file order, so a bad `requires` would
otherwise ship in the manifest and permanently deadlock `apply` on consumer apps.
