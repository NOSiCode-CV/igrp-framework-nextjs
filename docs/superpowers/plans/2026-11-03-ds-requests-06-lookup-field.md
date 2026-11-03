# DS requests — 06 `IGRPLookupField` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `IGRPLookupField`, a form-bound input whose value is picked through an adjacent button, with native pairing of a hidden validated value field and a visible display field.

**Architecture:** One new leaf, `src/components/horizon/input/lookup.tsx`. A private presentational view (label row, `InputGroup` with the input and an inline-end addon holding the clear and lookup `IGRPButton`s, helper and error text) is shared by two binding branches. Outside a form it takes plain `value`/`onChange`. Inside a form a private bound component uses `Controller` on the display field, binds the value field with a second `Controller` whose ref is merged into the visible input (so focus-on-error lands there) and renders a plain hidden input for it. Tooltips come from plan 02's `IGRPTooltip`.

**Tech Stack:** React 19, react-hook-form 7.90, Zod 4, Radix Tooltip (through `IGRPTooltip`), Tailwind v4, Vitest + Testing Library + user-event 14.

**Spec:** `packages/design-system/docs/design-system-requests/06-igrp-lookup-field.md` §6.3–§6.6. Roadmap: `docs/superpowers/plans/2026-11-03-ds-requests-roadmap.md`. **Depends on plan 02 Task 1** (`IGRPTooltip`); do not start before it has landed.

## Global Constraints

- All paths are relative to `packages/design-system/` unless they start with `docs/`, `plugins/` or `packages/`.
- The new leaf starts with `"use client"`. Relative imports carry a `.js` extension.
- Every user-visible string comes from `useIGRPi18n()`, with a pt-PT default in `src/i18n/strings.ts` and values in `strings.en.ts` and `strings.fr.ts` (`src/i18n/__tests__/parity.test.ts` fails until all three have it). Props still override (`lookupLabel` is the button's name).
- The props type does not extend `IGRPInputProps`/`IGRPBaseAttributes` and the component spreads no rest props onto the DOM, so `igrpOmitNonDomProps` is not needed. If an implementer adds a rest spread, it goes through `igrpOmitNonDomProps` and the component joins `src/components/horizon/__tests__/input-dom-props.test.tsx`.
- Clearing a form field writes `null`, never `undefined`: `undefined` makes `useWatch` return the default value again.
- No `dark:` in Horizon. Explicit re-exports in `src/index.ts`.
- Changesets are `patch`. Commit messages have no `Co-Authored-By` trailer. The working tree carries unrelated uncommitted edits (`form-field.tsx`, `form/index.tsx`, `input/text.tsx`, `forms.md`), so stage only the paths each commit names, and in `forms.md` stage only your hunk (`git add -p`).
- Test command: `pnpm exec vitest run <file>` from `packages/design-system/`.

## Review Focus

1. A nested `valueName` (`requerentes.0.idLicenca`): the error must be read with react-hook-form's `get(errors, path)`, not `errors[path]` (Task 2 test "reads a nested valueName error").
2. Clearing a field that had `defaultValues`: the clear button must disappear and stay gone, which only holds if the write is `null` (Task 2 test "clear writes null to both fields").
3. A value that is set while its display text is empty (a saved id whose number could not be resolved, the `LicencaLookupField` case): the user must still be able to clear it (Task 2 test "offers clear when only the value is set").
4. Clearing after a submit: the required error must come back at once, not on the next submit (Task 2 test "re-validates on clear after a submit").
5. A caller `onChange` in form mode (NIF uppercasing, say) must run after the binding, never replace it (Task 1 test "typing in a form reaches the form and the caller").

---

### Task 1: `IGRPLookupField`: layout, button, disabled axes, loading, a11y

**Files:**
- Create: `src/components/horizon/input/lookup.tsx`
- Modify: `src/i18n/strings.ts` (new `lookupField` group in `IGRPI18nStrings` after `inputAddons` at line 456, and in `IGRP_I18N_DEFAULTS_PT` after `inputAddons` at line 750), `src/i18n/strings.en.ts:286`, `src/i18n/strings.fr.ts:286`
- Modify: `src/index.ts:716` (add the export after `IGRPInputHidden`)
- Test: `src/components/horizon/input/__tests__/lookup.test.tsx` (create)

**Interfaces:**
- Consumes (plan 02): `IGRPTooltip({ label?, children, side?, align?, sideOffset?, delayDuration?, className? })` from `../tooltip.js`. It renders `children` unchanged when `label` is empty, and over a disabled child it wraps it in a focusable `<span data-slot="tooltip-trigger-wrapper">`.
- Consumes: `InputGroup`, `InputGroupAddon`, `InputGroupInput` from `../../primitives/input-group.js`; `Field`, `FieldDescription`, `FieldError` from `../../primitives/field.js`; `IGRPButton` (`loading` swaps the icon for `Spinner` with `data-slot="spinner"` and disables it; `button.tsx:88-95`); `IGRPLabel`; `IGRPIcon`; `igrpChainHandlers`, `igrpMergeRefs` from `../../../lib/form-binding.js`.
- Produces:

```ts
interface IGRPLookupFieldProps {
  name: string                    // input id; also the display field when displayName is unset
  valueName?: string              // Task 2
  displayName?: string            // Task 2; defaults to name
  label: string
  required?: boolean
  onLookup: () => void
  lookupLabel: string             // accessible name of the lookup button
  iconName?: IGRPIconName | string // default "Search"
  disabled?: boolean              // input and both buttons
  inputDisabled?: boolean         // input only; defaults to disabled
  lookupDisabled?: boolean        // lookup button only
  lookupDisabledReason?: string   // tooltip, mounted only while the lookup button is disabled
  loading?: boolean               // disables the lookup button, spinner in place of the icon
  onClear?: () => void            // Task 2
  labelTooltip?: string
  labelSuffix?: React.ReactNode
  helperText?: string
  errorText?: string              // overrides any form error
  value?: string | null           // standalone only; ignored inside a form
  onChange?: React.ChangeEventHandler<HTMLInputElement> // standalone; in a form, runs after the binding
  className?: string              // Field wrapper
  inputClassName?: string         // InputGroupInput
  buttonClassName?: string        // lookup IGRPButton
}
function IGRPLookupField(props: IGRPLookupFieldProps): React.ReactElement
```

- i18n: `lookupField: { clear: string; moreInfo: string }`. pt `"Limpar"`, `"Mais informação"`; en `"Clear"`, `"More information"`; fr `"Effacer"`, `"Plus d'informations"`.

- [ ] **Step 1: Write the failing tests**

```tsx
// helpers: Standalone = controlled harness (useState<string>("")) passing value/onChange;
// InForm = <IGRPForm schema={z.object({ nif: z.string() })} formRef={ref} onSubmit={vi.fn()} defaultValues={{ nif: "" }}>
const base = { name: "nif", label: "NIF", lookupLabel: "Pesquisar NIF" }

it("fires onLookup on click and never while typing", async () => {
  const onLookup = vi.fn()
  render(<Standalone {...base} onLookup={onLookup} />)
  await userEvent.type(screen.getByRole("textbox", { name: "NIF" }), "123")
  expect(onLookup).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole("button", { name: "Pesquisar NIF" }))
  expect(onLookup).toHaveBeenCalledTimes(1)
})

it("typing in a form reaches the form and the caller", async () => {
  const onChange = vi.fn()
  render(<InForm><IGRPLookupField {...base} onLookup={vi.fn()} onChange={onChange} /></InForm>)
  await userEvent.type(screen.getByRole("textbox", { name: "NIF" }), "12")
  expect(ref.current!.getValues("nif")).toBe("12")
  expect(onChange).toHaveBeenCalledTimes(2)
})

it("inputDisabled leaves the button live; disabled disables both", () => {
  const { rerender } = render(<IGRPLookupField {...base} onLookup={vi.fn()} inputDisabled lookupDisabledReason="x" />)
  expect(screen.getByRole("textbox")).toBeDisabled()
  const button = screen.getByRole("button", { name: "Pesquisar NIF" })
  expect(button).toBeEnabled()
  expect(button.closest('[data-slot="tooltip-trigger-wrapper"]')).toBeNull() // enabled: no tooltip wrapper
  rerender(<IGRPLookupField {...base} onLookup={vi.fn()} disabled />)
  expect(screen.getByRole("textbox")).toBeDisabled()
  expect(screen.getByRole("button", { name: "Pesquisar NIF" })).toBeDisabled()
})

it("opens lookupDisabledReason on hover over a disabled button", async () => {
  render(<IGRPLookupField {...base} onLookup={vi.fn()} lookupDisabled lookupDisabledReason="Introduza 9 dígitos" />)
  await userEvent.hover(screen.getByRole("button", { name: "Pesquisar NIF" }).parentElement!)
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Introduza 9 dígitos")
})

it("opens lookupDisabledReason on keyboard focus over a disabled button", async () => {
  render(<IGRPLookupField {...base} onLookup={vi.fn()} lookupDisabled lookupDisabledReason="Introduza 9 dígitos" />)
  await userEvent.tab() // input
  await userEvent.tab() // tooltip wrapper
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Introduza 9 dígitos")
})

it("wires helperText and errorText into aria-describedby and sets aria-invalid", () => {
  const { rerender } = render(<IGRPLookupField {...base} onLookup={vi.fn()} helperText="Ajuda" errorText="Erro" />)
  const input = screen.getByRole("textbox", { name: "NIF" })
  const ids = input.getAttribute("aria-describedby")!.split(" ")
  expect(ids).toEqual(expect.arrayContaining([screen.getByText("Ajuda").id, screen.getByText("Erro").id]))
  expect(input).toHaveAttribute("aria-invalid", "true")
  rerender(<IGRPLookupField {...base} onLookup={vi.fn()} helperText="Ajuda" />)
  expect(input).toHaveAttribute("aria-invalid", "false")
  expect(input.getAttribute("aria-describedby")).toBe(screen.getByText("Ajuda").id)
})

it("loading disables the button and shows a spinner in place of the icon", () => {
  render(<IGRPLookupField {...base} onLookup={vi.fn()} loading />)
  const button = screen.getByRole("button", { name: "Pesquisar NIF" })
  expect(button).toBeDisabled()
  expect(button.querySelector('[data-slot="spinner"]')).not.toBeNull()
})

it("the label Info tooltip trigger is a focusable button with an accessible name", async () => {
  render(<IGRPLookupField {...base} onLookup={vi.fn()} labelTooltip="Número de identificação fiscal" />)
  const info = screen.getByRole("button", { name: "Mais informação" })
  await userEvent.tab()
  expect(info).toHaveFocus()
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Número de identificação fiscal")
})
```

- [ ] **Step 2: Run them and confirm they fail** (module not found)

Run: `pnpm exec vitest run src/components/horizon/input/__tests__/lookup.test.tsx`

- [ ] **Step 3: Add the `lookupField` i18n group** to the three catalogs with the values above.

- [ ] **Step 4: Implement `lookup.tsx`**

- `IGRPLookupField` calls `useFormContext()` and returns the bound component inside a form, the view otherwise. The bound component is a separate private function, so its `useFormState`/`useWatch` (Task 2) are never called conditionally.
- Bound branch (this task): `<Controller control name={displayName ?? name} render={({ field, fieldState }) => <View … />} />`. The input gets `value={field.value ?? ""}`, `onChange={igrpChainHandlers(field.onChange, onChange)}`, `onBlur={field.onBlur}`, `ref={field.ref}`. Error is `errorText ?? fieldState.error?.message`.
- Standalone: `value={value ?? ""}`, `onChange`, error is `errorText`.
- View: `Field` (`data-invalid` when there is an error). Label row `flex items-center justify-between gap-2`: `IGRPLabel htmlFor={name} required`, then when `labelTooltip` is set `<IGRPTooltip label={labelTooltip}><button type="button" aria-label={i18n.lookupField.moreInfo}>` holding `IGRPIcon iconName="Info"`, then `labelSuffix` in a `shrink-0` div. `InputGroup` holds `InputGroupInput` (`id={name}`, `name={displayName ?? name}`, `required`, `aria-required`, `aria-invalid={!!error}`, `aria-describedby` = the helper and error ids present, space-joined, or `undefined`, `disabled={inputDisabled ?? disabled}`, `className={inputClassName}`) and `InputGroupAddon align="inline-end"` holding `<IGRPTooltip label={lookupButtonDisabled ? lookupDisabledReason : undefined}><IGRPButton size="icon-xs" variant="ghost" iconName={iconName} aria-label={lookupLabel} onClick={onLookup} disabled={lookupButtonDisabled} loading={loading} className={buttonClassName} /></IGRPTooltip>`, where `lookupButtonDisabled = Boolean(disabled || lookupDisabled)`. Then `FieldDescription id={`${name}-helper`}` with `text-muted-foreground/80` when `disabled`, and `FieldError id={`${name}-error`}`. Unlike `IGRPInputText`, helper text stays visible while an error shows: the spec wants both reachable.

- [ ] **Step 5: Export** `IGRPLookupField, type IGRPLookupFieldProps` from `./components/horizon/input/lookup.js` in `src/index.ts`, after the `IGRPInputHidden` line.

- [ ] **Step 6: Run the tests plus the boundary, parity and DOM-props gates, then lint**

Run: `pnpm exec vitest run src/components/horizon/input/__tests__/lookup.test.tsx src/__tests__/client-boundaries.test.ts src/i18n/__tests__/parity.test.ts src/components/horizon/__tests__/input-dom-props.test.tsx`
Expected: all pass.
Run: `pnpm exec eslint src/components/horizon/input/lookup.tsx src/i18n` and, from the repo root, `pnpm build:i18n-tools && pnpm lint:i18n:framework`. Expected: no findings.

- [ ] **Step 7: Commit**

```bash
git add packages/design-system/src/components/horizon/input/lookup.tsx packages/design-system/src/components/horizon/input/__tests__/lookup.test.tsx packages/design-system/src/i18n/strings.ts packages/design-system/src/i18n/strings.en.ts packages/design-system/src/i18n/strings.fr.ts packages/design-system/src/index.ts
git commit -m "feat(design-system): add IGRPLookupField"
```

---

### Task 2: Value pairing and clear

**Files:**
- Modify: `src/components/horizon/input/lookup.tsx`
- Test: `src/components/horizon/input/__tests__/lookup.test.tsx` (new `describe("value pairing")`)

**Interfaces:**
- Consumes: Task 1's `IGRPLookupFieldProps`; `igrpMergeRefs` from `../../../lib/form-binding.js`; `Controller`, `get`, `useFormState`, `useWatch` from `react-hook-form`.
- Produces: behaviour only. With `valueName`, the form holds `valueName` (validated, submitted) and `displayName ?? name` (shown). Clearing writes `null` to both.

- [ ] **Step 1: Write the failing tests**

```tsx
const schema = z.object({
  licencaId: z.string({ error: "Escolha uma licença" }).min(1, "Escolha uma licença"),
  licencaNumero: z.string().nullable(),
})
const field = { name: "licencaNumero", valueName: "licencaId", label: "Nº licença", lookupLabel: "Pesquisar licença", onLookup: vi.fn(), inputDisabled: true }
// Paired(defaults, extra props) renders IGRPForm with that schema and ref

it("renders a hidden input bound to valueName and shows its error under the visible input", async () => {
  const { container } = render(<Paired defaults={{ licencaId: "", licencaNumero: "" }} />)
  expect(container.querySelector('input[type="hidden"][name="licencaId"]')).not.toBeNull()
  await ref.current!.submit()
  const error = await screen.findByText("Escolha uma licença")
  const input = screen.getByRole("textbox", { name: "Nº licença" })
  expect(input).toHaveAttribute("aria-invalid", "true")
  expect(input.getAttribute("aria-describedby")).toContain(error.id)
})

it("errorText overrides the valueName error", async () => {
  render(<Paired defaults={{ licencaId: "", licencaNumero: "" }} errorText="Manual" />)
  await ref.current!.submit()
  expect(await screen.findByText("Manual")).toBeInTheDocument()
  expect(screen.queryByText("Escolha uma licença")).toBeNull()
})

it("clear writes null to both fields and the button stays gone", async () => {
  const onClear = vi.fn()
  render(<Paired defaults={{ licencaId: "u-1", licencaNumero: "000001/CMS-SG/2026" }} onClear={onClear} />)
  await userEvent.click(screen.getByRole("button", { name: "Limpar" }))
  expect(ref.current!.getValues("licencaId")).toBeNull()
  expect(ref.current!.getValues("licencaNumero")).toBeNull()
  expect(onClear).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole("button", { name: "Limpar" })).toBeNull()
})

it("offers clear when only the value is set", () => {
  render(<Paired defaults={{ licencaId: "u-1", licencaNumero: "" }} onClear={vi.fn()} />)
  expect(screen.getByRole("button", { name: "Limpar" })).toBeInTheDocument()
})

it("re-validates on clear after a submit", async () => {
  render(<Paired defaults={{ licencaId: "u-1", licencaNumero: "1" }} onClear={vi.fn()} />)
  await ref.current!.submit()
  await userEvent.click(screen.getByRole("button", { name: "Limpar" }))
  expect(await screen.findByText("Escolha uma licença")).toBeInTheDocument()
})

it("reads a nested valueName error", async () => {
  // schema z.object({ r: z.array(z.object({ id: z.string().min(1, "Obrigatório"), num: z.string() })) }),
  // defaults { r: [{ id: "", num: "" }] }, props name="r.0.num" valueName="r.0.id"
  await ref.current!.submit()
  expect(await screen.findByText("Obrigatório")).toBeInTheDocument()
})

it("outside a form, clear only calls onClear", async () => {
  const onClear = vi.fn()
  render(<IGRPLookupField {...field} value="000001" onClear={onClear} />)
  await userEvent.click(screen.getByRole("button", { name: "Limpar" }))
  expect(onClear).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run and confirm they fail**

Run: `pnpm exec vitest run src/components/horizon/input/__tests__/lookup.test.tsx -t "value pairing"`
Expected: no hidden input, no `Limpar` button.

- [ ] **Step 3: Implement the pairing in the bound component**

- When `valueName` is set, bind it with a second `Controller` and render `<input type="hidden" name={valueName} value={field.value ?? ""} />` inside the `Field`. Do **not** attach that controller's `field.ref` to the hidden input: merge it into the visible input's ref with `igrpMergeRefs(displayField.ref, valueField.ref)`, so react-hook-form's focus-on-error lands on the visible input. Outside a form `valueName` and `displayName` have no effect: say so in their JSDoc.
- `const { errors } = useFormState({ control, name: valueName ?? displayField })`. The error becomes `errorText ?? (valueName ? get(errors, valueName)?.message : undefined) ?? fieldState.error?.message`.
- `const pickedValue = useWatch({ control, name: valueName ?? displayField })`. Show the clear button when `onClear` is set and `field.value || pickedValue` is truthy.
- Clear handler: `setValue(displayField, null, opts)`, then the same for `valueName` when set, then `onClear()`. `opts = { shouldDirty: true, shouldValidate: formState.isSubmitted }`.
- Standalone: show the clear button when `onClear` is set and `value` is truthy, and click calls `onClear()`.
- The clear button is `IGRPButton size="icon-xs" variant="ghost" iconName="X" aria-label={i18n.lookupField.clear}`, placed in the same inline-end addon before the lookup button, and disabled when `disabled || loading`. It ignores `lookupDisabled`, so a NIF too short to search can still be cleared.
- Test to add in this task's Step 1: `it("focuses the visible input when only the valueName field fails on submit")` — submit with an empty `valueName` under `z.string().min(1)`, then `expect(screen.getByRole("textbox", { name: label })).toHaveFocus()`.

- [ ] **Step 4: Run the whole file and the form suites**

Run: `pnpm exec vitest run src/components/horizon/input/__tests__/lookup.test.tsx src/components/horizon/__tests__/input-hidden.test.tsx src/components/horizon/__tests__/form.test.tsx`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add packages/design-system/src/components/horizon/input/lookup.tsx packages/design-system/src/components/horizon/input/__tests__/lookup.test.tsx
git commit -m "feat(design-system): IGRPLookupField pairs a hidden value field with its display field"
```

---

### Task 3: Story, skill reference, changeset, request status

**Files:**
- Create: `packages/design-system-storybook/src/stories/input/lookup.stories.tsx` (pattern: `search.stories.tsx` in the same folder)
- Modify: `plugins/igrp/skills/design-system/references/forms.md` (fields table, row after `IGRPInputSearch` at line 101; "Error message prop" sub-bullet at line 124; "Icons" bullet at line 126)
- Modify: `packages/design-system/docs/design-system-requests/06-igrp-lookup-field.md` (status line after the blockquote at line 3)
- Create: `.changeset/ds-lookup-field.md`

**Interfaces:**
- Consumes: the built `IGRPLookupField` export from `@igrp/igrp-framework-react-design-system`.

- [ ] **Step 1: Write the story.** Title `Components/Input/Lookup`. Four stories: `Default` (standalone, controlled with `useState`). `PickedValue` (`FormProvider` + zod with `licencaId`/`licencaNumero`, `inputDisabled`, `onClear`, and an `onLookup` that writes both fields with `setValue(…, { shouldValidate: true })`, standing in for the dialog). `DisabledWithReason` (`lookupDisabled` + `lookupDisabledReason`). `Loading`. Do not set `a11y: { test: 'todo' }`: the story must pass the default `error` gate.

- [ ] **Step 2: Build and verify the story**

Run, from the repo root: `pnpm build:ds && pnpm --filter @igrp/igrp-framework-react-design-system-storybook build-storybook`
Expected: build succeeds with no errors for `lookup.stories.tsx`.

- [ ] **Step 3: Update `forms.md`.** Add a fields-table row:

`| IGRPLookupField | display text in name (or displayName), value in valueName | The input shows a value picked elsewhere. The button calls onLookup and your dialog writes the fields. With valueName it renders the hidden input and shows that field's error under the visible one. Write the pick with setValue(valueName, id, { shouldValidate: true }) so an earlier error clears. onClear adds a clear button that writes null to both fields, so validate with .nullable() or a message on the type error. inputDisabled makes the input read-only and leaves the button live. Also loading, lookupDisabledReason, labelTooltip and labelSuffix. |`

Add `IGRPLookupField` to the `errorText` list in the "Error message prop" bullet, and to the "Icons" bullet (`iconName` on its button, default `Search`).

- [ ] **Step 4: Add the status line** to `06-igrp-lookup-field.md`, below the blockquote: `**Status:** implemented as \`IGRPLookupField\` (\`src/components/horizon/input/lookup.tsx\`), with all §6.6 criteria covered by \`src/components/horizon/input/__tests__/lookup.test.tsx\`.`

- [ ] **Step 5: Changeset** `.changeset/ds-lookup-field.md`:

```md
---
"@igrp/igrp-framework-react-design-system": patch
---

New `IGRPLookupField`: an input whose value is picked through an adjacent button (`onLookup`) rather than typed. With `valueName` it renders the hidden value input and shows that field's validation error under the visible one. `onClear` adds a clear button that writes `null` to both fields. `inputDisabled` and `lookupDisabled` are independent, `lookupDisabledReason` shows a tooltip over the disabled button, and `loading` swaps its icon for a spinner.
```

- [ ] **Step 6: Commit**

```bash
git add packages/design-system-storybook/src/stories/input/lookup.stories.tsx packages/design-system/docs/design-system-requests/06-igrp-lookup-field.md .changeset/ds-lookup-field.md
git add -p plugins/igrp/skills/design-system/references/forms.md   # only the IGRPLookupField hunks
git commit -m "docs(design-system): IGRPLookupField story, skill reference and changeset"
```
