---
'@igrp/igrp-framework-react-design-system': patch
---

Add `@igrp/igrp-framework-react-design-system/cn` — a server-safe entry point for
`cn`.

`src/index.ts` opens with `"use client"`, so the entire root barrel is a client
boundary. That is right for components, but it also captured `cn`, a pure string
function with no React in it. Server code importing `cn` from the root failed at
build time:

```
Error: Attempted to call cn() from the server but cn is on the client.
> Build error occurred
[Error: Failed to collect page data for /admin/users]
```

Until now the package had **no way at all** to hand `cn` to a server module, so
the consuming rule ("always take `cn` from the design system") was unsatisfiable
in exactly the place it mattered. Consumers worked around it by depending on the
`cn` package directly, which then floated out of sync with the version pinned
here — `templates/demo-v1` carried `^0.3.0` against this package's exact `0.3.0`.

`./cn` is the same function, re-exported from the same `cn` package, emitted as
its own module with no directive. Client components can keep importing from the
root; nothing about the existing surface changes.

**Why this needed a build-level guard.** The failure is invisible to every check
short of a real `next build`: `tsc --noEmit` passes, lint passes, and the error
only appears during Next's page-data collection — *after* "Compiled successfully"
and *after* types validate. It is then attributed to whichever route pulled the
root layout in first, never to the file at fault. A CI gate built from typecheck
plus lint reports green.

So `src/server-safe-entries.test.ts` asserts on the **built output**: that
`dist/cn.js` carries no `"use client"` directive, that it does not reach the
client barrel, and — because a guard that can pass while reading nothing is not a
guard — that it actually found the files it claims to check, plus that the root
barrel really is still a client boundary (otherwise the whole test distinguishes
nothing). Same shape as `build-pipeline.test.ts`, which was itself a silent
no-op until 2026-09-22.

Add any future server-safe entry to `SERVER_SAFE_ENTRIES` in that test.
