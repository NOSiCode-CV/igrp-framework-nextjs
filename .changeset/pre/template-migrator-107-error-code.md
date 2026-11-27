---
"@igrp/template-migrator": patch
---

Migration 107 (`107-error-code-digest`): `src/lib/error-copy.ts` gets `hasPlatformCode(error)`, which also reads a code from a server error's digest. `(auth)/error.tsx` uses it, so a server-thrown `IgrpError` keeps its catalog copy. The `(igrp)/page.tsx` comment now says the copy shows in production.
