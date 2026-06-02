---
"@igrp/template-migrator": patch
---

Add migration `11-callbackurl-hardening-and-error-copy` for `demo-legacy`, back-filling template changes that were never captured by a migration:

- **callbackUrl hardening** (open-redirect + login-loop prevention) across `middleware.ts`, `lib/auth.ts`, `lib/dal.ts`, and `app/(auth)/login/page.tsx` — basePath-aware sanitized `callbackUrl` and the `x-current-path` header contract (relies on `sanitizeCallbackUrl`, shipped in migration 10).
- **AppError error-copy surfacing** — new `lib/errors.ts`, plus `config/error-messages.ts` and `app/global-error.tsx` wiring `parsePublicDigest`/`resolveCopy` so server-thrown errors show their public message.
- Adds the `slug` field to `lib/config/get-pkj.ts`.
