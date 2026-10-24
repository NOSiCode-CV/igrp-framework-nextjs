---
status: accepted
---

# `data-active` is widened in `tokens.css` to match Radix's `data-state="active"`

`tokens.css` declares `@custom-variant data-active (&[data-active], &[data-state="active"]);`. The `tabs` primitive styles the selected trigger with `data-active:bg-background`, `data-active:shadow-sm`, `data-active:after:opacity-100` and friends, which upstream targets Base UI. Our primitive wraps Radix, which only emits `data-state="active"`, so none of it applied: the selected `default` and `cards` tab looked identical to its siblings and the `underline` indicator stayed at `after:opacity-0`. Same decision as ADR 0002 and ADR 0004.

## Consequences

- `sidebar`, `pagination` and `input-otp` set `data-active={isActive}` themselves, and React renders `false` as the string `"false"`. Tailwind's plain `data-active:` (`[data-active]`) matches that, which painted every sidebar item with the active surface. The variant therefore excludes `[data-active="false"]`.
- Styles that were dead are now live, so Horizon `IGRPTabs` had to be re-checked: its per-variant `data-[state=active]:*` overrides now compete with the primitive's `data-active:*` classes at equal specificity, and Horizon resets the primitive's `data-active` surface per variant.
- Removing this line brings the defect back; it is load-bearing.
