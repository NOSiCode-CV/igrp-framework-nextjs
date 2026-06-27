---
"@igrp/template-migrator": patch
---

Add migration `22-session-args-auth-bypass`: rewrites the demo-v1
`get-session-args.ts` to gate session-refetch on `isAuthBypass()` instead of
`isPreviewMode()`, so `AUTH_PROVIDER=none` disables refetch per the bypass
contract.
