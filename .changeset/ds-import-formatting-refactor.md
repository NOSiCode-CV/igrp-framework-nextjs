---
"@igrp/igrp-framework-react-design-system": patch
---

refactor(ds): streamline imports and formatting in Horizon inputs, form, and i18n

Non-functional readability pass — no API or runtime behavior change:

- Consolidate multi-line imports/exports onto single lines in `input/search.tsx`, `input/text.tsx`, `i18n/context.tsx`, and `i18n/index.ts`.
- Reformat the `IGRPForm` `useEffect` dependency array (same dependencies) and collapse a wrapper `div` className in `IGRPInputText`.
