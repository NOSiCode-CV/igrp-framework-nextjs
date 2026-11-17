---
'@igrp/igrp-framework-react-design-system': patch
---

Accessibility fixes for charts, the process stepper, badges and the add-on input, plus token contrast (WCAG 2.1 AA).

- Dark `--input` is now opaque `oklch(0.52 0.02 257)` (was `oklch(1 0 0 / 20%)`, 1.73:1). Field borders reach 3.67:1 on `--background` and 3.24:1 on `--card`; the `bg-input/30` field fill stays subtle.
- Chart series now reach 3:1 against the page background, hue unchanged. Light: `--chart-4` `oklch(0.66 0.17 84.429)`, `--chart-5` `oklch(0.58 0.17 70.08)`, `--chart-8` `oklch(0.63 0.2 130.85)`. Dark: `--chart-1` `oklch(0.53 0.243 264.376)`.
- Area, line, bar, pie, radar and radial charts with a `title` or `description` render as `role="figure"`, named by the title and described by the description.
- `IGRPStepperProcess`: a completed step keeps its title as the button's accessible name (visually hidden until hover) and announces "concluído" (new i18n key `stepper.completed`).
- `IGRPBadge`: the `dot` indicator is hidden from assistive tech, and an icon-only badge without `aria-label` logs a development warning.
- `IGRPInputAddOn`: the wrapper shows the focus ring when the embedded select or input has focus.
