---
"@igrp/igrp-framework-react-design-system": patch
---

`src/index.css` (the Storybook root stylesheet) now `@import`s `./tokens.css`
instead of carrying a hand-maintained duplicate of the `@theme inline` / `:root`
/ `.dark` token blocks. The duplicate had drifted — it lacked
`--destructive-foreground`, `--indigo*`, and `--sidebar-active*` (which
`lib/colors.ts` emits), so Storybook rendered those variants with undefined
custom properties. `tokens.css` is now the single source of truth.
