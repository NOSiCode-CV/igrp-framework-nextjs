---
"@igrp/igrp-framework-react-design-system": patch
---

Performance fixes from a review against the Vercel React rules:

- `IGRPDataTable` resolves TanStack state updaters in its reducer, not against the last render's state. Two updates in the same event (for example, toggling two rows in one handler, or a filter change racing a reset) no longer drop the first one.
- `IGRPInputNumber` and the expanded `IGRPAreaChart` axis reuse the shared `Intl.NumberFormat` cache. Before, an inline `formatOptions` object rebuilt the formatter on every parent render.
- `IGRPInputPhone` builds the country names once per locale, not once per mounted input.
- `IGRPSelect` groups options in one pass, not one filter per group on every search keystroke.
- `IGRPRichTextEditor` skips a second whole-document `getHTML()` when the value it just emitted comes back as the `value` prop.
- `IGRPFormList` in form mode watches each item's own path, not the whole array. A keystroke re-renders only the item being edited. `renderItem` and `computeLabel` still receive the live item.
