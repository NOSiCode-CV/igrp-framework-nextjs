---
"@igrp/framework-next-types": patch
"@igrp/framework-next": patch
---

- **Breaking (types):** remove the fields deprecated one release ago — `IGRPConfigArgs.layoutMockData`, `.showLanguageSelector`, `.loginUrl`, `.logoutUrl`, `.showSettings`; `IGRPSidebarDataArgs.showPreviewMode`; and the types `IGRPMockDataAsync`, `IGRPMockData`, `IGRPConfigurationType`, `IGRPRoleUserArgs`, `IGRPGlobalConfigurationArgs`, `IGRPFileUrlArgs`, `IGRPResourceType`, `IGRPResourceItem`, `IGRPResourceArgs` (import the AM ones from `@igrp/platform-access-management-client-ts`). `IGRPConfigArgs.layoutData` is now required.
- `igrpBuildConfig` / `igrpResolveLayoutDataSource` no longer fall back to `layoutMockData`; a config that still sets it fails validation with a hint to rename it to `layoutData`.
