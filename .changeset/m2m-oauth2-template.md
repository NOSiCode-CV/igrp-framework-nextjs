---
'@igrp/framework-next-template': patch
---

feat(template)!: switch to OAuth2 `client_credentials` for AM sync

`igrp.template.config.ts`, `.env.example`, and the README's M2M section are updated for the OAuth2 client_credentials flow.

**`.env` migration**:

- Remove `IGRP_M2M_TOKEN`.
- Remove `IGRP_SYNC_ON_CODE_MENUS` (had no effect — sync was always gated on `IGRP_SYNC_ACCESS`).
- Rename `IGRP_M2M_SERVICE_ID` → `IGRP_SERVICE_ID` (this is service identity, not an auth credential).
- Add `IGRP_M2M_CLIENT_ID` and `IGRP_M2M_CLIENT_SECRET` (request them from your Access Management admin).
- Optionally add `IGRP_M2M_SCOPE` if your AM admin issues scoped tokens.

When `IGRP_SYNC_ACCESS=true` and `IGRP_PREVIEW_MODE=false`, the framework now validates all required env vars during render of `IGRPRootLayout`. Missing or malformed values surface as `IgrpConfigError` in `global-error.tsx` with code `IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING`, instead of a silent failure inside `after()`.

See `packages/template-migrator/migrations/demo-legacy/08.MIGRATIONS-21052026.md` for the full migration guide and `payload/08/*` for the canonical config files.
