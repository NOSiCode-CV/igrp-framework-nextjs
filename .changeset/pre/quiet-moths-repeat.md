---
"@igrp/igrp-framework-react-design-system": patch
---

Fix `InputGroupAddon` click-to-focus.

- **A consumer `onClick` silently disabled click-to-focus.** The internal handler was declared before `{...props}`, so `<InputGroupAddon onClick={…}>` overwrote it wholesale. `onClick` is now destructured and composed — the consumer handler runs first, and `e.defaultPrevented` gives it an opt-out.
- **Textarea groups never focused.** The handler looked for `querySelector("input")`, so clicking an addon in an `InputGroupTextarea` group focused nothing. It now targets `[data-slot="input-group-control"]`, which both controls render, and which cannot match an unrelated `<input>` nested in a different addon.
- **The interactive-element guard escaped the addon.** `closest("button")` walks past `currentTarget`, so every addon click bailed out when the whole group sat inside a button (a combobox trigger, a toolbar toggle). The match must now be contained by the addon.
- **Only `<button>` counted as interactive.** Clicking a link, checkbox, select or `[role="button"]` inside an addon stole focus to the control. The guard now covers the standard interactive set plus focusable `[tabindex]`.

The first and third items are deliberate divergence from upstream shadcn; `scripts/check-shadcn-drift.mjs` will report them on its next run.
