---
status: accepted
---

# `data-open` / `data-closed` are widened in `tokens.css` to match Radix's `data-state`

`tokens.css` declares `@custom-variant data-open (&[data-open]:not([data-open="false"]), &[data-state="open"]);` and the matching `data-closed`. Since the 2026-09-15 shadcn sync (`e0015f2d`, shipped in `0.2.0-beta.1`) the primitives style open state with `data-open:` / `data-closed:`, which upstream targets Base UI. Our primitives wrap Radix, which only emits `data-state="open" | "closed"`, so none of it applied: no enter/exit animation on dialog, alert-dialog, sheet, drawer, popover, hover-card, select, tooltip (exit), dropdown/context menus, menubar or navigation-menu, no accordion open/close animation, and no open highlight on sub-menu and navigation-menu triggers. Same decision as ADR 0002, ADR 0004 and ADR 0005.

## Consequences

- Exit animations now run, so Radix `Presence` waits for `animationend` before unmounting closed content.
- The same sync gave `AccordionContent`'s body `h-(--radix-accordion-content-height)`. Radix measures that variable once on open, so the fixed height clipped anything that rendered later (upload results, validation messages, conditional fields in `IGRPFormList` rows). It is removed; the keyframes on the outer element are the only consumer of the variable.
- Tooltip opens with `data-state="delayed-open" | "instant-open"`, which neither variant covers, so tooltips still have no enter animation. That is not a regression.
- Removing these lines brings the defect back; they are load-bearing.
