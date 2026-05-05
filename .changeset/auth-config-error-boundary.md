---
"@igrp/framework-next-auth": patch
---

Graceful error handling for invalid AUTH_PROVIDER configuration.

**Previously:** `withIGRPAuth()` threw synchronously at module-evaluation time when `AUTH_PROVIDER` was set to an unsupported value (e.g. `autentika`). This crashed the module before React loaded and showed a raw Next.js runtime error overlay with no helpful UI.

**Now:** `withIGRPAuth()` catches provider-resolution errors and stores them as `configError: IGRPAuthConfigError | null` on the returned instance. Errors are re-thrown lazily so App Router error boundaries can catch and render a proper diagnostic page:
- `GET` / `POST` handlers return a `500` HTML page with the error code and message.
- `serverSession()` / `getSession()` throw `IGRPAuthConfigError` during render — caught by the nearest `error.tsx` or `global-error.tsx`.

**New exports** from `@igrp/framework-next-auth/config`:
- `IGRPAuthConfigError` — typed error class (`name: 'IGRPAuthConfigError'`, `code: string`)
- `isIGRPAuthConfigError(error)` — structural guard (works across serialisation boundaries)
