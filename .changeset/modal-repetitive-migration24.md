---
"@igrp/igrp-framework-react-design-system": patch
"@igrp/framework-next-ui": patch
"@igrp/template-migrator": patch
---

- Add `IGRPRepetitiveComponent` — generic render-prop component for mapping a list of items with a key extractor, exported from the design system root
- Fix `IGRPModalDialog` sticky header/footer layout: use `-mx-6 px-6` for true edge-to-edge spanning, correct z-index to `z-10`, and add `max-h-[95vh]` on the full-size variant; simplify `IGRPModalDialogDescription` to accept standard `children` instead of a `name` shorthand prop
- Add template-migrator migration 24: resync `demo-v1` `(igrp)/layout.tsx` (hoists `IGRPQueryProvider`) and `.env.example` to beta.159, bumping all `@igrp/*` framework deps
