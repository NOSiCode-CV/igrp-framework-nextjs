---
'@igrp/igrp-framework-react-design-system': patch
---

Fix orientation styling on separators, sliders, tabs, toggle groups, scroll
bars, fields and button groups.

The primitives style orientation with `data-vertical:` / `data-horizontal:`,
but they wrap Radix, which only emits `data-orientation`, so none of those
styles applied. Visible effects that are now fixed:

- a vertical `Separator` was 0px wide;
- the `Slider` track was 0px tall, so the image cropper's zoom slider was
  invisible;
- horizontal `IGRPTabs` laid their content out beside the tab list instead of
  below it.

`tokens.css` now widens both variants to also match `data-orientation`
(ADR 0004). Apps that import `/tokens` pick this up on their next Tailwind
build. `IGRPTabs` keeps its tab-list and trigger heights unchanged.

One consequence: a plain height passed through `tabListClassName` on
horizontal tabs (e.g. `h-12`) now loses to the primitive's orientation-scoped
height. Use `group-data-horizontal/tabs:h-12` instead.
