# §8. `IGRPInputNumber` — make the value reach react-hook-form so Zod can fault it

> Part of the SIGOVP design-system request bundle — see [README.md](README.md). Cite as `§8`.

**Local workaround.** `src/app/(myapp)/_components/numeric-field.tsx`
(`NumericField`).

**This is a bug report as much as a component request.** Unlike the rest of this
folder, the DS component already exists — `IGRPInputNumber` has a label, helper
text, `min`/`max`, `Intl.NumberFormat` display options and an
`onChange?: (value: number) => void`, which is more than the local component
offers. The app does not use it, for one reason: **its errors do not surface**.

---

## §8.1 The reported defect

Observed against `@igrp/igrp-framework-react-design-system@0.1.0-beta.145`:
inside `IGRPForm` with a Zod resolver, a value entered in `IGRPInputNumber` does
not reach react-hook-form in a shape the resolver faults. A field that is
`z.number({ required_error })` or `z.number().min(1)` therefore **submits
silently** with a missing or out-of-range amount, and no message appears under
the field.

The local replacement sidesteps it rather than fixing it: it renders a plain
`IGRPInputText type="number"` and writes the parsed value back with
`setValue(name, parsed, { shouldValidate: true })`, which is what makes the
schema (and therefore the message) take effect.

There is a second, subtler trap the workaround documents, and it is worth
keeping in mind for whatever fix lands: `IGRPInputText` spreads its incoming
props **after** `onChange: field.onChange`, so a caller-supplied `onChange`
_replaces_ react-hook-form's rather than running alongside it. Without the
explicit `setValue` the field would not update at all. If the DS number input
composes handlers the same way, a consumer-supplied `onChange` is silently
destructive there too.

**Ask.** Confirm or refute the defect against a current build with a Zod
resolver. If it is real, fixing `IGRPInputNumber` closes this entry outright and
deletes `numeric-field.tsx` from this app — no new component needed. The
remaining sections describe behaviour worth folding in either way.

---

## §8.2 Who uses it

Three `taxas` forms — money and quantity fields, every one of them validated:

- `src/app/(myapp)/_features/taxas/components/taxa-form.tsx`
- `src/app/(myapp)/_features/taxas/components/taxa-escalao-dialog.tsx`
- `src/app/(myapp)/_features/taxas/components/taxa-acrescimo-dialog.tsx`

```tsx
<NumericField name="valorBase" label="Valor base" required min={0} />
<NumericField name="limiteInferior" label="Limite inferior" decimais={false} />
```

---

## §8.3 Current props

| Prop                                                             | Type                       | Notes                                                                                    |
| ---------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------- |
| `name`                                                           | `string`                   | Form field name.                                                                         |
| `label`                                                          | `string`                   |                                                                                          |
| `required`, `disabled`, `helperText`, `placeholder`, `className` |                            | Forwarded. Placeholder defaults to `` `Introduzca ${label}` ``.                          |
| `min`                                                            | `number?` (default `0`)    | Also decides whether `-` is typeable. Pass `undefined` for fields that accept negatives. |
| `max`                                                            | `number?`                  |                                                                                          |
| `decimais`                                                       | `boolean` (default `true`) | `false` also blocks typing `.` and sets `step={1}`.                                      |

---

## §8.4 Keystroke filtering — the part worth keeping

`type="number"` accepts more than digits, and two of those are actively harmful:

- **`e` / `E` / `+`** — scientific notation. `1e5` is a valid number input value
  and is not what anyone means in a currency field.
- **`,`** — never reaches the value at all. A browser reports `"12,50"` as an
  **empty string**, so allowing the comma only makes the field _look_ filled
  while it is empty. In pt-CV/pt-PT, where the comma is the decimal separator,
  this is the single most likely thing a user types.

So the local component blocks `["e", "E", "+", ","]` always, adds `"-"` when
`min >= 0`, and adds `"."` when `decimais === false`.

Equally deliberate is what it does **not** do: it never rewrites the DOM value
on keystroke. Rewriting on every keystroke (as an earlier whole-days field did)
eats the decimal point, which the browser then reports as empty until a digit
follows — so out-of-range input is reported by the schema instead of being
silently corrected.

A DS fix should either keep this filtering or, better, handle the comma
properly: accept it and normalise to `.`, which is what a locale-aware numeric
input should do.

---

## §8.5 Proposed API

Additions to `IGRPInputNumberProps`, assuming the resolver defect is fixed:

```ts
  /** Allow a fractional part. false ⇒ integers only: blocks "." and ","
   *  and sets step to 1. Default true. */
  decimals?: boolean;
  /** Decimal places accepted when `decimals` is true. Drives `step`
   *  (2 ⇒ "0.01") and rounding on blur. Default 2. */
  decimalScale?: number;
  /** Accept the locale decimal separator and normalise it to "." before the
   *  value reaches the form. Default true. */
  acceptLocaleSeparator?: boolean;
  /** Reject scientific notation ("e", "E", "+"). Default true. */
  blockScientificNotation?: boolean;
```

and two contract guarantees:

1. **The form value is `number | undefined`** — never `""`, never `NaN`, never
   a numeric string. An empty input is `undefined`, so
   `z.number({ required_error })` fires.
2. **A consumer `onChange` composes with the form's**, never replaces it.

---

## §8.6 Acceptance criteria

- [ ] Inside `IGRPForm` with `zodResolver`, a required numeric field left empty
      blocks submit and renders its message under the field.
- [ ] A value below `min` / above `max` is reported by the schema, not silently
      clamped or rewritten.
- [ ] The form value for an empty input is `undefined` (not `""`, `null` or
      `NaN`), and for `"12.50"` is the number `12.5`.
- [ ] Typing `e`, `E` or `+` inserts nothing.
- [ ] With `acceptLocaleSeparator`, typing `12,50` yields the number `12.5`;
      with it off, the comma is refused rather than accepted-then-dropped.
- [ ] `decimals={false}` refuses `.` and `,` and submits an integer.
- [ ] A caller-supplied `onChange` fires **and** the form value still updates.
- [ ] Typing `12.` does not clear the field before the user types the digits.

---

## §8.7 Reference implementation

Verbatim. Note this deliberately renders `IGRPInputText type="number"` rather
than `IGRPInputNumber` — that substitution _is_ the workaround being reported.

### `src/app/(myapp)/_components/numeric-field.tsx`

```tsx
"use client"

import { IGRPInputText } from "@igrp/igrp-framework-react-design-system"
import { useFormContext } from "react-hook-form"

/** Always refused: `type="number"` accepts scientific notation, and the comma
 *  never reaches the value — a browser reports "12,50" as an empty string, so
 *  letting it be typed only makes the field look filled while it is not. */
const TECLAS_SEMPRE_BLOQUEADAS = ["e", "E", "+", ","]

/**
 * A numeric form field that actually surfaces its Zod errors.
 *
 * `IGRPInputNumber` does not: the value never reaches react-hook-form in a
 * shape the resolver can fault, so a required or out-of-range amount submits
 * silently. This renders a plain `IGRPInputText` in numeric mode and writes the
 * parsed value back through `setValue`, which is what makes the schema — and
 * therefore the error message under the field — take effect.
 *
 * `IGRPInputText` spreads its props *after* `onChange: field.onChange`, so the
 * handler below replaces react-hook-form's own: without the `setValue` the
 * field would never update at all.
 *
 * The DOM value is deliberately left alone. Rewriting it on every keystroke
 * (as `DuracaoDiasField` does for whole days) eats the decimal point, which the
 * browser reports as an empty value until a digit follows it — so out-of-range
 * input is reported by the schema rather than silently rewritten.
 */
export function NumericField({
  name,
  label,
  required,
  disabled,
  helperText,
  placeholder,
  className,
  min = 0,
  max,
  decimais = true,
}: {
  name: string
  label: string
  required?: boolean
  disabled?: boolean
  helperText?: string
  placeholder?: string
  className?: string
  /** Lower bound for the spinner and the browser's own hint. Defaults to 0;
   *  pass `undefined` for a field that legitimately accepts negatives. */
  min?: number
  max?: number
  /** `false` for counts and whole units — also blocks typing a decimal point. */
  decimais?: boolean
}) {
  const { setValue } = useFormContext()
  const teclasBloqueadas = [
    ...TECLAS_SEMPRE_BLOQUEADAS,
    ...(min !== undefined && min >= 0 ? ["-"] : []),
    ...(decimais ? [] : ["."]),
  ]

  return (
    <IGRPInputText
      name={name}
      label={label}
      type="number"
      required={required}
      disabled={disabled}
      helperText={helperText}
      placeholder={placeholder ?? `Introduzca ${label}`}
      className={className}
      min={min}
      max={max}
      step={decimais ? "0.01" : 1}
      onKeyDown={(e) => {
        if (teclasBloqueadas.includes(e.key)) e.preventDefault()
      }}
      onChange={(e) => {
        const bruto = e.target.value.trim()
        setValue(name, bruto === "" ? undefined : Number(bruto), {
          shouldValidate: true,
        })
      }}
    />
  )
}
```
