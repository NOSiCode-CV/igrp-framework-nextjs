---
"@igrp/igrp-framework-react-design-system": patch
"@igrp/framework-next-auth": patch
"@igrp/framework-next": patch
"@igrp/template-migrator": patch
---

- `cn()` is now backed by the official `cn` package instead of `clsx` + `tailwind-merge`; the exported API is unchanged for consumers.
- Resizable primitives updated to the react-resizable-panels v4 API (`Group`/`Separator`, `aria-orientation` variants); the drag handle grip icon is replaced by a slimmer bar.
- Build configuration fixes for `next-auth` (TypeScript deprecation flag) and `template-migrator` (explicit `node` types).
