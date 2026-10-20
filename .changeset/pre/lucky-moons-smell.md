---
"@igrp/igrp-framework-react-design-system": patch
---

Compose `IGRPInputPassword` and `IGRPInputUrl` with `InputGroup`, and clean up assorted markup.

- `IGRPInputPassword` now uses `InputGroup` / `InputGroupInput` / `InputGroupAddon` / `InputGroupButton` instead of a `relative` wrapper with an absolutely-positioned toggle and a `pr-10` reservation on the input. The focus ring, invalid border and disabled state now come from `InputGroup` rather than being re-implemented.
- `IGRPInputUrl` composes the protocol `Select` as an `inline-start` addon. This removes the hand-joined border hacks (`rounded-l-2xl rounded-none` on the trigger against `rounded-s-none` on the input — the `2xl` radius was almost certainly unintended).
- Both now apply `className` to the field root rather than to the label *and* the input.
- Chart lazy-loading fallbacks use `Skeleton` and forward `className`, so a chart with a custom height no longer flashes a fixed 200px placeholder and shifts layout.
- `SelectItem`s are wrapped in `SelectGroup` in the data-table filter, data-table pagination and url inputs.
- `w-N h-N` → `size-N` in the data-table filter, combobox and typography list.
- Removed duplicated `buttonVariants({ variant: "outline" })` classes (and their `dark:` adjustments) from the date-picker triggers, and the meaningless `aria-invalid` styling from `IGRPBadge`.
- Fixed the package's lint errors: a complex `useMemo` dependency in the data-table faceted filter, two write-then-overwrite locals in the pie chart, and four `react-refresh/only-export-components` violations (documented file-scoped disables, matching the convention already used in `primitives/button.tsx` and `i18n/context.tsx`). `eslint src` is now clean.
