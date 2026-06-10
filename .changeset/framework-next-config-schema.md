---
"@igrp/framework-next": patch
---

`igrpBuildConfig` now validates the full config shape with a Zod schema, enforcing the previously documentation-only invariants: `previewMode`/`syncAccess` must be booleans, `layoutMockData` getters must be functions, `apiManagementConfig.baseUrl` is required when preview is off, and `serviceId`/`m2mClientId`/`m2mClientSecret`/`appCode` are required when sync is on outside preview. Failures throw `IgrpConfigError` with field-level context and a stable code (new code: `IGRP_CONFIG_INVALID`). Valid configs — including minimal preview-mode configs — are unaffected.
