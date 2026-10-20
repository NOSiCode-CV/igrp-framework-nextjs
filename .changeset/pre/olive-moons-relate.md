---
"@igrp/igrp-framework-react-design-system": patch
---

fix(info-card): wire up `orientation` and the color variants; drop the no-op `variantItem`

`IGRPInfoCard` declared several props that were never read — the destructures
sat commented out in the component, so passing them did nothing.

- `orientation` now works. `vertical` (the default, unchanged) stacks the label
  above the value; `horizontal` places them side by side.
- New `columns` prop (`1` | `2` | `3`, default `1`) flows a section's items into
  a responsive grid instead of a single column.
- Both responsive behaviours key off the **card's own width** via a container
  query, not the viewport. An info card is routinely placed in a narrow grid
  cell or sidebar, where a viewport breakpoint reports far more room than the
  card actually has.
- `variantSection` / `colorSection` applied only the background class, so the
  card kept the `text-card-foreground` it inherits from the `Card` primitive.
  `solid` therefore painted dark text on a filled background — a contrast
  failure — while `outline` rendered as a plain card because its border and
  accent were dropped. All three variants now apply their full slot.
- Sections render as a description list (`dl` / `dt` / `dd`), so assistive
  technology reads each value as the value *of* its label instead of as loose
  adjacent text. **This changes the rendered markup**: each section is now a
  `dl`, and each field a `div` wrapping a `dt` and `dd` rather than nested
  `div`/`span`. Selectors or snapshots targeting the old structure need updating.
- Labels use `text-muted-foreground` for hierarchy, dimming to `opacity-80` on
  solid fills where a second color token would not read.
- The header is no longer rendered when no `title` is given, instead of leaving
  an empty heading block.

**Removed:** `variantItem` on `IGRPInfoItem`. Every role in `IGRPColors` maps to
the same `textCard` class, so the prop could not affect rendering no matter what
it was set to. Per-item accenting is now `colorItem` alone; drop `variantItem`
from any call site. It is ignored under `variantSection="solid"`, where a
per-item color cannot contrast against the filled background.

**Added:** a `bgStatic` slot on every `IGRPColors` entry — the background with
interactive state variants removed, for non-interactive surfaces. The `solid`
backgrounds carry a `hover:` class intended for buttons, which an info card
should never apply. `colors.test.ts` asserts `bgStatic` stays in sync with `bg`.

`orientation` and `columns` default to the previous behaviour, so existing usage
is unaffected apart from the markup change noted above.
