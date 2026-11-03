# DS requests — 04 `IGRPTextarea` counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `IGRPTextarea` an opt-in character counter and fill bar, and a `maxLength` cap that also holds for values written by `setValue`/`reset`.

**Architecture:** Four new props on `IGRPTextareaProps`, no new public component. One private `TextareaCounter` renders bar and counter for both branches; a pure `textareaCounterLevel()` picks the colour step. In the form branch, a private `TextareaMaxLengthGuard` rendered inside the `Controller` render prop truncates the field value in an effect. The standalone branch tracks length from `value`/`defaultValue` + `onChange` and relies on the native `maxLength` only.

**Tech Stack:** React 19, react-hook-form 7, Zod, Tailwind v4 tokens (`--warning` already exists in `src/tokens.css:41,95,152`), Vitest + Testing Library.

**Spec:** `packages/design-system/docs/design-system-requests/05-igrp-textarea-counter.md` §5.3–§5.6. Roadmap: `docs/superpowers/plans/2026-11-03-ds-requests-roadmap.md`.

## Global Constraints

- All paths are relative to `packages/design-system/` unless they start with `docs/`, `plugins/` or `packages/`.
- Relative imports carry a `.js` extension. `textarea.tsx` already has `"use client"`.
- No hardcoded user-visible string: new keys go in `src/i18n/strings.ts` (pt-PT) **and** `strings.en.ts` / `strings.fr.ts` (`src/i18n/__tests__/parity.test.ts` fails otherwise), read with `useIGRPi18n()`. The `/` separator is `aria-hidden` and gets an `igrp-i18n-ignore` comment.
- Every new prop is destructured in the signature so it never reaches the DOM; the remainder still goes through `igrpOmitNonDomProps`.
- Semantic tokens only (`bg-primary/35`, `bg-warning`, `bg-destructive`, `text-muted-foreground`, `text-warning`, `text-destructive`, `bg-border/60`). No `dark:` in Horizon (`igrp/token-policy` lint rule).
- Declined from §5.5: `formatCounter` — rewording goes through the i18n catalog.
- Changesets are `patch`, package `@igrp/igrp-framework-react-design-system`. Commit messages have no `Co-Authored-By` trailer.
- Test command: `pnpm exec vitest run <file>` from `packages/design-system/`. Lint: `pnpm exec eslint <files>`.

## Review Focus

1. `showCounter` without `maxLength` (or `maxLength={0}`) — renders nothing extra and never divides by zero (Task 1 test "no counter without a positive maxLength").
2. A non-string form value (a number from an API record) — counts 0 and the guard does not rewrite it to a string (Task 2 test "leaves a non-string value alone").
3. `warnAt` at the boundaries: `1` means warn only at the limit; an absolute count larger than `maxLength` warns from 0 characters. Both follow from the formula in Task 1 step 3; Task 1 tests the fractional and absolute cases.
4. A record loaded over the limit via `reset` is truncated **and marked dirty** — intended (§5.3.3 asks for `shouldDirty: true`), but a "leave without saving?" prompt will fire on such a record. Pinned by Task 2's reset test; say it in the changeset.
5. A caller `aria-describedby` — today it replaces the helper/error id on both branches (the rest spread comes after it, `:70` and `:119`), and would equally drop the counter id. Join it into the list instead (Task 1 test "keeps a caller aria-describedby").

---

### Task 1: Counter and bar (both branches), i18n keys, story

**Files:**
- Modify: `src/components/horizon/input/textarea.tsx` — interface `:18-24`, signature `:29-41`, standalone `aria-describedby` `:62`, form-branch `aria-describedby` `:105-107`, counter inserted after the textarea wrapper `<div>` in both branches (`:72`, `:121`)
- Modify: `src/i18n/strings.ts` — new `textarea` group after `inputAddons` in the interface (`:456-459`) and in `IGRP_I18N_DEFAULTS_PT` (`:750-752`)
- Modify: `src/i18n/strings.en.ts`, `src/i18n/strings.fr.ts` — same group at the end
- Test: `src/components/horizon/__tests__/textarea-counter.test.tsx` (create)
- Story: `packages/design-system-storybook/src/stories/input/textarea.stories.tsx` — add `WithCounter`

**Interfaces:**
- Consumes: `useIGRPi18n` from `../../../i18n/index.js`; `igrpChainHandlers` from `../../../lib/form-binding.js`.
- Produces (Task 2 uses these):

```ts
interface IGRPTextareaProps /* existing */ {
  /** Show the "n / max" counter. Requires `maxLength`. */
  showCounter?: boolean
  /** Show the fill bar above the counter. Requires `maxLength`. Default: follows `showCounter`. */
  showProgress?: boolean
  /** 0–1: fraction of `maxLength`; > 1: remaining characters. Default 0.9. */
  warnAt?: number
  /** Truncate the form value to `maxLength`, including setValue/reset. Default true when `maxLength` is set. Form branch only. */
  enforceMaxLength?: boolean
}
// private, in textarea.tsx
type TextareaCounterLevel = "normal" | "warning" | "limit"
function textareaValueLength(value: unknown): number // typeof value === "string" ? value.length : 0
function textareaCounterLevel(length: number, maxLength: number, warnAt: number): TextareaCounterLevel
function TextareaCounter(props: { id: string; length: number; maxLength: number; warnAt: number; showCounter: boolean; showProgress: boolean }): React.ReactElement | null
// i18n
textarea: { counterUsed: string /* "Caracteres utilizados:" */; counterOf: string /* "de" */ }
```

Counter id is `${fieldName}-counter`. Both bar fill and counter `<p>` carry `data-level={level}`.

- [ ] **Step 1: Write the failing tests**

Standalone renders use `<IGRPTextarea name="f" label="F" … />`. Form renders reuse the `Harness` shape from `__tests__/input-form-binding.test.tsx:48-76` (copy it locally, add an `onForm?: (form: UseFormReturn) => void` callback).

```tsx
const status = () => screen.getByRole("status")

it("maxLength without showCounter renders exactly what it did before", () => {
  const { container } = render(<IGRPTextarea name="f" label="F" maxLength={10} />)
  expect(screen.queryByRole("status")).toBeNull()
  expect(container.querySelector("[data-level]")).toBeNull()
  expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "10")
})

it("no counter without a positive maxLength", () => {
  render(<IGRPTextarea name="f" label="F" showCounter />)
  expect(screen.queryByRole("status")).toBeNull()
})

it("standalone: counts defaultValue and updates on typing", async () => {
  render(<IGRPTextarea name="f" label="F" maxLength={10} showCounter defaultValue="abc" />)
  expect(status()).toHaveTextContent(/Caracteres utilizados:\s*3\s*\/\s*de\s*10/)
  await userEvent.type(screen.getByRole("textbox"), "de")
  expect(status()).toHaveTextContent(/5\s*\/\s*de\s*10/)
})

it("standalone: a controlled value drives the count", () => {
  render(<IGRPTextarea name="f" label="F" maxLength={10} showCounter value="abcd" onChange={() => {}} />)
  expect(status()).toHaveTextContent(/4/)
})

it("form: counts the field value and updates on typing", async () => {
  render(<Harness defaultValues={{ f: "ab" }}><IGRPTextarea name="f" label="F" maxLength={10} showCounter /></Harness>)
  expect(status()).toHaveTextContent(/2\s*\/\s*de\s*10/)
  await userEvent.type(screen.getByRole("textbox"), "c")
  expect(status()).toHaveTextContent(/3\s*\/\s*de\s*10/)
})

it.each([[null], [undefined], [42]])("form: %s counts as 0", (v) => {
  render(<Harness defaultValues={{ f: v }}><IGRPTextarea name="f" label="F" maxLength={10} showCounter /></Harness>)
  expect(status()).toHaveTextContent(/^\D*0\D*10$/)
})

it("is a polite live region referenced by the textarea, alongside the helper", () => {
  render(<IGRPTextarea name="f" label="F" helperText="Ajuda" maxLength={10} showCounter />)
  expect(status()).toHaveAttribute("aria-live", "polite")
  expect(status()).toHaveAttribute("id", "f-counter")
  expect(screen.getByRole("textbox").getAttribute("aria-describedby")?.split(" ")).toEqual(["f-helper", "f-counter"])
})
// same assertion in the form branch with error="Erro" → ["f-error", "f-counter"]

it("keeps a caller aria-describedby", () => {
  render(<IGRPTextarea name="f" label="F" aria-describedby="extra" maxLength={10} showCounter />)
  expect(screen.getByRole("textbox").getAttribute("aria-describedby")?.split(" ")).toEqual(["extra", "f-counter"])
})

it.each([
  // [length, maxLength, warnAt, level]
  [8, 10, 0.9, "normal"], [9, 10, 0.9, "warning"], [10, 10, 0.9, "limit"],
  [69, 100, 30, "normal"], [70, 100, 30, "warning"], [100, 100, 30, "limit"],
])("length %i of %i with warnAt %s is %s", (len, max, warnAt, level) => {
  const { container } = render(
    <IGRPTextarea name="f" label="F" maxLength={max} warnAt={warnAt} showCounter defaultValue={"x".repeat(len)} />)
  const [bar, counter] = container.querySelectorAll(`[data-level]`)
  expect(bar).toHaveAttribute("data-level", level)
  expect(counter).toHaveAttribute("data-level", level)
  expect(bar).toHaveClass({ normal: "bg-primary/35", warning: "bg-warning", limit: "bg-destructive" }[level]!)
})

it("bar width is capped at 100%", () => {
  // controlled value of 15 chars, maxLength 10 → fill style width "100%"
})

it("showProgress={false} hides the bar; showProgress alone shows only the bar", () => { /* query [data-level] counts: 1 then 1, status present then absent */ })

it("none of the new props reach the DOM", () => {
  render(<IGRPTextarea name="f" label="F" maxLength={10} showCounter showProgress warnAt={0.5} enforceMaxLength={false} />)
  const ta = screen.getByRole("textbox")
  for (const a of ["showcounter", "showprogress", "warnat", "enforcemaxlength"]) expect(ta).not.toHaveAttribute(a)
})
```

- [ ] **Step 2: Run and confirm they fail**

Run: `pnpm exec vitest run src/components/horizon/__tests__/textarea-counter.test.tsx`
Expected: the first test passes (today's behaviour); the rest FAIL — no `status` role.

- [ ] **Step 3: Add the i18n keys**

pt `{ counterUsed: "Caracteres utilizados:", counterOf: "de" }`, en `{ counterUsed: "Characters used:", counterOf: "of" }`, fr `{ counterUsed: "Caractères utilisés :", counterOf: "sur" }`. JSDoc each key in the interface ("Screen-reader-only prefix of the textarea counter" / "Screen-reader-only word between the count and the limit").

- [ ] **Step 4: Implement in `textarea.tsx`**

- `textareaCounterLevel`: `limit` when `length >= maxLength`; else `warning` when `warnAt <= 1 ? length >= warnAt * maxLength : maxLength - length <= warnAt`; else `normal`.
- `TextareaCounter` returns `null` unless `maxLength > 0 && (showCounter || showProgress)`. Markup and classes follow §5.7 (`h-0.5 … bg-border/60` track with `aria-hidden`, fill width `min(100, length / maxLength * 100)%`, counter `text-xs tracking-tight tabular-nums`, right-aligned) with `bg-(--warning-bar)` → `bg-warning`, `text-(--text-warning)` → `text-warning`, and the sr-only text from `i18n.textarea.counterUsed` / `counterOf`. The counter `<p>` renders only when `showCounter`.
- Defaults: `showProgress = showCounter`, `warnAt = 0.9`, `enforceMaxLength` destructured (used in Task 2). Pull `maxLength` and `aria-describedby` out of `props` by name and pass `maxLength` back to `Textarea` explicitly.
- `aria-describedby` on both branches: `[callerDescribedBy, existingErrorOrHelperId, counterShown && counterId].filter(Boolean).join(" ") || undefined`, where `counterShown = showCounter && maxLength > 0`.
- Standalone length: `useState(() => textareaValueLength(defaultValue))` declared **before** the `if (!formContext)` early return; the count uses `value !== undefined ? textareaValueLength(value) : stateLength`; `onChange={igrpChainHandlers((e) => setLength(e.target.value.length), domProps.onChange)}`. `value`/`defaultValue`/`onChange` still reach the native textarea as today.
- Form length: `textareaValueLength(field.value)` inside the `Controller` render prop.

- [ ] **Step 5: Run the new tests, the input suites and i18n parity**

Run: `pnpm exec vitest run src/components/horizon/__tests__/textarea-counter.test.tsx src/components/horizon/__tests__/input-form-binding.test.tsx src/components/horizon/__tests__/input-dom-props.test.tsx src/i18n`
Expected: all pass.

- [ ] **Step 6: Story**

Add to `textarea.stories.tsx`: `WithCounter` (`maxLength: 100, showCounter: true, defaultValue: "x".repeat(85)` so it opens in the warning step) and add `maxLength`, `showCounter`, `showProgress`, `warnAt` to `argTypes`. Run `pnpm --filter @igrp/igrp-framework-react-design-system build` then `pnpm --filter @igrp/igrp-framework-react-design-system-storybook build-storybook`; expected: build succeeds.

- [ ] **Step 7: Lint and commit**

Run: `pnpm exec eslint src/components/horizon/input/textarea.tsx src/i18n` — expected: clean (the token-policy rule passes).

```bash
git add packages/design-system/src/components/horizon/input/textarea.tsx packages/design-system/src/i18n packages/design-system/src/components/horizon/__tests__/textarea-counter.test.tsx packages/design-system-storybook/src/stories/input/textarea.stories.tsx
git commit -m "feat(design-system): character counter and fill bar on IGRPTextarea"
```

---

### Task 2: Value cap in the form branch, docs, changeset, status

**Files:**
- Modify: `src/components/horizon/input/textarea.tsx` — `Controller` render prop (`:94-131`)
- Test: `src/components/horizon/__tests__/textarea-counter.test.tsx` (extend)
- Docs: `plugins/igrp/skills/design-system/references/forms.md:102` (the `IGRPTextarea` row)
- Create: `.changeset/ds-textarea-counter.md`
- Modify: `packages/design-system/docs/design-system-requests/05-igrp-textarea-counter.md` — `**Status:**` line under the `>` blockquote (line 3)

**Interfaces:**
- Consumes: Task 1's `enforceMaxLength` (destructured), `textareaValueLength`.
- Produces: private `function TextareaMaxLengthGuard(props: { name: string; value: unknown; maxLength: number }): null` — no new exports.

- [ ] **Step 1: Write the failing tests**

```tsx
let form!: UseFormReturn<FieldValues>
const resolver = vi.fn(zodResolver(z.object({ f: z.string().max(10) })) as unknown as Resolver<FieldValues>)
// Harness gets resolver + onForm={(f) => (form = f)}

it("setValue over the limit is truncated, dirty and re-validated", async () => {
  render(<Harness resolver={resolver} onForm={…}><IGRPTextarea name="f" label="F" maxLength={10} showCounter /></Harness>)
  resolver.mockClear()
  act(() => form.setValue("f", "x".repeat(60)))
  await waitFor(() => expect(form.getValues("f")).toBe("x".repeat(10)))
  expect(form.getFieldState("f").isDirty).toBe(true)
  expect(resolver).toHaveBeenCalledWith(expect.objectContaining({ f: "x".repeat(10) }), undefined, expect.anything())
  expect(status()).toHaveTextContent(/10\s*\/\s*de\s*10/)
})

it("reset over the limit is truncated and the counter follows", async () => {
  // render, act(() => form.reset({ f: "y".repeat(15) })), waitFor getValues("f") === "y".repeat(10), status shows 10
})

it("enforceMaxLength={false} keeps the over-long value for Zod to fault", async () => {
  // enforceMaxLength={false}; act(() => form.setValue("f", "x".repeat(15)))
  // await act(() => form.trigger("f")); expect(form.getValues("f")).toHaveLength(15)
  // expect(screen.getByText(/10/, { selector: '[data-slot="field-error"]' })) — the Zod max message renders
})

it("leaves a non-string value alone", async () => {
  // defaultValues { f: 12345678901 }, maxLength 10 → after render, form.getValues("f") === 12345678901
})

it("without maxLength nothing is truncated", async () => {
  // no maxLength; setValue 60 chars; getValues length 60
})
```

`FieldError` renders `data-slot="field-error"` (`src/components/primitives/field.tsx:199`).

- [ ] **Step 2: Run and confirm the first two fail**

Run: `pnpm exec vitest run src/components/horizon/__tests__/textarea-counter.test.tsx -t "truncated"`
Expected: FAIL — the value keeps 60 / 15 characters.

- [ ] **Step 3: Implement `TextareaMaxLengthGuard`**

`useFormContext()` for `setValue`; `useEffect` with deps `[name, value, maxLength, setValue]`: when `typeof value === "string" && value.length > maxLength`, `setValue(name, value.slice(0, maxLength), { shouldValidate: true, shouldDirty: true })`. Render it inside the `Controller` render prop, next to the `Textarea`, only when `enforceMaxLength !== false && maxLength > 0`, passing `field.value`. It is a component, not a hook in the main body, because the form branch sits after an early return.

- [ ] **Step 4: Run the file and the horizon suite**

Run: `pnpm exec vitest run src/components/horizon/__tests__`
Expected: all pass.

- [ ] **Step 5: Docs, changeset, status, commit**

`forms.md:102` row becomes: `` `IGRPTextarea` | `string` | `rows` (3). With `maxLength`: `showCounter`, `showProgress` (follows `showCounter`), `warnAt` (0–1 fraction of `maxLength`, > 1 remaining characters; default 0.9), `enforceMaxLength` (default true: `setValue`/`reset` values are truncated and marked dirty; `false` leaves them for Zod `.max()`). ``

`.changeset/ds-textarea-counter.md` (patch): "`IGRPTextarea`: new `showCounter`, `showProgress`, `warnAt` and `enforceMaxLength` props. With `maxLength`, the form value is now truncated to the limit even when it arrives through `setValue` or `reset`, and the field becomes dirty; pass `enforceMaxLength={false}` to keep the old behaviour. Without `showCounter`, nothing changes visually."

Request file, after line 3: `**Status:** resolved by the `showCounter` / `showProgress` / `warnAt` / `enforceMaxLength` props on `IGRPTextarea` (plan `docs/superpowers/plans/2026-11-03-ds-requests-04-textarea-counter.md`). `formatCounter` declined: reword through the i18n catalog (`textarea.counterUsed`, `textarea.counterOf`). §5.4's `--warning` token pair already ships. §5.2's `name`/`id` point already holds: `IGRPTextarea` uses `name ?? id`.`

```bash
git add packages/design-system/src/components/horizon packages/design-system/docs/design-system-requests/05-igrp-textarea-counter.md plugins/igrp/skills/design-system/references/forms.md .changeset/ds-textarea-counter.md
git commit -m "feat(design-system): IGRPTextarea caps setValue/reset values at maxLength"
```
