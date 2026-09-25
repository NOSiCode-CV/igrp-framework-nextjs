---
status: accepted
---

# `data-checked` is widened in `tokens.css` to match Radix's `data-state="checked"`

`tokens.css` declares `@custom-variant data-checked (&[data-checked], &[data-state="checked"]);` and the matching `data-unchecked` (`&[data-unchecked], &[data-state="unchecked"]`), overriding Tailwind's built-in variants of those names. The shadcn re-sync of 2026-09-15 moved the primitives (`checkbox.tsx`, `field.tsx`, `radio-group.tsx`, `switch.tsx`) to `data-checked:` / `data-unchecked:` selectors, which upstream targets Base UI; our primitives still wrap Radix, which only emits `data-state="checked"`. Without the override every checked style — the radio fill, the option card's selected surface — silently never applies.

## Considered Options

- **Rewrite the selectors in each primitive to `data-[state=checked]`** — rejected: the next shadcn re-sync reintroduces the bug, and nothing fails loudly when it does.

## Consequences

- Primitives stay byte-close to upstream shadcn, so re-syncs remain mechanical.
- The variant is a strict superset of Tailwind's: anything that matched `[data-checked]` still matches. Consumers compiling with our `tokens.css` get the widened variant in their own code too.
- Removing this line brings the defect back across the kit; it is load-bearing, not cosmetic.
