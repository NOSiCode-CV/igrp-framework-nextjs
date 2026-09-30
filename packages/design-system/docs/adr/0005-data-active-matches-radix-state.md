---
status: accepted
---

# `data-active` is widened in `tokens.css` to match Radix's `data-state="active"`

`tokens.css` declares `@custom-variant data-active (&[data-active], &[data-state="active"]);`. The `tabs` primitive styles the selected trigger with `data-active:bg-background`, `data-active:shadow-sm`, `data-active:after:opacity-100` and friends, which upstream targets Base UI. Our primitive wraps Radix, which only emits `data-state="active"`, so none of it applied: the selected `default` and `cards` tab looked identical to its siblings and the `underline` indicator stayed at `after:opacity-0`. Same decision as ADR 0002 and ADR 0004.

## Consequences

- The variant is a strict superset of Tailwind's `data-active:` (`[data-active]`). `sidebar`, `pagination` and `input-otp` set `data-active` themselves and match exactly as before.
- Styles that were dead are now live, so Horizon `IGRPTabs` had to be re-checked: its per-variant `data-[state=active]:*` overrides now compete with the primitive's `data-active:*` classes at equal specificity, and Horizon resets the primitive's `data-active` surface per variant.
- Removing this line brings the defect back; it is load-bearing.
