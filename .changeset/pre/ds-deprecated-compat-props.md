---
"@igrp/igrp-framework-react-design-system": patch
---

Restore props removed since 0.1.x as `@deprecated` shims, so apps written against 0.1.0-beta.126 compile and render again. They will be removed in the next release.

- `IGRPRadioGroup`: `size` and `gridSize` are accepted again but have no effect. `variant="outline" | "soft"` renders as `"default"`.
- `IGRPAvatar`: `size` is used as `scale` when `scale` is unset (`"default"` → `"md"`), and it no longer reaches the primitive.
- `IGRPButton`: `iconSize` is accepted but has no effect (the icon is sized by `size`).
- `IGRPInputColor`: `showHexValue` is an alias for `showFormatValue`.
- `IGRPInputNumber`: `onChange` is declared with method syntax, so `(value: number) => void` handlers compile again.
- `IGRPDataTableCellDate`: `dateFormat` (a date-fns pattern) takes precedence when set.
- `IGRPModalDialogContent`: `showCloseButtonClassName` is applied to the close button.
- `IGRPModalDialogDescription`: `name` is rendered when there are no children.
- `IGRPStandaloneList` / `IGRPStandaloneListProps` are exported again as a wrapper over `IGRPFormList`'s standalone mode.

`IGRPDataTableCellDate` and `IGRPDataTableCellAmount` now default `language` to the `IGRPI18nProvider` locale (`pt-PT`) instead of `en-US`, which restores the dd/MM/yyyy dates of 0.1.x.

Removed: the `IGRPGridSize` type and `igrpGridSizeClasses` export (deprecated grid-size layout). `IGRPInputPassword`'s deprecated `IGRPGridSize` prop is now typed as `string`.
