---
"@igrp/igrp-framework-react-design-system": patch
---

Replace raw color utilities with semantic tokens: add a `--highlight` / `--highlight-foreground` token (used by `IGRPText` highlighting) and drop manual `dark:bg-zinc-900/60` overrides on `IGRPModalDialog` sticky header/footer. Reconcile the legacy `index.css` theme with `tokens.css` by adding the previously missing `success`/`warning`/`info` tokens so the `/styles` build matches the `/tokens` export.
