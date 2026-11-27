---
"@igrp/framework-next-auth": patch
---

`isIgrpAuthBypass()` now answers like the `withIGRPAuth` instance, which the middleware already follows. Before, an app with `provider: 'igrp-auth'` and a leftover `AUTH_PROVIDER=none` had server actions and permission checks bypass auth while the middleware enforced it. The instance registers its answer with the new `registerIGRPAuthBypass()` from `./providers`; a call with an explicit env other than `process.env` still reads that env.

Config errors from `AUTH_PROVIDER` now carry their code (`AUTH_PROVIDER_EMPTY`, `AUTH_PROVIDER_INVALID`) on the thrown error instead of being matched by message text, so rewording a message no longer changes the code.
