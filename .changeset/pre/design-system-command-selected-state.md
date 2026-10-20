---
'@igrp/igrp-framework-react-design-system': patch
---

Fix `CommandItem` rendering every row as highlighted, and drop the grey fill
from `CommandInput` in light mode.

- cmdk 1.1 renders `data-selected="false"` on unselected items. Tailwind v4's
  bare `data-selected:` variant matches whenever the attribute is present, so
  `data-selected:bg-muted` painted every item, and highlighted and
  non-highlighted rows looked the same. The item, its icons and
  `CommandShortcut` now key on `data-[selected=true]:`. This affects every
  `Command` surface: the command palette, `IGRPInputCombobox` and the data-table
  filter.
- `CommandInput` filled its box with `bg-input/30`. Upstream sizes that for a
  near-white `--input`, but ours is 0.64 for WCAG 1.4.11, so it read as a grey
  slab. Light mode is now transparent with a `border-border` edge. Dark mode
  keeps `InputGroup`'s `dark:bg-input/30`.
