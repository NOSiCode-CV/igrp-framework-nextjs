---
'@igrp/framework-next-types': patch
---

docs(next-types): remove stale m2mScope JSDoc

The JSDoc block above `appRoutes` in `apiManagementConfig` documented an `m2mScope` field that no longer exists (removed during the OAuth2 client_credentials migration 08). Removed the orphaned doc.
