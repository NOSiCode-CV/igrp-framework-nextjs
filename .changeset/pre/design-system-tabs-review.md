---
'@igrp/igrp-framework-react-design-system': patch
---

Fix `IGRPTabs` and the `Tabs` primitive.

- The selected tab had no styling in `default` and `cards`, and the `underline`
  indicator was invisible: the primitive styles the selected trigger with
  `data-active:`, but Radix only emits `data-state="active"`. `tokens.css` now
  widens `data-active` to also match it (ADR 0005). Apps that import `/tokens`
  pick this up on their next Tailwind build.
- `pills` rendered the selected label in `muted-foreground` on `primary`; it now
  uses `primary-foreground`. `underline` renders the primitive's `line` variant.
- Reduced motion is respected: the `scroll-smooth` class overrode the scroll
  behaviour chosen in JS. The tab list now grows past its container (`w-max` was
  being overridden by `w-fit`) so its background and border cover every tab.
- Scroll arrows no longer mount and unmount while scrolling (focus was lost when
  the end arrow disappeared); the one at the limit is `aria-disabled`. Overflow
  is re-measured when the list itself resizes, and RTL is handled.
- `IGRPTabItem.className` is applied to the trigger (it was ignored). New
  `ariaLabel` names icon-only tabs, and new `keepMounted` keeps a panel mounted
  while inactive.
- The default tab is the first enabled one, and an active tab removed from
  `items` falls back to it. `id` now takes precedence over `name` for the root
  id. `children` and `asChild` are no longer accepted props.
- The `Tabs` primitive now forwards `orientation` to Radix, so vertical tabs
  report `aria-orientation="vertical"` and use the up/down arrow keys.
