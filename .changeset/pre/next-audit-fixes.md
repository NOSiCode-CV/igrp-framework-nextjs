---
"@igrp/framework-next": patch
---

- Branding: a freshness cookie that changes on every request now triggers at most one refetch per 5 s per process, instead of keeping a `getGlobalConfiguration` call in flight continuously.
- `igrpGetClaims` and the Server Action session gate now call `igrpAssertAuthBypassAllowed()` before honouring an auth bypass, so a production build with `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none` fails closed even when `instrumentation.ts` does not call the guard.
- `igrpBuildConfig` now requires a non-blank `appCode` whenever preview mode is off, not only when `syncAccess` is on, matching the sidebar's `IGRP_APP_CODE_MISSING` check.
- Removed deprecated exports: `IGRPLayout` / `IGRPLayoutArgs` (use `IGRPLayoutFull` / `IGRPLayoutFullArgs`), `igrpResetAccessClient` (use `igrpResetAccessClientConfig`), and the no-op server actions `revalidateMenusAction` / `revalidateAppsAction` (use `router.refresh()`).
