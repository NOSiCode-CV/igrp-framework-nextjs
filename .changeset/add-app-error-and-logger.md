---
"@igrp/framework-next": patch
---

Add `@igrp/framework-next/app-error` and `@igrp/framework-next/logger` subpath exports.

**`/app-error`** — `AppError`, `parsePublicDigest`, `getDisplayableErrorMessage`, and related types/constants for passing user-friendly messages through Next.js production sanitization of `error.message` via `error.digest`.

**`/logger`** — minimal `logger` object (`error`, `warn`, `info`) with consistent `[Error]` / `[Warn]` / `[Info]` prefixes. Drop-in integration point for Sentry / OpenTelemetry without changing call sites.
