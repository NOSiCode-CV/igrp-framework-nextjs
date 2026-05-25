---
'@igrp/framework-next-types': patch
---

feat(types)!: migrate `apiManagementConfig` to OAuth2 `client_credentials`

**Breaking** changes to `IGRPConfigArgs['apiManagementConfig']`:

- **Removed** `m2mToken` — replaced by `m2mClientId` + `m2mClientSecret` (OAuth2 client_credentials). The downstream library (`@igrp/platform-access-management-client-ts`) still exposes `M2MClientConfig.token` as `@deprecated` for legacy pinning if needed.
- **Removed** `syncOnCodeMenus` — the field had no effect. All sync phases (application, routes, menus) are gated on the top-level `syncAccess` flag in `IGRPRootLayout`.
- **Renamed** `m2mServiceId` → `serviceId`. The value is service identity (resource name + `X-Machine-Service-ID` header), not an auth credential. The new prefix discipline: `m2m*` is reserved for OAuth2 credentials only.
- **Added** required `m2mClientId: string` and `m2mClientSecret: string` for OAuth2 client_credentials authentication.

Migration: rename `m2mServiceId` → `serviceId` and `m2mToken` → `m2mClientId`/`m2mClientSecret` in your `igrpBuildConfig` call. The TypeScript error guides the rename. See `templates/demo-legacy/src/igrp.template.config.ts` for the canonical shape.
