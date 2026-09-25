---
status: accepted
---

# `data-vertical` / `data-horizontal` are widened in `tokens.css` to match Radix's `data-orientation`

The same decision as ADR 0002, applied to orientation. `tokens.css` declares `@custom-variant data-vertical (&[data-vertical], &[data-orientation="vertical"]);` and the matching `data-horizontal`. The shadcn primitives (`separator`, `tabs`, `toggle-group`, `slider`, `scroll-area`, `field`, `button-group`) style orientation with `data-vertical:` / `data-horizontal:`, which upstream targets Base UI. Our primitives wrap Radix, which only emits `data-orientation`, so none of those styles ever applied. The visible results were a vertical `Separator` 0px wide, a `Slider` track 0px tall (the image cropper's zoom slider was invisible), and horizontal `IGRPTabs` laying their content out beside the list instead of below it.

No primitive relied on the narrow meaning: nothing in `src/` sets a bare `data-vertical` / `data-horizontal` attribute, and every element these variants target is a Radix part that emits `data-orientation`, or a primitive that sets it explicitly. Compounds such as `group-data-vertical/tabs:` and `group-has-data-horizontal/field:` resolve through the custom variant. `src/components/primitives/__tests__/orientation-variant.test.ts` compiles them with Tailwind to prove it.

## Consequences

- Styles that were dead are now live, so a caller that had compensated can double up. `IGRPTabs` did: the primitive's upstream `group-data-horizontal/tabs:h-9` would have shrunk Horizon's `py-1.5` triggers and overridden the `underline` / `cards` `h-auto`, so Horizon pins `group-data-horizontal/tabs:h-auto` (measured before and after: list and trigger heights unchanged).
- The newly live variant carries an attribute selector, so it beats a plain utility of the same property. For example, a plain `h-12` passed through `tabListClassName` on horizontal tabs loses to it. Override with the same modifier (`group-data-horizontal/tabs:h-12`).
- As with ADR 0002, removing these lines brings the defect back across the kit.
