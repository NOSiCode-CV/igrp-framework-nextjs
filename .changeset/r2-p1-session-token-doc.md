---
"@igrp/framework-next-auth": patch
---

Document that the IGRP `Session` intentionally carries `accessToken` and
`idToken` to the client (the browser AM client reads `accessToken`;
`refreshToken` is omitted), and that consumers must never log or serialize the
session object client-side — telemetry must redact it. Added as JSDoc on the
`Session` type (ships in the published `.d.ts`) and a note at the session callback.
