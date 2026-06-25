---
"@igrp/framework-next-auth": patch
"@igrp/framework-next-types": patch
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
---

Add token-claims permission gating: `decodeIgrpClaims`/`claimsAllow` (`@igrp/framework-next-auth/claims`), server helpers `igrpGetClaims`/`igrpAuthorize`/`igrpAssertAuthorize` (`@igrp/framework-next`), and client `IGRPSectionPermissions`/`usePermissions`/`IGRPAuthorization`/`IGRPGuardPage`/`IGRPForbidden` (`@igrp/framework-next-ui`).
