---
"@igrp/template-migrator": patch
---

Add a template-lock axis to the drift gate, and fix the stale lock it caught.

The template ships `.igrp-migrations-lock.json` inside the zip so a scaffolded app opens with every migration already applied. That lock had fallen 9 migrations behind (it recorded through `20-sidebar-trigger-in-header` while the CLI ships 29), so a brand-new app reported migrations it already contained as pending: `igrp-migrate check` failed on day one and `apply` re-ran finished work, recording `undo` entries for a state the app was never in.

- `check:drift` now reconciles the shipped lock as a fourth axis — alongside file payloads, dependency pins, and new files — failing on unrecorded migrations, entries for migrations that no longer exist, stale `manifestHash` values, and out-of-order entries. Nothing else covered this file: the orphan check exempts it by path and no migration manages its content.
- New `sync:template-lock` script regenerates the lock (`--check` for a dry run). Regeneration is append-and-refresh: existing entries keep their recorded `appliedAt` and `cliVersion`.
- `pack.ts` and the new lock logic now share `hashSteps()`, so a lock entry's `manifestHash` and the manifest's `contentHash` cannot be computed differently.
- Docs: corrected the `file.create` step-type reference (it overwrites an existing destination rather than failing), documented the previously-undocumented `env.remove` step type, and documented the lock axis and sync workflow.

Also fixes three consumer-visible defects found by running a full 29-migration upgrade and diffing the result against the template (which moved it from 64 to 101 of 102 files byte-identical):

- **Text payloads are now normalised to LF when packed into `dist/`.** Payloads are captured on Windows and carried CRLF while the live template is LF, so an upgraded app diverged from a scaffolded one in 37 of 44 managed files — the template's own Biome run would rewrite every one of them, and `git diff` after an `apply` showed whole-file churn instead of the change that landed. Binary payloads (NUL-byte detection) are still copied verbatim.
- **`deps.bump` now warns about dependencies the app doesn't declare** instead of skipping them silently. It still won't add them (that could contradict a deliberate removal), but a silent skip turned a load-bearing bump — e.g. the AM client that `29-permissions-catalog-sync` needs for `syncPermissions` — into a runtime failure long after `apply` reported success.
- **`apply` now says when `.env.example` gained keys.** Migrations never touch a consumer's real `.env`, so new settings previously landed only in the example file with nothing prompting anyone to copy them across — including credentials with no defaults that the app needs to boot.
- A corrupt template lock is now reported as a normal gate failure rather than crashing `check:drift` with a raw `JSON.parse` stack trace.
