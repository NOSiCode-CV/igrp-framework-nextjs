---
"@igrp/framework-next-auth": patch
---

Fix `next build` failing for any app whose middleware imports the `withIGRPAuth` instance: "Dynamic Code Evaluation (e. g. 'eval', 'new Function', 'WebAssembly.compile') not allowed in Edge Runtime", traced through `next-auth/utils/logger.js` to `@babel/runtime/regenerator`.

`withIGRPAuth` loads the `next-auth` main package lazily, which kept it out of the Edge runtime but not out of the Edge build: webpack still compiled the lazy chunk into the middleware bundle. The import now sits behind `process.env.NEXT_RUNTIME !== 'edge'`, which Next inlines per compilation, so the Edge build drops it. Node behaviour is unchanged.
