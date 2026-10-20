---
'@igrp/template-migrator': patch
---

Ship migration 32 (`32-turbopack-root-probe-and-beta169-deps`) for `demo-v1`:

- Re-captures `next.config.ts` so `turbopackRoot` probes for `pnpm-workspace.yaml` and falls back to the app directory — standalone apps no longer root Turbopack two directories above themselves.
- Re-pins `@igrp/framework-next-ui` to `0.1.0-beta.165` and `@igrp/framework-next` to `0.1.0-beta.169` (layout retry fix + runtime image-host crash fix).
