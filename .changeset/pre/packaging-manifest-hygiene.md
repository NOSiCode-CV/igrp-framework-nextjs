---
'@igrp/framework-next-auth': patch
'@igrp/framework-next-types': patch
'@igrp/igrp-framework-react-design-system': patch
'@igrp/framework-next-ui': patch
'@igrp/framework-next': patch
'@igrp/template-migrator': patch
---

Library packaging hygiene across all published packages:

- `@igrp/framework-next`: `next`, `react`, `react-dom` moved from `dependencies` to `peerDependencies` (range-based) — prevents duplicate React copies in consumer apps.
- All packages: exact-pinned `peerDependencies` relaxed to caret ranges (`react ^19.2.0`, `next ^15.5.0`, `next-auth ^4.24.0`, `zod ^4.4.0`, etc.) so consumers on newer patch/minor versions no longer get unmet-peer errors.
- `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`: `tailwindcss` moved to `devDependencies` (Tailwind compiles in the consuming app); unused `zod` dependency removed from `next-ui`; duplicated `publishConfig.exports` removed.
- `@igrp/framework-next-types`: added an `exports` map (blocks deep imports into `dist/`, consistent with the other packages).
- `@igrp/framework-next`, `@igrp/template-migrator`: `types` condition now listed first in `exports`.
- `@igrp/template-migrator`: added `license`, `author`, top-level `types`, `publishConfig.tag`/`access`; `clean` now uses cross-platform `rimraf`.
- All packages: added `repository`/`homepage`/`bugs` metadata, normalized `engines.node` to `>=22`, added `./package.json` export.
