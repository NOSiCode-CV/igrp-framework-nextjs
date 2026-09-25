---
'@igrp/template-migrator': patch
---

Add migration 37 — `37-cn-package-and-utils-removal`.

Catch-up for three template changes that were made without a migration, so the
drift gate had been failing on them and upgraded apps were diverging from
scaffolded ones.

The template stopped defining its own `cn` helper and took the `cn` package (a
compiled clsx + tailwind-merge replacement) instead. `src/app/(auth)/login/page.tsx`
and `src/lib/fonts.ts` now import it from there, and `src/lib/utils.ts` — whose
last export `cn` was, the rest having moved to `src/lib/utilities.ts` in
migration 26 — is deleted.

The `cn` dependency is bumped first, because the rewritten imports do not
resolve without it. Note that `deps.bump` only updates a dependency the app
already declares: an app without `cn` gets the "not declared by this app, so NOT
bumped" warning and must install it manually. The migration doc says so
prominently.

After this, the only remaining drift is the 9 dependency pins, which cannot be
captured until `version:changesets` has decided the versions.
