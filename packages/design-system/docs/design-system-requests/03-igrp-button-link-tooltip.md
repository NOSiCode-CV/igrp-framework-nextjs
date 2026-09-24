# §3. `IGRPButtonLink` with a tooltip — the icon-only variant

> Part of the SIGOVP design-system request bundle — see [README.md](README.md). Cite as `§3`.

**Local workaround.** `src/app/(myapp)/_components/button-link-tooltip.tsx`
(`SimpleButtonLinkTooltip`).

**Status.** Like §2, **currently unreferenced** in SIGOVP. Ask for it as a
_prop on_ §2, not as a second component — see §3.3.

---

## §3.1 What it does

Thirteen lines around `SimpleButtonLink`:

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex">{link}</span>
    </TooltipTrigger>
    <TooltipContent>
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

with one piece of real logic: when `size` is one of `"icon" | "icon-sm" |
"icon-lg"`, the `label` is **not** passed down to the button (it would render as
text next to the icon) and is used as the tooltip text instead. For every other
size the label renders in the button _and_ repeats in the tooltip.

---

## §3.2 The two details worth encoding in the DS

1. **The wrapping `<span className="inline-flex">`.** A Radix `TooltipTrigger
asChild` over a disabled control never opens, because a disabled element
   receives no pointer events. The span is what receives hover while the inner
   control stays disabled. This app hit the same thing independently in the
   rich-text toolbar (`ToolbarButton`, §9) and in
   `src/app/(myapp)/_components/lookup-field.tsx`
   (§6) — three separate re-discoveries of one rule. A DS tooltip wrapper should
   apply it unconditionally rather than leaving it to each call site.
2. **Per-instance `TooltipProvider`.** Mounting a provider per button is
   wasteful and makes `delayDuration` unconfigurable app-wide. The DS already
   ships `IGRPDataTableTooltipProvider` with an
   `IGRPDataTableTooltipContext` flag for "a provider is already present" — the
   same trick should back a general `IGRPTooltip`, so a button only mounts a
   provider when one is not already in scope.

**You have most of this already, just not generally.** The data-table module has
an internal `IGRPDataTableActionTooltip` that every `IGRPDataTableButton*`
wraps itself in, and a `tooltipSide` / `tooltipAlign` / `tooltipSideOffset` /
`tooltipDelayDuration` prop convention we would be happy to match. The ask is to
lift that out of `data-table` so it is reachable for any icon-only control, and
to add the disabled-span rule above while it moves — note that the row-action
buttons inherit the same disabled-tooltip weakness today.

The only general tooltip export in the package is the raw Radix set
(`Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`); `IGRPTooltip`
does not exist. That is why all three of §3, §6 and §9 hand-rolled it.

---

## §3.3 Proposed API

Do not ship a second component. Add to `IGRPButtonLinkProps` (§2.4):

```ts
  /** Tooltip text. With an icon-only `size`, `label` is used as the tooltip
   *  and is not rendered inside the button. */
  tooltip?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipAlign?: "start" | "center" | "end";
```

and derive the icon-only behaviour from `size`:

```ts
const iconOnly = size === "icon" || size === "icon-xs" || size === "icon-sm" || size === "icon-lg"
const tooltipText = tooltip ?? (iconOnly ? label : undefined)
```

Note `icon-xs` — the DS `buttonVariants` has five icon sizes
(`icon`, `icon-xs`, `icon-sm`, `icon-lg`) and the local component's hand-written
list misses `icon-xs`, so an `icon-xs` link would render its label as visible
text. Deriving the flag from a single exported predicate (e.g.
`isIconOnlySize(size)`) avoids every app repeating that list — a second request
in its own right, since `IGRPButton` and `IGRPDataTableButtonLink` need it too.

An icon-only button with **no** `label` and no `tooltip` should warn in
development: it has no accessible name.

---

## §3.4 Acceptance criteria

- [ ] `size="icon"` + `label="Editar"` renders a button with no visible text and
      a tooltip reading "Editar"; the accessible name is still "Editar".
- [ ] `size="icon-xs"` behaves identically (the bug the local version has).
- [ ] A `disabled` icon-only link still opens its tooltip on hover and focus.
- [ ] Nesting inside an existing `TooltipProvider` does not mount a second one.
- [ ] A non-icon size renders the label in the button and, when `tooltip` is
      given, shows the tooltip text — not a duplicate of the label.

---

## §3.5 Reference implementation

Verbatim. `SimpleButtonLink` is the component in §2.6.

### `src/app/(myapp)/_components/button-link-tooltip.tsx`

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@igrp/igrp-framework-react-design-system"

import { SimpleButtonLink } from "./button-link"

interface SimpleButtonLinkTooltipProps extends React.ComponentProps<typeof SimpleButtonLink> {}

export function SimpleButtonLinkTooltip({ href, label, size, disable, ...props }: SimpleButtonLinkTooltipProps) {
  const link = (
    <SimpleButtonLink
      href={href}
      label={size === "icon" || size === "icon-lg" || size === "icon-sm" ? "" : label}
      size={size}
      disable={disable}
      {...props}
    />
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{link}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```
