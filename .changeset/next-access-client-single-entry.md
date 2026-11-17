---
"@igrp/framework-next": patch
---

`igrpEnsureAccessClientConfig(seed?)` is the one way to fill the per-request Access Management store. With a seed (`{ token, baseUrl?, timeout?, locale? }`) it applies it, `baseUrl` defaulting to `IGRP_ACCESS_MANAGEMENT_API`; without one it recovers the token from the session cookie, as before. `IGRPLayoutFull` and the header and sidebar data providers use it, and its doc comment holds the ordering rules. `igrpSetAccessClientConfig` is still exported.
