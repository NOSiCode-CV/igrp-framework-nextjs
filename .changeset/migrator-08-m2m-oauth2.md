---
'@igrp/template-migrator': patch
---

feat(template-migrator): bundle migration 08 — M2M OAuth2 `client_credentials`

Adds `migrations/demo-legacy/08.MIGRATIONS-21052026.md` and `payload/08/{.env.example,igrp.template.config.ts}` to the CLI bundle so consumers can apply the OAuth2 `client_credentials` AM-sync migration via `pnpm dlx @igrp/template-migrator@latest apply`.

Pins `targetFrameworkVersion: 0.1.0-beta.137` and bumps `@igrp/framework-next` / `@igrp/framework-next-types` to the published beta versions that ship the new OAuth2 flow.

Also includes a minor wording fix in `06.MIGRATIONS-23042026.md`.
