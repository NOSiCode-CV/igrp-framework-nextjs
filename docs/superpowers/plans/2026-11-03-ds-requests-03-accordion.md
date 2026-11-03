# DS requests — 03 Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Widen `IGRPAccordion` so it covers the collapsible-section pattern: several sections open at once, a count pill, a soft-colour icon chip, an empty state and a header action slot.

**Architecture:** No new component. `IGRPAccordionProps` drops the `Omit<…, "type">` and becomes a discriminated union on `type` (`"single"` stays the default and keeps today's behaviour). `IGRPAccordionItem` gains header and empty-state fields. The header action needs a slot inside `AccordionPrimitive.Header` but outside the trigger button, so the (already IGRP-customised) primitive `AccordionTrigger` takes one extra prop.

**Tech Stack:** React 19, Radix Accordion (through `primitives/accordion`), `Empty*` primitives, `IGRPColors`, Vitest + Testing Library.

**Spec:** `packages/design-system/docs/design-system-requests/04-igrp-collapsible-section.md` §4.0–§4.6. Roadmap: `docs/superpowers/plans/2026-11-03-ds-requests-roadmap.md`.

## Global Constraints

- All paths are relative to `packages/design-system/` unless they start with `docs/`, `plugins/` or `packages/design-system-storybook/`.
- Relative imports carry a `.js` extension. `horizon/accordion.tsx` already starts with `"use client"`; keep it.
- No user-visible literal in a component: new copy goes in `src/i18n/strings.ts` (pt-PT default) and is read with `useIGRPi18n()`; a prop may override it.
- No `dark:` in Horizon; no raw palette colours anywhere. Chip colours come from `IGRPColors.soft[color]`.
- `IGRPAccordion` renders no rest spread onto a DOM element today (the rest goes to the Radix `Accordion` root); keep it that way.
- Explicit re-exports in `src/index.ts`; the existing line 425 already exports `IGRPAccordion`, `IGRPAccordionProps`, `IGRPAccordionItem`, so no index change is expected.
- Changesets are `patch`. Commit messages have no `Co-Authored-By` trailer.
- Test command: `pnpm exec vitest run <file>` from `packages/design-system/`. Type gate: `pnpm exec tsc -p tsconfig.json --noEmit` (the `typecheck` script uses `tsconfig.build.json`, which excludes `__tests__`, so it would not see the `@ts-expect-error` guards).

## Review Focus

1. Two items with the same title (or titles that differ only in digits/accents, e.g. "Passo 1"/"Passo 2") — today both get `item-passo`, so opening one opens both and React warns about duplicate keys. With `item.value` they must be independent (Task 1 test 4).
2. `type="multiple"` with `defaultValue="all"` and items that arrive later (async data) — `"all"` is resolved from `items` on first render only, as any Radix `defaultValue`; later items start closed. Documented, not changed.
3. Single-mode `defaultValue` keeps today's meaning (a **title**, cleaned to `item-<letters>`), while multiple-mode `defaultValue` takes item **values**. The single-mode default with no `defaultValue` must use the first item's resolved value, so it still opens when `items[0].value` is set (Task 1 test 2).
4. `count={0}` with real `content` and no `empty` prop hides the content — that is the spec's chosen default; `empty={false}` must override it (Task 2 test 3).
5. A click, Enter or Space on an element inside `action` must not toggle the section (Task 3 test 1).

---

### Task 1: `type="multiple"` and `item.value`

**Files:**
- Modify: `src/components/horizon/accordion.tsx:19-97` (item type, props type, value derivation, root props)
- Test: `src/components/horizon/__tests__/accordion.test.tsx` (create)
- Docs: `plugins/igrp/skills/design-system/references/horizon.md:121-124` (the `IGRPAccordion` entry)

**Interfaces:**
- Consumes: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`, `AccordionTriggerArgs` from `../primitives/accordion.js`; `igrpCleanString` from `../../lib/utilities.js`.
- Produces (Task 2 and 3 extend these):

```ts
interface IGRPAccordionItem extends Partial<AccordionTriggerArgs> {
  title: string
  content: React.ReactNode
  /** Stable item value. Default: `item-${igrpCleanString(title).toLowerCase()}`. */
  value?: string
}

type IGRPAccordionBaseProps = Partial<AccordionTriggerArgs> &
  Omit<React.ComponentProps<typeof Accordion>, "type" | "value" | "defaultValue" | "onValueChange" | "collapsible"> & {
    classNameTrigger?: string
    classNameContent?: string
    items: IGRPAccordionItem[]
    name?: string
  }

type IGRPAccordionProps = IGRPAccordionBaseProps &
  (
    | { type?: "single"; value?: string; defaultValue?: string; onValueChange?(value: string): void }
    | { type: "multiple"; value?: string[]; defaultValue?: string[] | "all"; onValueChange?(value: string[]): void }
  )

/** Internal helper, not exported. */
function itemValue(item: IGRPAccordionItem): string
```

- [ ] **Step 1: Write the tests**

Fixture: `const six = ["Identificação", "Subcategorias", "Campos", "Fiscalização", "Escalões", "Acréscimos"].map((t) => ({ title: t, content: <p>{t} conteúdo</p> }))`.

```tsx
it("single (default): first item open, opening another closes it, open item collapses", async () => {
  render(<IGRPAccordion items={six.slice(0, 2)} />)
  expect(screen.getByText("Identificação conteúdo")).toBeInTheDocument()
  await userEvent.click(screen.getByRole("button", { name: "Subcategorias" }))
  expect(screen.queryByText("Identificação conteúdo")).toBeNull()
  await userEvent.click(screen.getByRole("button", { name: "Subcategorias" }))
  expect(screen.queryByText("Subcategorias conteúdo")).toBeNull()
})

it("single: opens the first item by default when it has an explicit value", () => {
  render(<IGRPAccordion items={[{ title: "A", value: "a", content: <p>a</p> }]} />)
  expect(screen.getByText("a")).toBeInTheDocument()
})

it("multiple + defaultValue='all': six open, collapsing one leaves five", async () => {
  render(<IGRPAccordion type="multiple" defaultValue="all" items={six} />)
  six.forEach((s) => expect(screen.getByText(`${s.title} conteúdo`)).toBeInTheDocument())
  await userEvent.click(screen.getByRole("button", { name: "Escalões" }))
  expect(screen.queryByText("Escalões conteúdo")).toBeNull()
  expect(screen.getAllByText(/conteúdo$/)).toHaveLength(5)
})

it("multiple: items with colliding titles stay independent when given values", async () => {
  const items = [{ title: "Passo 1", value: "p1", content: <p>um</p> }, { title: "Passo 2", value: "p2", content: <p>dois</p> }]
  render(<IGRPAccordion type="multiple" defaultValue={[]} items={items} />)
  await userEvent.click(screen.getByRole("button", { name: "Passo 1" }))
  expect(screen.getByText("um")).toBeInTheDocument()
  expect(screen.queryByText("dois")).toBeNull()
})

it("multiple: toggles on Enter and Space and wires aria-expanded / aria-controls", async () => {
  render(<IGRPAccordion type="multiple" defaultValue="all" items={six.slice(0, 1)} />)
  const trigger = screen.getByRole("button", { name: "Identificação" })
  expect(trigger).toHaveAttribute("aria-expanded", "true")
  expect(document.getElementById(trigger.getAttribute("aria-controls")!)).toHaveTextContent("Identificação conteúdo")
  trigger.focus()
  await userEvent.keyboard("{Enter}")
  expect(trigger).toHaveAttribute("aria-expanded", "false")
  expect(screen.queryByText("Identificação conteúdo")).toBeNull() // unmounted: not reachable by keyboard or AT
  await userEvent.keyboard(" ")
  expect(trigger).toHaveAttribute("aria-expanded", "true")
})

it("multiple controlled: renders exactly the value prop and reports clicks", async () => {
  const onValueChange = vi.fn()
  const items = six.slice(0, 2).map((s, i) => ({ ...s, value: `s${i}` }))
  const { rerender } = render(<IGRPAccordion type="multiple" value={["s0"]} onValueChange={onValueChange} items={items} />)
  await userEvent.click(screen.getByRole("button", { name: "Subcategorias" }))
  expect(onValueChange).toHaveBeenCalledWith(["s0", "s1"])
  expect(screen.queryByText("Subcategorias conteúdo")).toBeNull() // prop not changed → still closed
  rerender(<IGRPAccordion type="multiple" value={["s1"]} onValueChange={onValueChange} items={items} />)
  expect(screen.queryByText("Identificação conteúdo")).toBeNull()
  expect(screen.getByText("Subcategorias conteúdo")).toBeInTheDocument()
})
```

Add type-level guards at the bottom of the file (checked by the type gate, not Vitest):

```tsx
// @ts-expect-error single mode takes a string value
;<IGRPAccordion items={[]} value={["a"]} />
// @ts-expect-error "all" is only valid with type="multiple"
;<IGRPAccordion items={[]} defaultValue="all" type="single" />
```

- [ ] **Step 2: Run them, confirm the multiple-mode and explicit-value tests fail**

Run: `pnpm exec vitest run src/components/horizon/__tests__/accordion.test.tsx`
Expected: test 1 passes (regression guard on current behaviour); tests 2–6 fail (`type` is forced to `"single"`, `item.value` does not exist).

- [ ] **Step 3: Implement in `src/components/horizon/accordion.tsx`**

- `itemValue(item)` = `item.value ?? \`item-${igrpCleanString(item.title).toLowerCase()}\``; use it for both `key` and `value` of each `AccordionItem`.
- Single (`type` undefined or `"single"`): pass `type="single" collapsible`; default value is `defaultValue ? \`item-${igrpCleanString(defaultValue).toLowerCase()}\` : itemValue(items[0])` (title semantics kept exactly as today when `defaultValue` is given).
- Multiple: pass `type="multiple"`; default value is `items.map(itemValue)` for `"all"`, the array as given otherwise, and `items[0] ? [itemValue(items[0])] : []` when omitted (same "first open" default as single). No `collapsible` prop in this branch.
- Narrow on `props.type` before destructuring the union members, so TypeScript keeps `value`/`onValueChange` typed per branch; spread the shared rest after, as today.

- [ ] **Step 4: Run the tests and the type gate, confirm PASS**

Run: `pnpm exec vitest run src/components/horizon/__tests__/accordion.test.tsx && pnpm exec tsc -p tsconfig.json --noEmit`
Expected: 6 passed; tsc clean (both `@ts-expect-error` lines are used).

- [ ] **Step 5: Docs, changeset, commit**

`references/horizon.md` entry: replace "always single + collapsible, and the first item opens by default" with the `type` union and `defaultValue="all"`; replace the collision paragraph with "pass `value` per item when titles can collide (they are cleaned to letters only)". Keep the line saying single-mode controlled `value` defaults to `item-<letters>`.

Changeset `.changeset/ds-accordion-multiple.md` (patch): "`IGRPAccordion`: new `type=\"multiple\"` (with `defaultValue=\"all\"`) to keep several items open, and an optional `value` per item so items whose titles collide stay independent. `type=\"single\"` stays the default and behaves as before."

```bash
git add packages/design-system/src/components/horizon/accordion.tsx packages/design-system/src/components/horizon/__tests__/accordion.test.tsx plugins/igrp/skills/design-system/references/horizon.md .changeset/ds-accordion-multiple.md
git commit -m "feat(design-system): IGRPAccordion type=multiple and per-item value"
```

---

### Task 2: Count pill, icon chip and empty state

**Files:**
- Modify: `src/components/horizon/accordion.tsx` (item type, trigger children, content branch)
- Modify: `src/i18n/strings.ts` — type block (next to `tabs` at line 255) and pt-PT values (next to `tabs` at line 612)
- Test: `src/components/horizon/__tests__/accordion.test.tsx` (extend)
- Docs: `plugins/igrp/skills/design-system/references/horizon.md` (the same entry)

**Interfaces:**
- Consumes: Task 1's `IGRPAccordionItem`, `itemValue`; `IGRPIcon`, `type IGRPIconName` from `./icon/index.js`; `IGRPColors`, `type IGRPColorVariants` from `../../lib/colors.js`; `Empty`, `EmptyMedia`, `EmptyDescription` from `../primitives/empty.js`; `useIGRPi18n` from `../../i18n/index.js`.
- Produces, added to `IGRPAccordionItem`:

```ts
/** Pill after the title. `0` renders; it is also the default empty signal. */
count?: number
/** Circular soft-colour chip before the title (not the chevron). */
badgeIcon?: IGRPIconName | string
/** Chip colour, via IGRPColors.soft[badgeColor]. Default "primary". */
badgeColor?: IGRPColorVariants
/** Show the empty state instead of `content`. Default: `count === 0`. */
empty?: boolean
emptyIcon?: IGRPIconName | string // default "Inbox"
emptyLabel?: string // default i18n.accordion.empty
```

- i18n key: `accordion: { /** Default empty-state text of an accordion item. */ empty: string }`, pt-PT value `"Sem registos."`.

- [ ] **Step 1: Write the failing tests**

```tsx
it("renders count 0 as a tabular-nums pill", () => {
  render(<IGRPAccordion items={[{ title: "Escalões", count: 0, empty: false, content: <p>x</p> }]} />)
  expect(screen.getByText("0")).toHaveClass("tabular-nums")
})

it("count 0 shows the empty card and does not render content", () => {
  const Content = vi.fn(() => <p>tabela</p>)
  render(<IGRPAccordion items={[{ title: "Escalões", count: 0, emptyIcon: "Layers", emptyLabel: "Sem escalões definidos.", content: <Content /> }]} />)
  expect(screen.getByText("Sem escalões definidos.")).toBeInTheDocument()
  expect(Content).not.toHaveBeenCalled()
})

it("count 0 with empty={false} renders content", () => {
  render(<IGRPAccordion items={[{ title: "Escalões", count: 0, empty: false, content: <p>tabela</p> }]} />)
  expect(screen.getByText("tabela")).toBeInTheDocument()
})

it("empty without emptyLabel falls back to the catalog text", () => {
  render(<IGRPAccordion items={[{ title: "Docs", empty: true, content: <p>x</p> }]} />)
  expect(screen.getByText("Sem registos.")).toBeInTheDocument()
})

it("badgeIcon renders a chip with IGRPColors.soft[badgeColor]", () => {
  const { container } = render(<IGRPAccordion items={[{ title: "Taxa", badgeIcon: "Layers", badgeColor: "success", content: <p>x</p> }]} />)
  const chip = container.querySelector("[data-slot=accordion-badge-icon]")
  expect(chip).toHaveClass(...IGRPColors.soft.success.bg.split(" "), ...IGRPColors.soft.success.text.split(" "))
})

it("an item with none of the new fields renders the bare title as before", () => {
  render(<IGRPAccordion items={[{ title: "Simples", content: <p>x</p> }]} />)
  expect(screen.getByRole("button", { name: "Simples" }).querySelector("[data-slot=accordion-title]")).toBeNull()
})
```

- [ ] **Step 2: Run, confirm the first five fail**

Run: `pnpm exec vitest run src/components/horizon/__tests__/accordion.test.tsx`

- [ ] **Step 3: Implement**

- Trigger children: when neither `badgeIcon` nor `count` is set, children stay `{item.title}` (test 6, and no visual change for existing stories). Otherwise `<span data-slot="accordion-title" className="flex items-center gap-3">` holding the chip, the title and the pill.
- Chip (spec §4.3.2): `<span data-slot="accordion-badge-icon" className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", soft.bg, soft.text)}>` with `<IGRPIcon iconName={badgeIcon} className="size-4" strokeWidth={2} />`, `soft = IGRPColors.soft[item.badgeColor ?? "primary"]`.
- Pill: render when `count !== undefined`, classes from the spec: `inline-flex min-w-6 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums`.
- Content: `const isEmpty = item.empty ?? item.count === 0`; when true render `<Empty className="bg-background p-8"><EmptyMedia variant="icon"><IGRPIcon iconName={item.emptyIcon ?? "Inbox"} strokeWidth={1.75} /></EmptyMedia><EmptyDescription>{item.emptyLabel ?? i18n.accordion.empty}</EmptyDescription></Empty>`, else `item.content`. `"Inbox"` is an icon name, not copy; mark it `// igrp-i18n-ignore`.
- Add the `accordion` key to both halves of `strings.ts`.

- [ ] **Step 4: Run the tests, the i18n lint and typecheck, confirm PASS**

Run: `pnpm exec vitest run src/components/horizon/__tests__/accordion.test.tsx && pnpm exec tsc -p tsconfig.json --noEmit`, then from the repo root `pnpm build:i18n-tools && pnpm lint:i18n:framework`.
Expected: all accordion tests pass; no i18n findings in `accordion.tsx`.

- [ ] **Step 5: Docs, changeset, commit**

Add `count`, `badgeIcon`/`badgeColor`, `empty`/`emptyIcon`/`emptyLabel` to the `horizon.md` entry, including "`count={0}` hides `content` unless `empty={false}`".

Changeset `.changeset/ds-accordion-header.md` (patch): "`IGRPAccordion` items take `count` (a pill; `0` renders), `badgeIcon` and `badgeColor` (a soft-colour chip before the title), and `empty`, `emptyIcon`, `emptyLabel` (an empty state that replaces `content`; on by default when `count` is `0`)."

```bash
git add packages/design-system/src/components/horizon packages/design-system/src/i18n/strings.ts plugins/igrp/skills/design-system/references/horizon.md .changeset/ds-accordion-header.md
git commit -m "feat(design-system): IGRPAccordion count pill, icon chip and empty state"
```

---

### Task 3: Header `action` slot, story, request status

**Files:**
- Modify: `src/components/primitives/accordion.tsx:25-58` (`AccordionTriggerProps` and the `Header` markup)
- Modify: `src/components/horizon/accordion.tsx` (pass `item.action` through)
- Test: `src/components/horizon/__tests__/accordion.test.tsx` (extend)
- Story: `packages/design-system-storybook/src/stories/accordion.stories.tsx` (add one story)
- Docs: `plugins/igrp/skills/design-system/references/horizon.md`; `packages/design-system/docs/design-system-requests/04-igrp-collapsible-section.md` (Status line)

**Interfaces:**
- Consumes: Task 1 and 2 item fields.
- Produces: `AccordionTriggerProps.headerAction?: React.ReactNode` (primitive, rendered inside `AccordionPrimitive.Header`, after the `AccordionPrimitive.Trigger`, wrapped in `<div data-slot="accordion-header-action" className="flex shrink-0 items-center pl-2">`); `IGRPAccordionItem.action?: React.ReactNode`.

- [ ] **Step 1: Write the failing tests**

```tsx
it("action is clickable without toggling the section", async () => {
  const onEdit = vi.fn()
  render(<IGRPAccordion type="multiple" defaultValue="all"
    items={[{ title: "Identificação", content: <p>corpo</p>, action: <button type="button" onClick={onEdit}>Editar</button> }]} />)
  await userEvent.click(screen.getByRole("button", { name: "Editar" }))
  screen.getByRole("button", { name: "Editar" }).focus()
  await userEvent.keyboard("{Enter} ")
  expect(onEdit).toHaveBeenCalledTimes(3)
  expect(screen.getByRole("button", { name: "Identificação" })).toHaveAttribute("aria-expanded", "true")
})

it("action is not nested inside the trigger button", () => {
  render(<IGRPAccordion items={[{ title: "A", content: <p>a</p>, action: <button type="button">Editar</button> }]} />)
  expect(screen.getByRole("button", { name: "A" })).not.toContainElement(screen.getByRole("button", { name: "Editar" }))
})
```

- [ ] **Step 2: Run, confirm FAIL** (`Editar` not rendered)

Run: `pnpm exec vitest run src/components/horizon/__tests__/accordion.test.tsx`

- [ ] **Step 3: Implement**

Primitive: destructure `headerAction` before `...props` (so it never reaches the Radix `Trigger`) and render the wrapper only when it is set; leave the rest of the primitive untouched to limit shadcn drift. Horizon: pass `headerAction={item.action}`. The action sits to the right of the chevron, because the chevron lives inside the trigger button.

- [ ] **Step 4: Run the accordion tests, the boundary test and lint, confirm PASS**

Run: `pnpm exec vitest run src/components/horizon/__tests__/accordion.test.tsx src/__tests__/client-boundaries.test.ts && pnpm exec eslint src/components/horizon/accordion.tsx src/components/primitives/accordion.tsx`
Expected: all pass, no `igrp/token-policy` findings.

- [ ] **Step 5: Story**

In `accordion.stories.tsx` add `SummarySections`: `type: 'multiple'`, `defaultValue: 'all'`, four items exercising `badgeIcon` (one with `badgeColor: 'success'`), `count` (one `count: 0` with `emptyIcon`/`emptyLabel`), and one `action: <IGRPButton size="sm" variant="ghost">Editar</IGRPButton>`. `Template` is typed `StoryFn<IGRPAccordionProps>`; with the union it still accepts these args. Verify with `pnpm --filter @igrp/igrp-framework-react-design-system-storybook build-storybook` (not `tsc`), after `pnpm build:ds`.

- [ ] **Step 6: Docs, Status line, changeset, commit**

`horizon.md`: add `action` ("a node beside the trigger; clicks do not toggle"). In `04-igrp-collapsible-section.md` insert after the title line, as §11/§12 do:

```md
**Status:** resolved in the release after `0.2.0-beta.10` by widening `IGRPAccordion` (`type="multiple"`, `count`, `badgeIcon`, `empty*`, `action`, per-item `value`). Not done: `as` heading level, per-section `open` (use `value`/`onValueChange`).
```

Use the DS version current at merge time instead of `0.2.0-beta.10` if it has moved.

Changeset `.changeset/ds-accordion-action.md` (patch): "`IGRPAccordion` items take `action`, rendered beside the trigger; clicking it does not toggle the item. The `AccordionTrigger` primitive takes `headerAction` for the same slot."

```bash
git add packages/design-system/src packages/design-system-storybook/src/stories/accordion.stories.tsx plugins/igrp/skills/design-system/references/horizon.md packages/design-system/docs/design-system-requests/04-igrp-collapsible-section.md .changeset/ds-accordion-action.md
git commit -m "feat(design-system): IGRPAccordion header action slot"
```
