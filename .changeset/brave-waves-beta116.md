---
"@igrp/igrp-framework-react-design-system": patch
"@igrp/framework-next-auth": patch
"@igrp/framework-next-types": patch
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
"@igrp/template-migrator": patch
---

beta.116 — template migrator CLI, lock file relocation, and release tooling fixes.

@igrp/template-migrator
- New CLI package that automates IGRP template upgrades via `pnpm dlx @igrp/template-migrator@latest`.
- Bundles all 6 demo-legacy migration guides (01–06) as a cumulative manifest with embedded payloads.
- Commands: status, plan, apply (--yes / --to), list, rollback, check (CI gate).
- Lock file moved from root `.igrpmigrations.lock.json` → `.igrpmigrations/lock.json`; backward-compat read of old path on first run.
- Prebuild pack script cleans payload output on every run to prevent stale files.
- tsup config: shims disabled (no __dirname polyfill injection before shebang), banner removed (shebang lives in src/cli.ts line 1).

@igrp/framework-next-template (templates/demo-legacy)
- `.igrpmigrations/lock.json` pre-seeded to mark all 6 migrations as applied.
- `create-zip-template.ps1` updated to strip migration guides and payloads from the published zip — only `lock.json` is included so consumers start fully up-to-date.
- `MIGRATING.md` added: end-user upgrade guide (status → plan → apply workflow).
