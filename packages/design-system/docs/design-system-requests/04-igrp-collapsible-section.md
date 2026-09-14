# §4. `IGRPCollapsibleSection` — a titled, countable, collapsible panel

> Part of the SIGOVP design-system request bundle — see [README.md](README.md). Cite as `§4`.

**Local workaround.** `src/app/(myapp)/_components/collapsible-section.tsx`
(`CollapsibleSection`).

**You already ship the closest thing — please read §4.0 first.** Of all the
entries in this bundle, this is the one most likely to be answered by
"use `IGRPAccordion`". We think it is not, but the gap is narrow and specific,
so the ask below is framed as *props on `IGRPAccordion`* rather than a new
component.

---

## §4.0 Why `IGRPAccordion` does not cover it

`IGRPAccordion` is genuinely close: it takes `items: { title, content }[]`,
supports a per-item `iconName`/`showIcon`/`iconPlacement`, and handles the
open/close chrome. Two things stop it, both structural rather than cosmetic.

**1. It cannot keep more than one section open.** Reading
`horizon/accordion.js`, the component hardcodes:

```js
type: "single",
collapsible: true,
defaultValue: `item-${defaultId}`,   // derived from items[0].title
```

and `IGRPAccordionProps` is declared as
`Omit<React.ComponentProps<typeof Accordion>, "type">` — so `type` is not just
defaulted, it is **removed from the public type**, and `type="multiple"` cannot
be passed. (The spread `...accordionProps` comes after those three lines, so it
would work at runtime; TypeScript forbids it, and relying on that would be
building on an implementation detail.)

Our screens are the opposite shape: four to six sections, **all open by
default**, each independently collapsible, none of them closing the others. A
single-open accordion turns a summary page into a page where reading the fee
brackets hides the fee identification.

**2. The header is a plain string.** `AccordionTrigger` renders
`children` next to one chevron. There is no slot for the count badge, and the
icon it does support is the *chevron-style* icon in the trigger row, not the
circular soft-colour chip our header uses. `content` is also a prop rather than
children, which is awkward for the table-and-grid content these sections hold.

Neither is a reason to build a second component; both are reasons to widen this
one. See §4.5.

**Why the pattern is worth owning at all.** Everything our version does is
composition over primitives you already export (`Collapsible*`, `Empty*`,
`IGRPIcon`, `IGRPColors`) — there is no missing capability, only a missing
*pattern*. Every read-only summary screen in every IGRP app rebuilds the same
header and gets the empty state, the chevron rotation or the icon-chip colour
subtly different each time. It is ~60 lines, no new dependency, no new concept.

---

## §4.1 Who uses it

Three read-only summary screens, each rendering four to six sections:

| Screen | Sections |
|---|---|
| `src/app/(myapp)/_features/categorias-ocupacao/components/categoria-resumo.tsx` | Identificação, Subcategorias, Campos do pedido, Fiscalização |
| `src/app/(myapp)/_features/documentos-exigidos/components/documento-exigido-resumo.tsx` | Identificação, Documentos |
| `src/app/(myapp)/_features/taxas/components/taxa-resumo.tsx` | Identificação, Aplicação, Modo de cálculo, Escalões, Acréscimos |

Typical call site:

```tsx
<CollapsibleSection
  title="Escalões"
  icon="Layers"
  count={taxa.escaloes.length}
  emptyIcon="Layers"
  emptyLabel="Sem escalões definidos."
>
  <EscaloesTable escaloes={taxa.escaloes} />
</CollapsibleSection>
```

---

## §4.2 Current props

| Prop | Type | Notes |
|---|---|---|
| `title` | `string` | Rendered as `<h3 class="text-sm font-semibold">`. |
| `icon` | `string` | `IGRPIcon` name for the 32px circular chip. |
| `count` | `number?` | Renders a pill badge; `0` still renders (it is the empty signal). |
| `emptyIcon` | `string?` | Only used when `count === 0`. |
| `emptyLabel` | `string?` | Only used when `count === 0`. |
| `children` | `ReactNode` | Hidden entirely when the empty state shows. |

Open state is **internal** (`useState(true)`) with no way to control or seed it.
That is the main functional gap — see §4.4.

---

## §4.3 Behaviour to reproduce

1. Open by default.
2. Header: `size-8` rounded chip using `IGRPColors.soft.primary.bg` /
   `.text`, a `size-4` icon at `strokeWidth={2}`, the title, then an optional
   count pill (`min-w-6`, `rounded-full bg-muted`, `tabular-nums`).
3. A `ChevronDown` on the right that rotates 180° when open, with
   `transition-transform`.
4. The whole header row is the trigger (full width, `justify-between`).
5. When `count === 0` **and** both `emptyIcon` and `emptyLabel` are given, the
   content is replaced by `<Empty>` + `<EmptyMedia variant="icon">` +
   `<EmptyDescription>` on a `bg-background p-8` card. `children` is not
   rendered at all in that branch.
6. Shell: `rounded-lg bg-card border`, header `p-4`, content `px-4 pb-4`.

---

## §4.4 Gaps to close while lifting

1. **Controlled/uncontrolled open state.** `open` / `defaultOpen` /
   `onOpenChange`, mirroring `Collapsible` itself. Needed for "expand all",
   for restoring state from a URL, and for auto-opening the section that
   contains a validation error.
2. **The count-zero coupling.** Today the empty state is keyed off
   `count === 0`, so a section with content but no meaningful count cannot show
   one, and a section with `count === 0` but real children silently hides them.
   Split it: an explicit `empty?: boolean` (defaulting to `count === 0`), plus
   `emptyIcon`/`emptyLabel`.
3. **Heading level.** Hard-coded `<h3>`. Take `as?: "h2" | "h3" | "h4"` — a
   resumo page that starts at `<h1>` needs `<h2>` sections.
4. **Icon chip colour.** Hard-coded `soft.primary`. Take
   `color?: IGRPColorRole` and pass it through `IGRPColors.soft[color]`, which
   is what the rest of Horizon does.
5. **`icon` typing.** `string` rather than `IGRPIconName | string`, so the call
   sites get no completion. Use the same union the rest of the DS uses.

---

## §4.5 Proposed API

**Preferred: widen `IGRPAccordion` instead of adding a component.** Two changes
would close §4.0 entirely:

```ts
interface IGRPAccordionProps {
  // …existing, but WITHOUT the Omit<…, "type">
  /** "single" (current behaviour, still the default) or "multiple". */
  type?: "single" | "multiple";
  /** With type="multiple": which items start open. `"all"` is the summary-page
   *  case. Today `defaultValue` is overwritten with items[0].title. */
  defaultValue?: string | string[] | "all";
}

interface IGRPAccordionItem {
  // …existing
  /** Count pill rendered after the title. `0` renders, it is the empty signal. */
  count?: number;
  /** Circular soft-colour chip before the title (distinct from the trigger's
   *  chevron icon). */
  badgeIcon?: IGRPIconName | string;
  badgeColor?: IGRPColorRole;          // default "primary"
  /** Right-aligned slot before the chevron — an "Edit" affordance, usually. */
  action?: React.ReactNode;
  /** Empty state replacing `content`. Defaults to `count === 0`. */
  empty?: boolean;
  emptyIcon?: IGRPIconName | string;
  emptyLabel?: string;
}
```

Keeping `type: "single"` as the default means no existing consumer changes
behaviour.

**Fallback: a separate component**, if you would rather not widen the accordion.
This is the shape our local one has, with the §4.4 gaps already closed:

```ts
export interface IGRPCollapsibleSectionProps {
  title: string;
  iconName?: IGRPIconName | string;
  color?: IGRPColorRole;               // default "primary"
  count?: number;
  as?: "h2" | "h3" | "h4";             // default "h3"
  open?: boolean;
  defaultOpen?: boolean;               // default true
  onOpenChange?: (open: boolean) => void;
  empty?: boolean;                     // default: count === 0
  emptyIcon?: IGRPIconName | string;
  emptyLabel?: string;
  action?: React.ReactNode;            // new: right-aligned slot before the chevron
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
}
```

`action` is the one addition without a local precedent, but every resumo screen
in this app ends up wanting an "Editar" affordance in a section header and
currently has nowhere to put it.

---

## §4.6 Acceptance criteria

- [ ] Six sections on one page can all be open at once, and collapsing one
      leaves the other five open. (This is the §4.0 case that `IGRPAccordion`
      cannot express today.)
- [ ] `type="single"` consumers see no behaviour change.
- [ ] Uncontrolled, it opens by default and toggles on header click, Enter and
      Space; the chevron rotates.
- [ ] Controlled (`open` + `onOpenChange`), internal state never fights the prop.
- [ ] `count={0}` with `emptyIcon`/`emptyLabel` shows the empty card and does
      **not** render `children`.
- [ ] `count={0}` with `empty={false}` renders `children`.
- [ ] `count` renders `0` rather than disappearing, and is `tabular-nums`.
- [ ] The trigger exposes `aria-expanded` and controls the content region;
      collapsed content is not reachable by keyboard or screen reader.
- [ ] `action` content is clickable without toggling the section.

---

## §4.7 Reference implementation

Verbatim. Every import is already a DS export — this is composition only.

### `src/app/(myapp)/_components/collapsible-section.tsx`

```tsx
"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  Empty,
  EmptyDescription,
  EmptyMedia,
  IGRPColors,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";

export function CollapsibleSection({
  title,
  icon,
  count,
  emptyIcon,
  emptyLabel,
  children,
}: {
  title: string;
  icon: string;
  count?: number;
  emptyIcon?: string;
  emptyLabel?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg bg-card border"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              IGRPColors.soft.primary.bg,
              IGRPColors.soft.primary.text,
            )}
          >
            <IGRPIcon iconName={icon} className="size-4" strokeWidth={2} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {count !== undefined ? (
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {count}
            </span>
          ) : null}
        </div>
        <IGRPIcon
          iconName="ChevronDown"
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {count === 0 && emptyIcon && emptyLabel ? (
          <Empty className="bg-background p-8">
            <EmptyMedia variant="icon">
              <IGRPIcon iconName={emptyIcon} strokeWidth={1.75} />
            </EmptyMedia>
            <EmptyDescription>{emptyLabel}</EmptyDescription>
          </Empty>
        ) : (
          children
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
```
