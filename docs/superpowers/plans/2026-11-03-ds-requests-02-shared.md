# DS requests — 02 Shared pieces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the three pieces that §2/§3, §6 and §7 all need: a general `IGRPTooltip` that works over disabled controls, an `isIconOnlySize` predicate, and semantic step tokens.

**Architecture:** `IGRPTooltip` is lifted out of the data table's internal `IGRPDataTableActionTooltip`; the data-table names stay as thin wrappers so nothing downstream breaks. The predicate lives with `IGRPButton`. Step tokens are aliases of existing themed tokens, so they need no dark-mode block.

**Tech Stack:** React 19, Radix Tooltip (through `primitives/tooltip`), Tailwind v4 tokens, Vitest.

**Spec:** `packages/design-system/docs/design-system-requests/README.md` ("Cross-cutting asks"), `03-igrp-button-link-tooltip.md` §3.2–§3.3, `07-igrp-multi-step-form.md` §7.4. Roadmap: `docs/superpowers/plans/2026-11-03-ds-requests-roadmap.md`.

## Global Constraints

- All paths are relative to `packages/design-system/` unless they start with `docs/` or `plugins/`.
- Relative imports carry a `.js` extension. New leaves that use hooks or context start with `"use client"`; `src/__tests__/client-boundaries.test.ts` tells you if you got it wrong.
- Every re-export in `src/index.ts` is explicit (no `export *`, no `as` aliasing).
- No `dark:` in Horizon. Raw palette colours are forbidden everywhere (`igrp/token-policy` lint rule).
- Changesets are `patch`. Commit messages have no `Co-Authored-By` trailer.
- Test command: `pnpm exec vitest run <file>` from `packages/design-system/`.

## Review Focus

1. A tooltip on a disabled button opened by **keyboard** — a disabled button cannot take focus, so the wrapper itself must be focusable (Task 1 test 2).
2. `IGRPTooltip` with an empty `label` — must render the child unchanged, no wrapper span (layout of existing call sites).
3. Nested providers — an `IGRPTooltip` inside `IGRPDataTableTooltipProvider` must not mount a second `TooltipProvider` (Task 1 test 4).
4. `isIconOnlySize(undefined)` — the default size is not icon-only; must return `false`.
5. Existing data-table row actions keep their tooltip text and default delay after the refactor (the data-table suite in Task 1 step 6).

---

### Task 1: `IGRPTooltip`

**Files:**
- Create: `src/components/horizon/tooltip.tsx`
- Modify: `src/components/horizon/data-table/tooltip-provider.tsx` (becomes wrappers over the new module)
- Modify: `src/components/horizon/data-table/action-button-icon.tsx:38-76` (`IGRPDataTableActionTooltip` delegates to `IGRPTooltip`)
- Modify: `src/index.ts` (export the new names)
- Test: `src/components/horizon/__tests__/tooltip.test.tsx` (create)
- Docs: `plugins/igrp/skills/design-system/references/` — add `IGRPTooltip` to the page that lists overlays/feedback (grep for `TooltipContent` to find it)

**Interfaces:**
- Consumes: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `../primitives/tooltip.js`.
- Produces (plans 05, 06, 07 rely on these exact names):

```ts
interface IGRPTooltipProps {
  /** Tooltip text. Empty or undefined renders `children` unchanged. */
  label?: string
  /** The trigger. May be disabled; the tooltip still opens. */
  children: React.ReactElement
  side?: "top" | "right" | "bottom" | "left" // default "top"
  align?: "start" | "center" | "end" // default "center"
  sideOffset?: number // default 6
  /** Used only when no IGRPTooltipProvider is in scope. Default 0. */
  delayDuration?: number
  /** Classes for the tooltip content. */
  className?: string
}
function IGRPTooltip(props: IGRPTooltipProps): React.ReactElement
function IGRPTooltipProvider(props: { children: React.ReactNode; delayDuration?: number /* default 200 */ }): React.ReactElement
const IGRPTooltipContext: React.Context<boolean> // true inside IGRPTooltipProvider
```

- [ ] **Step 1: Write the failing tests**

```tsx
it("opens on hover over an enabled trigger", async () => {
  render(<IGRPTooltip label="Editar"><button type="button">E</button></IGRPTooltip>)
  await userEvent.hover(screen.getByRole("button", { name: "E" }))
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Editar")
})

it("opens over a disabled trigger on hover and on keyboard focus", async () => {
  render(<IGRPTooltip label="Sem permissão"><button type="button" disabled>E</button></IGRPTooltip>)
  await userEvent.tab() // focus lands on the wrapper because the button cannot take focus
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Sem permissão")
})

it("renders the child unchanged without a label", () => {
  const { container } = render(<IGRPTooltip><button type="button">E</button></IGRPTooltip>)
  expect(container.firstElementChild?.tagName).toBe("BUTTON")
})

it("does not mount a second provider inside IGRPTooltipProvider", () => {
  // spy on the primitive TooltipProvider via vi.mock("../../primitives/tooltip.js", …) wrapping the real one;
  // render <IGRPTooltipProvider><IGRPTooltip label="a"><button /></IGRPTooltip></IGRPTooltipProvider>
  // expect the spy called exactly once
})
```

- [ ] **Step 2: Run and confirm they fail** (`IGRPTooltip` is not defined)

Run: `pnpm exec vitest run src/components/horizon/__tests__/tooltip.test.tsx`

- [ ] **Step 3: Implement `src/components/horizon/tooltip.tsx`**

Move the provider-context logic from `IGRPDataTableActionTooltip` here. When `label` is set, wrap `children` in `<span className="inline-flex" data-slot="tooltip-trigger-wrapper">` as the `TooltipTrigger asChild` target. Give the span `tabIndex={0}` only when `children.props.disabled` is truthy; otherwise the child keeps its own focus and React's bubbling `onFocus` still opens the tooltip.

- [ ] **Step 4: Point the data-table pieces at it**

`tooltip-provider.tsx`: `IGRPDataTableTooltipContext` becomes the same object as `IGRPTooltipContext` (re-export the binding from `../tooltip.js`, not a second `createContext`). `IGRPDataTableTooltipProvider` renders `IGRPTooltipProvider`. `IGRPDataTableActionTooltip` maps `tooltipSide/Align/ClassName/SideOffset/DelayDuration` onto `IGRPTooltip`'s `side/align/className/sideOffset/delayDuration`.

- [ ] **Step 5: Export** `IGRPTooltip`, `type IGRPTooltipProps`, `IGRPTooltipProvider`, `IGRPTooltipContext` from `src/index.ts`, next to the existing `IGRPDataTableTooltip*` lines.

- [ ] **Step 6: Run the new tests, the data-table suite and the boundary test**

Run: `pnpm exec vitest run src/components/horizon/__tests__/tooltip.test.tsx src/components/horizon/data-table src/__tests__/client-boundaries.test.ts`
Expected: all pass.

- [ ] **Step 7: Docs, changeset, commit**

Changeset `.changeset/ds-igrp-tooltip.md` (patch): "New `IGRPTooltip` and `IGRPTooltipProvider`. The tooltip opens over a disabled control, on hover and keyboard focus. Data-table row actions use it, so their tooltips now also open when the action is disabled."

```bash
git add packages/design-system/src plugins/igrp/skills/design-system/references .changeset/ds-igrp-tooltip.md
git commit -m "feat(design-system): add IGRPTooltip, usable over disabled controls"
```

---

### Task 2: `isIconOnlySize`

**Files:**
- Modify: `src/components/horizon/button.tsx:71` (replace the hand-written size list)
- Modify: `src/index.ts` (export it next to `IGRPButton`)
- Test: `src/components/horizon/__tests__/button-size.test.ts` (create)

**Interfaces:**
- Produces (plan 05 uses it): `function isIconOnlySize(size: VariantProps<typeof buttonVariants>["size"]): boolean` exported from `src/components/horizon/button.tsx`.

- [ ] **Step 1: Write the failing test**

```ts
it.each([["icon", true], ["icon-xs", true], ["icon-sm", true], ["icon-lg", true],
         ["default", false], ["sm", false], ["xs", false], ["lg", false], [undefined, false], [null, false]])(
  "isIconOnlySize(%s) is %s", (size, expected) => expect(isIconOnlySize(size as never)).toBe(expected))
```

- [ ] **Step 2: Run it, confirm FAIL** (not exported)

Run: `pnpm exec vitest run src/components/horizon/__tests__/button-size.test.ts`

- [ ] **Step 3: Implement** with `typeof size === "string" && size.startsWith("icon")`, and use it at `button.tsx:71`. Keep it out of `primitives/button.tsx`, which tracks upstream shadcn.

- [ ] **Step 4: Run it plus the button tests, confirm PASS**

Run: `pnpm exec vitest run src/components/horizon/__tests__/button-size.test.ts src/components/horizon/__tests__`

- [ ] **Step 5: Changeset (patch, "New `isIconOnlySize(size)` helper.") and commit**

```bash
git add packages/design-system/src/components/horizon packages/design-system/src/index.ts .changeset/ds-icon-only-size.md
git commit -m "feat(design-system): export isIconOnlySize"
```

---

### Task 3: Step tokens

**Files:**
- Modify: `src/tokens.css` — `@theme inline` block (line 15) and `:root` block (line 75)
- Test: `src/lib/step-tokens.test.ts` (create; same file-reading pattern as `src/components/primitives/__tests__/checked-variant.test.ts`)

**Interfaces:**
- Produces (plan 07 uses them as `bg-step-active`, `text-step-complete-foreground`, etc.):
  `--step-active`, `--step-active-foreground`, `--step-complete`, `--step-complete-foreground`, mapped in `@theme inline` to `--color-step-active`, `--color-step-active-foreground`, `--color-step-complete`, `--color-step-complete-foreground`.

- [ ] **Step 1: Write the failing test**

```ts
it.each(["step-active", "step-active-foreground", "step-complete", "step-complete-foreground"])(
  "%s is declared in :root and mapped in @theme", (name) => {
    expect(tokens).toMatch(new RegExp(`--${name}:\\s*var\\(--`))
    expect(tokens).toContain(`--color-${name}: var(--${name});`)
  })
```

- [ ] **Step 2: Run it, confirm FAIL**

Run: `pnpm exec vitest run src/lib/step-tokens.test.ts`

- [ ] **Step 3: Add the tokens as aliases**

`:root`: `--step-active: var(--primary); --step-active-foreground: var(--primary-foreground); --step-complete: var(--success); --step-complete-foreground: var(--success-foreground);`. They inherit dark values through the aliased tokens, so `.dark` is unchanged. Add the four `--color-step-*` lines to `@theme inline` after `--color-warning-foreground`.

- [ ] **Step 4: Run it and the contrast gate, confirm PASS**

Run: `pnpm exec vitest run src/lib/step-tokens.test.ts src/lib/tokens-contrast.test.ts`

- [ ] **Step 5: Changeset (patch, "New semantic step tokens: `step-active`, `step-complete` and their foregrounds.") and commit**

```bash
git add packages/design-system/src/tokens.css packages/design-system/src/lib/step-tokens.test.ts .changeset/ds-step-tokens.md
git commit -m "feat(design-system): add semantic step tokens"
```
