# DS requests — 07 Multi-step form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the two `Stepper` asks upstream (`StepperIndicator` variants, separator offsets and colours from step tokens), then ship `IGRPMultiStepForm`: a form-aware wizard that will not leave a step until that step validates.

**Architecture:** Task 1 is a self-contained edit to the IGRP-authored `primitives/stepper.tsx`. Tasks 2–5 add `src/components/horizon/multi-step-form/`, one file per responsibility: state and context, header, step content, footer buttons, plus a server-safe `lib.ts` for the pure index maths. The current step is stored **by key**, so a replaced step list keeps the user on their step with no effect. `useWatch` is only mounted by the blocked variant of Next, so a wizard without `blockingMessage` runs outside any form provider.

**Tech Stack:** React 19, react-hook-form, Tailwind v4 (`motion-safe:` variants, no `motion` dependency), Vitest + Testing Library + user-event.

**Spec:** `packages/design-system/docs/design-system-requests/07-igrp-multi-step-form.md` §7.2–§7.7. Roadmap: `docs/superpowers/plans/2026-11-03-ds-requests-roadmap.md`.

## Global Constraints

- All paths are relative to `packages/design-system/` unless they start with `docs/`, `plugins/` or `packages/`.
- Depends on plan 02: `IGRPTooltip` (`src/components/horizon/tooltip.tsx`, props `{ label, children, side, align, sideOffset, delayDuration, className }`, opens over disabled children) and the Tailwind classes `bg-step-active`, `text-step-active-foreground`, `bg-step-complete`, `text-step-complete-foreground`. Do not start before plan 02 has landed.
- Relative imports carry a `.js` extension. Leaves using hooks, context or handlers start with `"use client"`; `lib.ts` has no directive and imports nothing that has one. `src/__tests__/client-boundaries.test.ts` checks both.
- Every re-export in `src/index.ts` is explicit (no `export *`, no `as` aliasing).
- No hardcoded user-visible strings: new keys go in `src/i18n/strings.ts` (pt-PT) **and** `strings.en.ts` / `strings.fr.ts` (`src/i18n/__tests__/parity.test.ts` fails otherwise).
- Never spread rest props onto a DOM element without `igrpOmitNonDomProps` (`src/lib/dom-props.ts`). Never build a stateful helper during render.
- No `dark:` in Horizon, no raw palette colours (`igrp/token-policy`). Do **not** add the reference implementation's `animate-stepper-pulse` (its `rgba()` keyframes are exactly what the token policy forbids).
- No `motion` dependency. Indices are 1-based and clamped to `[1, count]`. `progress` is dropped from the hook.
- Changesets are `patch`, package `@igrp/igrp-framework-react-design-system`. Commit messages have no `Co-Authored-By` trailer.
- Test command: `pnpm exec vitest run <file>` from `packages/design-system/`. Lint: `pnpm exec eslint <files>`.

## Review Focus

1. **Double-clicking Next while `onStepValidation` is pending** — must advance one step, not two. Task 2 test "ignores a second goToNext while one is in flight".
2. **A step with `fields: []` inside `IGRPForm`** — the default validator must resolve `true` without calling `form.trigger`, which with no names validates the whole schema and fails on later steps. Task 2 test "default validation skips trigger for a step with no fields".
3. **Enter in a text field on a non-last step** — must not submit the surrounding `IGRPForm` (a one-input step triggers implicit submission). Task 3 test "Enter on a non-last step does not submit the form".
4. **`steps` passed as an inline array literal** (new identity every render) — no render loop, and the user stays on their step. Task 2 test "a new steps array with the same keys keeps the current step".
5. **`goToStep` forward over an intermediate step whose `blockingMessage` is non-null** — refuses unless `force`; going back never validates. Task 2 tests "goToStep validates every step it skips" and "goToStep backwards does not validate".

---

### Task 1: `Stepper` — indicator variants, derived separator offset, step tokens

**Files:**
- Modify: `src/components/primitives/stepper.tsx:174-222` (`StepperIndicator`), `:237-248` (`StepperSeparator`)
- Test: `src/components/primitives/__tests__/stepper.test.tsx` (create)
- Docs: `plugins/igrp/skills/design-system/references/primitives.md:32` (the Stepper row)

**Interfaces:**
- Consumes: plan 02 step token classes.
- Produces (Task 4 relies on it): `StepperIndicatorProps.variant?: "number" | "ring"` (no default: omitted keeps today's `size-6` indicator and emits no `data-variant`), rendered as `data-variant`. `StepperSeparator` positions itself from that attribute; a caller only adds `absolute w-auto m-0` for the label-below layout.

- [ ] **Step 1: Write the failing tests**

```tsx
function renderStep(variant: "number" | "ring" | undefined, active = 2) {
  return render(
    <Stepper value={active}>
      {[1, 2].map((s) => (
        <StepperItem key={s} step={s}>
          <StepperTrigger><StepperIndicator variant={variant} /></StepperTrigger>
          <StepperSeparator />
        </StepperItem>
      ))}
    </Stepper>
  )
}
const indicators = (c: HTMLElement) => c.querySelectorAll('[data-slot="stepper-indicator"]')

it("without a variant keeps today's indicator and shows the step number", () => {
  const { container } = renderStep(undefined)
  expect(indicators(container)[1]).not.toHaveAttribute("data-variant")
  expect(indicators(container)[1].className).toContain("size-6")
  expect(indicators(container)[1]).toHaveTextContent("2")
})

it("ring variant renders no step number", () => {
  const { container } = renderStep("ring")
  expect(indicators(container)[1]).toHaveAttribute("data-variant", "ring")
  expect(indicators(container)[1]).not.toHaveTextContent("2")
})

it("active indicator uses the step-active tokens, not text-muted-foreground", () => {
  const cls = indicators(renderStep("number").container)[1]!.className
  expect(cls).toContain("data-[state=active]:bg-step-active")
  expect(cls).toContain("data-[state=active]:text-step-active-foreground")
  expect(cls).not.toContain("data-[state=active]:text-muted-foreground")
})

it("completed indicator and separators use the step tokens", () => {
  const { container } = renderStep("number")
  expect(indicators(container)[0]!.className).toContain("data-[state=completed]:bg-step-complete")
  const sep = container.querySelector('[data-slot="stepper-separator"]')!.className
  expect(sep).toContain("group-data-[state=completed]/step:bg-step-complete")
  expect(sep).toContain("group-data-[state=active]/step:bg-step-active")
})

it.each([
  ["number", "left-[calc(50%+1rem)]", "right-[calc(-50%+1rem)]", "top-[0.9375rem]"],
  ["ring", "left-[calc(50%+0.625rem)]", "right-[calc(-50%+0.625rem)]", "top-[0.5625rem]"],
])("separator derives its %s offsets from the item's indicator", (variant, left, right, top) => {
  const sep = renderStep(variant as "number" | "ring").container.querySelector('[data-slot="stepper-separator"]')!.className
  for (const c of [left, right, top]) expect(sep).toContain(`group-has-[[data-variant=${variant}]]/step:${c}`)
})
```

- [ ] **Step 2: Run and confirm they fail**

Run: `pnpm exec vitest run src/components/primitives/__tests__/stepper.test.tsx`
Expected: FAIL — no `data-variant`; active indicator still carries `text-muted-foreground`.

- [ ] **Step 3: Implement**

`StepperIndicator`: add `variant` with no default, emit `data-variant={variant}` only when set; omitted keeps today's `size-6` classes so existing callers see no change. Sizes: `number` → `size-8 text-xs font-medium`, `ring` → `size-5 border-2` (inactive: `border-muted-foreground/30 bg-background`). Replace line 185's state colours with `data-[state=active]:bg-step-active data-[state=active]:text-step-active-foreground data-[state=completed]:bg-step-complete data-[state=completed]:text-step-complete-foreground` (ring adds the matching `border-step-*`). `ring` renders no number and no check, only the loader when `isLoading`. Only the explicit `number` variant is `size-8`.

`StepperSeparator`: replace `group-data-[state=completed]/step:bg-primary` with the two step-token rules from the test, and add the six `group-has-[[data-variant=…]]/step:` offset classes. `top`/`left`/`right` are inert while the separator is statically positioned, so the default inline row layout is unchanged; they apply only when a caller adds `absolute`. The `top` values centre the `h-0.5` line on the indicator (half the indicator minus 1px), so no `-translate-y-1/2` is needed.

- [ ] **Step 4: Run the test and the existing stepper consumer suite, confirm PASS**

Run: `pnpm exec vitest run src/components/primitives/__tests__/stepper.test.tsx src/components/primitives/__tests__`
Expected: all pass. `IGRPStepperProcess` does not use `StepperIndicator`/`StepperSeparator` (`horizon/process/stepper.tsx:9`), so it is unaffected.

- [ ] **Step 5: Docs, changeset, commit**

`primitives.md:32`: note `StepperIndicator variant="number" | "ring"` and that `StepperSeparator` only needs `absolute w-auto m-0` for labels-below layouts. Changeset `.changeset/ds-stepper-variants.md` (patch): "`StepperIndicator`: new opt-in `variant` (`number`, `size-8`; `ring`); without it the indicator is unchanged. `StepperSeparator` positions itself from the indicator variant, and active/completed states use the step tokens. The active indicator no longer renders muted text on the primary background."

```bash
git add packages/design-system/src/components/primitives plugins/igrp/skills/design-system/references/primitives.md .changeset/ds-stepper-variants.md
git commit -m "feat(design-system): stepper indicator variants and token-driven separators"
```

---

### Task 2: Wizard state — `IGRPMultiStepForm` and `useIGRPMultiStepForm`

**Files:**
- Create: `src/components/horizon/multi-step-form/lib.ts` (no directive)
- Create: `src/components/horizon/multi-step-form/context.tsx` (`"use client"`)
- Create: `src/components/horizon/multi-step-form/index.tsx` (`"use client"`, the root)
- Test: `src/components/horizon/multi-step-form/__tests__/state.test.tsx` (create)

**Interfaces:**
- Consumes: `IGRPFormContext` from `../form/form-context.js` read with `useContext` directly — **not** `useIGRPFormContext()`, which throws outside a form.
- Produces (Tasks 3–5 rely on these exact names):

```ts
// lib.ts
function clampStepIndex(value: number, count: number): number // 1 when count is 0
function resolveStepIndex(steps: readonly { key: string }[], key: string | undefined): number // 1-based; 1 when key is absent

// context.tsx
interface IGRPWizardStep {
  key: string
  title: string
  description?: string
  fields: string[]
  component: React.ReactNode
  /** Why this step cannot be left yet, or null. Requires an IGRPForm (or react-hook-form FormProvider). */
  blockingMessage?: (values: Record<string, unknown>) => string | null
}
interface IGRPGoToStepOptions { force?: boolean }
interface IGRPMultiStepFormContextValue {
  steps: IGRPWizardStep[]
  currentStepIndex: number // 1-based
  currentStepData: IGRPWizardStep | undefined
  isFirstStep: boolean
  isLastStep: boolean
  goToNext: () => Promise<boolean>
  goToPrevious: () => void
  goToFirstStep: () => void
  goToStep: (step: number, options?: IGRPGoToStepOptions) => Promise<boolean>
  setSteps: (next: IGRPWizardStep[]) => void
}
function useIGRPMultiStepForm(): IGRPMultiStepFormContextValue // throws outside IGRPMultiStepForm
/** @internal — not exported from src/index.ts. Next reports the current step's live message; Header reads it. */
const IGRPMultiStepFormBlockingContext: React.Context<{ message: string | null; report: (m: string | null) => void } | null>

// index.tsx
interface IGRPMultiStepFormProps {
  steps: IGRPWizardStep[]
  initialStep?: number // default 1
  onStepValidation?: (step: IGRPWizardStep) => Promise<boolean> | boolean
  onStepChange?: (next: number, prev: number) => void
  className?: string
  children: React.ReactNode
}
function IGRPMultiStepForm(props: IGRPMultiStepFormProps): React.ReactElement
```

- [ ] **Step 1: Write the failing tests**

Harness: a `Probe` child that renders `currentStepIndex`, `currentStepData?.key ?? "none"` and buttons calling `goToNext`, `goToPrevious`, `goToStep(n)`, `goToStep(n, { force: true })`, `setSteps(x)`, storing each returned promise result in a visible `<output>`. `const steps3 = ["a", "b", "c"].map((key) => ({ key, title: key, fields: [], component: <p>{key}</p> }))`.

```tsx
describe("lib", () => {
  it.each([[0, 3, 1], [1, 3, 1], [3, 3, 3], [9, 3, 3], [-2, 3, 1], [5, 0, 1]])(
    "clampStepIndex(%i, %i) is %i", (v, n, out) => expect(clampStepIndex(v, n)).toBe(out))
  it("resolveStepIndex finds a key or falls back to 1", () => {
    expect(resolveStepIndex(steps3, "c")).toBe(3)
    expect(resolveStepIndex(steps3, "zz")).toBe(1)
    expect(resolveStepIndex([], undefined)).toBe(1)
  })
})

it("goToNext resolves false and stays when onStepValidation returns false", …)      // index 1, output "false"
it("goToNext resolves false and stays when onStepValidation rejects", …)            // vi.fn().mockRejectedValue(new Error("x"))
it("goToNext advances and calls onStepChange(2, 1) when validation passes", …)
it("ignores a second goToNext while one is in flight", …)                           // pending promise, click twice, resolve → index 2, validator called once
it("initialStep beyond the count clamps to the last step; below 1 clamps to 1", …)  // initialStep 9 → 3, 0 → 1
it("an empty step list renders and currentStepData is undefined", …)                // steps [] → "1", "none", no throw
it("changing initialStep re-applies it", …)                                         // rerender initialStep 1 → 3 → index 3
it("replacing steps while on a removed step resets to the first step", …)           // on "c", setSteps([a, b]) → index 1
it("replacing steps keeps the current step matched by key", …)                      // on "b", setSteps([x, a, b]) → index 3, key "b"
it("a new steps array with the same keys keeps the current step", …)                // go to 2, parent rerenders with steps3.map(s => ({ ...s })) → still 2
it("goToStep validates every step it skips", …)                                    // from 1 to 3; validator false on "b" → index 2, result false; called with a then b
it("goToStep with force skips validation", …)                                       // validator never called, index 3
it("goToStep backwards does not validate", …)                                       // from 3 to 1, validator not called
it("goToStep outside [1, count] resolves false and stays", …)

describe("default validation", () => {
  it("resolves true outside an IGRPForm", …)                                         // no onStepValidation, no form → advances
  it("calls form.trigger(step.fields) inside an IGRPForm", …)                        // schema z.object({ name: z.string().min(1), other: z.string().min(1) }), step a fields ["name"]; empty → stays, error shown for name only; type → advances
  it("default validation skips trigger for a step with no fields", …)                 // inside IGRPForm whose schema fails; step fields [] → advances
  it("a step whose blockingMessage returns a string blocks goToNext", …)              // inside IGRPForm, blockingMessage: v => v.name ? null : "Nome em falta" → stays
})

it("useIGRPMultiStepForm throws outside the provider", …)
```

- [ ] **Step 2: Run and confirm they fail** (module not found)

Run: `pnpm exec vitest run src/components/horizon/multi-step-form/__tests__/state.test.tsx`

- [ ] **Step 3: Implement `lib.ts`, `context.tsx`, `index.tsx`**

- State is the current step **key**, not its index: `currentStepIndex = resolveStepIndex(steps, currentKey)`. That alone gives "keep by key, else step 1". When the key is missing, an effect writes `steps[0]?.key` so a later list that brings the old key back does not yank the user to it.
- `steps` prop vs `setSteps`: hold the list in state and replace it when the prop identity changes, using the "store the previous prop in state" pattern (compare during render, no effect). `setSteps` writes the same state.
- `initialStep`: lazy initial key from `clampStepIndex(initialStep, steps.length)`; an effect keyed on `initialStep` only re-applies it (this is how a saved draft resumes at the step the backend accepted).
- One internal `validateStep(step): Promise<boolean>`: if `step.blockingMessage` and a form is in context, a non-null `step.blockingMessage(form.getValues())` → `false`; then `onStepValidation(step)` if given, else `fields.length ? form.trigger(fields) : true` inside a form, else `true`. A rejection resolves `false`.
- `goToNext`: on the last step resolves `false` without validating. Guard with an in-flight `useRef<boolean>` so a concurrent call resolves `false`.
- `goToStep(n, { force })`: out of range → `false`; backwards or `force` → move; forwards → `validateStep` each step from current to `n - 1`, stopping at the first failure **on that step** (the user lands where the problem is).
- `onStepChange(next, prev)` fires from the navigation functions only, never from list reconciliation.
- Root renders `<div data-slot="multi-step-form" className={cn("flex w-full max-w-full min-w-0 flex-col gap-8 pt-3", className)}>` (`min-w-0` is load-bearing: a wide step must not widen the wizard) inside both providers.

- [ ] **Step 4: Run and confirm PASS, plus the boundary test**

Run: `pnpm exec vitest run src/components/horizon/multi-step-form src/__tests__/client-boundaries.test.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/design-system/src/components/horizon/multi-step-form
git commit -m "feat(design-system): IGRPMultiStepForm state machine"
```

---

### Task 3: Step content and footer — `Steps`, `Footer`, `Previous`, `Next`, `Submit`

**Files:**
- Create: `src/components/horizon/multi-step-form/steps.tsx` (`"use client"`)
- Create: `src/components/horizon/multi-step-form/footer.tsx` (`"use client"`)
- Modify: `src/components/horizon/multi-step-form/index.tsx` (root `onKeyDown`, Review Focus 3)
- Modify: `src/tokens.css` — add `@keyframes igrp-step-in` after `igrp-text-fade-in` (line 190)
- Modify: `src/i18n/strings.ts` (interface and pt defaults, after the `form` group at lines 305 / 645), `src/i18n/strings.en.ts`, `src/i18n/strings.fr.ts`
- Test: `src/components/horizon/multi-step-form/__tests__/footer.test.tsx` (create)

**Interfaces:**
- Consumes: Task 2's `useIGRPMultiStepForm`, `IGRPMultiStepFormBlockingContext`; `IGRPButton`, `IGRPButtonProps` from `../button.js`; `IGRPTooltip` from `../tooltip.js` (plan 02); `useWatch` from `react-hook-form`.
- Produces:

```ts
function IGRPMultiStepFormSteps(props: React.ComponentProps<"div"> & { animate?: boolean /* default true */ }): React.ReactElement | null
function IGRPMultiStepFormFooter(props: React.ComponentProps<"div">): React.ReactElement
function IGRPMultiStepFormPrevious(props: IGRPButtonProps): React.ReactElement | null
function IGRPMultiStepFormNext(props: IGRPButtonProps): React.ReactElement | null
function IGRPMultiStepFormSubmit(props: IGRPButtonProps): React.ReactElement | null
// i18n: IGRPI18nStrings["multiStepForm"] = { previous: string; next: string; submit: string }
// pt "Anterior" / "Próximo" / "Submeter"; en "Previous" / "Next" / "Submit"; fr "Précédent" / "Suivant" / "Soumettre"
```

- [ ] **Step 1: Write the failing tests**

```tsx
it("Previous is absent on step 1, Next absent on the last step, Submit present only on the last step", async () => {
  // three steps, no form; on 1: queryByRole("button", { name: "Anterior" }) null, "Próximo" present, "Submeter" null
  // click Próximo twice → "Anterior" present, "Próximo" null, getByRole("button", { name: "Submeter" }) has type="submit"
})

it("children override the default labels", …) // <IGRPMultiStepFormSubmit>Guardar</IGRPMultiStepFormSubmit> on last step

it("a wizard without blockingMessage mounts no useWatch and works outside a form provider", async () => {
  // vi.mock("react-hook-form", async (orig) => ({ ...(await orig()), useWatch: vi.fn(() => { throw new Error("useWatch mounted") }) }))
  // render without IGRPForm, click Próximo → step 2 content shown; expect(useWatch).not.toHaveBeenCalled()
})

it("blockingMessage disables Next, re-evaluates per keystroke, and shows the reason on hover and focus", async () => {
  // inside IGRPForm (defaultValues { name: "" }), step a: component <IGRPInputText name="name" label="Nome" />,
  //   blockingMessage: (v) => (String(v.name ?? "").length < 3 ? "Indique o nome" : null)
  const next = screen.getByRole("button", { name: "Próximo" })
  expect(next).toBeDisabled()
  await userEvent.hover(next)
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Indique o nome")
  await userEvent.unhover(next)
  await userEvent.tab() /* until focus reaches the tooltip wrapper */
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Indique o nome")
  await userEvent.type(screen.getByLabelText("Nome"), "An")
  expect(next).toBeDisabled()
  await userEvent.type(screen.getByLabelText("Nome"), "a")
  expect(next).toBeEnabled()
})

it("Next composes a caller onClick and skips navigation when it calls preventDefault", …)

it("Enter on a non-last step does not submit the form", async () => {
  // IGRPForm onSubmit spy, step 1 has a single IGRPInputText; type "x{Enter}" → onSubmit not called
})

it("the slide animation is scoped to motion-safe, so reduced motion gets none", () => {
  const panel = container.querySelector('[data-slot="multi-step-form-steps"]')!
  expect(panel.className).toContain("motion-safe:animate-[igrp-step-in_")
  expect(panel.className.split(/\s+/).filter((c) => c.startsWith("animate-"))).toEqual([])
})

it("animate={false} renders no animation class", …)
it("Steps renders nothing for an empty step list", …)
```

- [ ] **Step 2: Run and confirm they fail** (modules not found)

Run: `pnpm exec vitest run src/components/horizon/multi-step-form/__tests__/footer.test.tsx`

- [ ] **Step 3: Implement**

- `IGRPMultiStepFormSteps`: renders `currentStepData.component` in `<div data-slot="multi-step-form-steps" key={currentStepData.key}>` (the key restarts the animation on each step) with `w-full max-w-full min-w-0` and, when `animate`, `motion-safe:animate-[igrp-step-in_0.3s_ease-out_both]`. There is no exit animation; that needed `AnimatePresence`.
- `tokens.css`: `@keyframes igrp-step-in { from { opacity: 0; transform: translateX(15px) } to { opacity: 1; transform: translateX(0) } }`, in the block whose comment explains why keyframes ship in `/tokens`.
- `IGRPMultiStepFormFooter`: `flex w-full items-center justify-end gap-3 pt-3`, `data-slot="multi-step-form-footer"`.
- `IGRPMultiStepFormPrevious`: `null` on the first step; `type="button" variant="outline" showIcon iconName="ChevronLeft"`, label `i18n.multiStepForm.previous`.
- `IGRPMultiStepFormNext`: `null` on the last step. If `currentStepData.blockingMessage` exists, render the internal `BlockedNext` (the **only** caller of `useWatch` in the package's wizard): `message = blockingMessage(useWatch() as Record<string, unknown>)`, reports it through `IGRPMultiStepFormBlockingContext` in an effect (cleanup reports `null`), and renders `<IGRPTooltip label={message ?? undefined}><IGRPButton disabled={Boolean(message)} … /></IGRPTooltip>`. Otherwise render the plain button. Both use `type="button" showIcon iconName="ChevronRight" iconPlacement="end"`, label `i18n.multiStepForm.next`, and an `onClick` that calls the caller's `onClick` first and then `goToNext()` unless `event.defaultPrevented`.
- `IGRPMultiStepFormSubmit`: `null` unless last step; `type="submit"`, label `i18n.multiStepForm.submit`.
- Root `onKeyDown`: on a non-last step, `Enter` whose target is an `HTMLInputElement` gets `preventDefault()` (stops implicit submission; textareas and buttons are untouched).
- i18n: add the `multiStepForm` group with JSDoc on each key.

- [ ] **Step 4: Run and confirm PASS, plus i18n parity**

Run: `pnpm exec vitest run src/components/horizon/multi-step-form src/i18n`

- [ ] **Step 5: Commit**

```bash
git add packages/design-system/src/components/horizon/multi-step-form packages/design-system/src/tokens.css packages/design-system/src/i18n
git commit -m "feat(design-system): IGRPMultiStepForm steps and footer buttons"
```

---

### Task 4: Header — `IGRPMultiStepFormHeader`

**Files:**
- Create: `src/components/horizon/multi-step-form/header.tsx` (`"use client"`)
- Test: `src/components/horizon/multi-step-form/__tests__/header.test.tsx` (create)

**Interfaces:**
- Consumes: Task 1's `StepperIndicator variant`, the separator's derived offsets; Task 2's `useIGRPMultiStepForm`, `IGRPMultiStepFormBlockingContext`; `IGRPTooltip` (plan 02).
- Produces:

```ts
interface IGRPMultiStepFormHeaderProps extends React.ComponentProps<"div"> {
  variant?: "ring" | "number" // default "ring"
  /** Clicking a step calls goToStep (which validates). Default false. */
  navigable?: boolean
  /** Spinner on the active step's indicator, e.g. while a step is saved. */
  isLoading?: boolean
}
function IGRPMultiStepFormHeader(props: IGRPMultiStepFormHeaderProps): React.ReactElement
```

- [ ] **Step 1: Write the failing tests**

```tsx
it("renders one item per step with its title, and the current step active", …)  // data-state="active" on item 1, titles a/b/c
it("passes variant to every indicator", …)                                         // variant="number" → all data-variant="number"
it("is not navigable by default: no step buttons", …)                              // queryAllByRole("button") inside header is []
it("navigable: clicking a later step calls goToStep and validates", …)             // onStepValidation spy, click title "c" → called for a and b, index 3
it("navigable: steps after a blocked current step are disabled and show the message", async () => {
  // inside IGRPForm, step a blockingMessage → "Indique o nome"; render Header navigable + Next (Next reports the message)
  // button for "b" is disabled; hover its wrapper → tooltip "Indique o nome"; earlier/current steps stay enabled
})
it("isLoading shows the spinner on the active indicator only", …)                  // data-loading on the active item
it("separators are absolutely positioned with no caller calc()", …)               // separator class contains "absolute", not "calc("; last item has no separator
```

- [ ] **Step 2: Run and confirm they fail**

Run: `pnpm exec vitest run src/components/horizon/multi-step-form/__tests__/header.test.tsx`

- [ ] **Step 3: Implement**

Wrapper `div` (`w-full max-w-full min-w-0`, `igrpOmitNonDomProps` on the rest) around `<Stepper value={currentStepIndex} onValueChange={navigable ? (n) => void goToStep(n) : undefined}>`. Per step: `<StepperItem key={step.key} step={i + 1} loading={isLoading} disabled={blocked} className="relative flex-1 flex-col">`. When `navigable`, a `StepperTrigger` button (pass `disabled={blocked}` as a prop too, so `IGRPTooltip` sees it and makes its wrapper focusable) wrapped in `IGRPTooltip label={blocked ? message : undefined}`; otherwise `StepperTrigger asChild` over a `div`, so the header has no inert buttons. Inside: `StepperIndicator variant={variant}` and `StepperTitle`. `StepperSeparator className="absolute m-0 w-auto"` on all but the last item. `blocked = message !== null && i + 1 > currentStepIndex`, where `message` comes from `IGRPMultiStepFormBlockingContext` — the header calls no `useWatch`. Steps further ahead whose own `blockingMessage` is non-null are still refused by `goToStep`.

- [ ] **Step 4: Run and confirm PASS**

Run: `pnpm exec vitest run src/components/horizon/multi-step-form`

- [ ] **Step 5: Commit**

```bash
git add packages/design-system/src/components/horizon/multi-step-form
git commit -m "feat(design-system): IGRPMultiStepForm header"
```

---

### Task 5: Public surface — exports, skill reference, story, changeset, status

**Files:**
- Modify: `src/index.ts` — new block after the `IGRPStepperProcess` export (lines 795–799)
- Modify: `plugins/igrp/skills/design-system/references/horizon.md` — new `**IGRPMultiStepForm**` entry after `IGRPStepperProcess` (line 130–133); `plugins/igrp/skills/design-system/references/forms.md` — one line under "Fields and the value each one writes" pointing to it for multi-step forms
- Create: `packages/design-system-storybook/src/stories/multi-step-form.stories.tsx`
- Create: `.changeset/ds-multi-step-form.md`
- Modify: `packages/design-system/docs/design-system-requests/07-igrp-multi-step-form.md` — `**Status:**` line under the title

**Interfaces:**
- Consumes: every name Tasks 2–4 produce.
- Produces: the public API. Compound members are **separate named exports, not static properties**: the package has no `Object.assign`/`X.Item =` compounds, a server component cannot dot into a client reference (`IGRPMultiStepForm.Header` fails under RSC), and named leaves keep `optimizePackageImports` mapping exact.

- [ ] **Step 1: Export**

```ts
export {
  IGRPMultiStepForm,
  type IGRPMultiStepFormProps,
} from "./components/horizon/multi-step-form/index.js"
export {
  useIGRPMultiStepForm,
  type IGRPWizardStep,
  type IGRPGoToStepOptions,
  type IGRPMultiStepFormContextValue,
} from "./components/horizon/multi-step-form/context.js"
export { IGRPMultiStepFormHeader, type IGRPMultiStepFormHeaderProps } from "./components/horizon/multi-step-form/header.js"
export { IGRPMultiStepFormSteps } from "./components/horizon/multi-step-form/steps.js"
export {
  IGRPMultiStepFormFooter,
  IGRPMultiStepFormPrevious,
  IGRPMultiStepFormNext,
  IGRPMultiStepFormSubmit,
} from "./components/horizon/multi-step-form/footer.js"
```

`IGRPMultiStepFormBlockingContext`, `clampStepIndex` and `resolveStepIndex` stay internal.

- [ ] **Step 2: Run the package gates**

Run: `pnpm exec vitest run` then `pnpm exec eslint src/components/horizon/multi-step-form src/components/primitives/stepper.tsx` then (repo root) `pnpm build:ds` and `pnpm lint:i18n:framework`
Expected: all pass; `check:dist` (in `build`) reports no extensionless specifiers.

- [ ] **Step 3: Story**

`multi-step-form.stories.tsx`, title `Horizon/MultiStepForm`: three stories inside `IGRPForm` — `Number` (header `variant="number"`), `Ring` (default), `Blocking` (step 1 `blockingMessage`, `navigable` header). Verify with `pnpm --filter @igrp/igrp-framework-react-design-system-storybook exec storybook build` (not `tsc`), and check the separators line up with the indicators' centres in both variants — the jsdom tests cannot see layout.

- [ ] **Step 4: Docs**

`horizon.md`: the compound shape from §7.6 written with the named exports; `IGRPWizardStep`; `onStepValidation` default (`form.trigger(step.fields)` inside `IGRPForm`, `true` outside); `blockingMessage` needs a form provider; `goToStep(n, { force })`; `navigable` is off by default; when to pick `IGRPStepperProcess` instead (a process viewer the caller drives).

- [ ] **Step 5: Changeset, status, commit**

`.changeset/ds-multi-step-form.md` (patch): "New `IGRPMultiStepForm` wizard with `IGRPMultiStepFormHeader`, `IGRPMultiStepFormSteps`, `IGRPMultiStepFormFooter`, `IGRPMultiStepFormPrevious`, `IGRPMultiStepFormNext`, `IGRPMultiStepFormSubmit` and `useIGRPMultiStepForm`. A step cannot be left until it validates (`onStepValidation`, or `form.trigger(step.fields)` inside `IGRPForm`); `blockingMessage` disables Next and shows why."

Status line in `07-igrp-multi-step-form.md`: `**Status:** implemented in 0.2.0-beta.<n> — exported as named components (\`IGRPMultiStepFormHeader\` …), not \`IGRPMultiStepForm.Header\`; \`progress\` and the \`motion\` dependency dropped; \`ResetButton\` not shipped (use \`IGRPButton variant="ghost" size="sm"\`).` Fill `<n>` at release.

```bash
git add packages/design-system/src/index.ts plugins/igrp/skills/design-system/references packages/design-system-storybook/src/stories/multi-step-form.stories.tsx .changeset/ds-multi-step-form.md packages/design-system/docs/design-system-requests/07-igrp-multi-step-form.md
git commit -m "feat(design-system): export IGRPMultiStepForm"
```
