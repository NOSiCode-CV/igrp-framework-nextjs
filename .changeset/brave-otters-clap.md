---
"@igrp/igrp-framework-react-design-system": patch
---

Close out the remaining design-system review findings.

- **`IGRPInputSearch` composed with `InputGroup`.** The leading icon and submit button were absolutely positioned over a `relative` wrapper, with `ps-6.5` / `pe-9` padding reserved on the control by hand. They are now `InputGroupAddon`s, and the border, focus ring and `aria-invalid` styling come from `InputGroup` instead of being re-implemented on the input.
- **New `--ring-invalid` token.** `IGRPInputNumber` and `IGRPInputPhone` were the last two Horizon components carrying `dark:` overrides (`dark:ring-destructive/40`), which the package's own policy restricts to the Primitives layer. The light/dark alpha step now lives in `tokens.css` as `--ring-invalid` (destructive at 20% / 40%), so the components use a single `ring-ring-invalid` and the Horizon layer is free of `dark:` entirely.
- **`space-y-*` → `gap-*`** in the three calendar time pickers, `IGRPChat` and `IGRPAlert` (16 occurrences). The remaining five are legitimate: `flex` would break list markers on `list-disc` lists, and one is an inert `space-y-0` under `display: contents`.
- **Valid table markup.** The data table's trailing spacer was a `<tbody>` forced to `display: table-row`; it is now a `<tbody>` containing one spacer `<tr>`.
- **`"use client"` added** to the ten Horizon/Custom components that were missing it (`dropdown-menu`, `menubar`, `sidebar`, `card`, `container`, `stats-card`, `field-description`, and the three `custom/` components). All are reached through the `"use client"` barrel today, so this changes nothing at runtime — it removes a latent break if a subpath export is ever added.

Snapshot baselines updated for the affected components. The visual suite is 483/483 across 78 suites, verified stable over two consecutive runs.
