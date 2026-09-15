---
"@igrp/igrp-framework-react-design-system": patch
---

Close out a WCAG 2.1 AA audit of the design system.

**Tokens (`tokens.css`)** — every pair below was measured in OKLCH and now meets
4.5:1 for text / 3:1 for UI boundaries in both themes:

- Light `--warning` was 2.15:1 as text on the page background; darkened to match the
  lightness of `--success` / `--info`, and `--warning-foreground` flipped to near-white
  so solid warning fills still pass.
- Dark `--destructive-foreground`, `--info-foreground` and `--indigo-foreground` were
  near-white on light fills (2.7-3.6:1); they are now dark, as `--warning-foreground`
  already was. `--info` lightened so its soft tint clears 4.5:1.
- Light `--border` / `--input` / `--ring` (and their sidebar twins) were 1.2-2.6:1
  against the page — below the 3:1 needed to identify a control. Dark `--border`
  went 10% -> 20%.
- `--muted-foreground` and light `--destructive` nudged to clear 4.5:1 on every surface.
- `IGRPColors.soft.*` tints drop from `/10` to `/5`: a same-hue tint at 10% pulled the
  surface toward the text and held several variants just under 4.5:1.

**Components**

- `IGRPInputPassword`: the show/hide toggle was `tabIndex={-1}`, so keyboard-only users
  could never reveal what they typed.
- `IGRPDataTable`: `aria-sort` moved from a wrapper `<div>` to the `<th>`. It is only
  honoured on a `columnheader`, so sort state was never announced.
- `IGRPTextList`: adds `aria-expanded` for collapsible items and `aria-disabled` for
  disabled ones (which are no longer focusable); items render as `<li>` so the `<ul>`
  has valid children; the colour variant now uses the `outline` slot, since the `solid`
  slot's foreground is meant for a filled surface, not the page background.
- `IGRPMenuNavigation`: `role="listitem"` moved off the `<button>` onto a wrapping row.
  On the button it replaced the button role and the item stopped announcing as clickable.
- `IGRPPdfViewerCard`: focusable when clickable but had no focus indicator.
- `IGRPAlert`: solid variants no longer override their paired `*-foreground` with the
  page background colour.
- `IGRPIcon`: falls back to `useId()` rather than the icon name, which emitted duplicate
  DOM ids for every repeat of an icon.
- `IGRPInputSelect`: the option thumbnail is marked decorative instead of repeating the
  option label to screen readers.

**Gates** — `eslint-plugin-jsx-a11y` in the package lint config (relaxed in
`primitives/` only for rules that fire on unmodified upstream shadcn markup), and a
`tokens-contrast.test.ts` that recomputes every token pair and fails on a regression.
