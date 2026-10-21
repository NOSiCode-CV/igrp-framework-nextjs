---
"@igrp/igrp-framework-react-design-system": patch
"@igrp/framework-next-ui": patch
---

Build: copy `src/*.css` into `dist/` with `--flat`. On Linux, `cpy` kept the `src/` folder (`dist/src/tokens.css`), so the `./tokens` export resolved to nothing and Tailwind failed to load it; Windows builds were unaffected.
