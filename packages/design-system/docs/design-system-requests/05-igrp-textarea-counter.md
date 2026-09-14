# §5. `IGRPTextarea` — a character counter and a hard cap that survives programmatic writes

> Part of the SIGOVP design-system request bundle — see [README.md](README.md). Cite as `§5`.

**Local workaround.** `src/app/(myapp)/_components/limited-textarea-field.tsx`
(`LimitedTextareaField`).

**Why it exists.** `IGRPTextarea` already accepts `maxLength` (it spreads onto
the underlying `Textarea`), so *typing* past the limit is blocked by the
browser. What is missing is everything around it: the user gets no idea how
close they are to the cap, and `maxLength` is a DOM attribute — it does nothing
about a value written by `form.setValue`, a paste-then-programmatic-transform,
or a record loaded from the API that is already over the limit.

Checked before filing: neither `horizon/input/textarea` nor
`primitives/textarea` contains any counter, character-budget or
`maxLength`-aware logic — `IGRPTextareaProps` is
`React.ComponentProps<typeof Textarea>` plus `label | helperText | className |
required | error`, and `maxLength` simply passes through to the DOM.

This is the **most widely used** component in this folder: **17 call sites**
across seven modules, every one of them a backend-enforced field length.

---

## §5.1 Who uses it

| Module | Files |
|---|---|
| `categorias-ocupacao` | `criterio-form-dialog`, `subcategoria-form-dialog`, `wizard/step-dados` |
| `documentos-exigidos` | `documento-linha-dialog` |
| `fiscalizacoes` | `fiscalizacao-agendar-modal`, `fiscalizacao-resultado-modal` |
| `licencas` | `licenca-atualizar-dialog`, `licenca-cancelar-dialog`, `licenca-levantar-dialog`, `licenca-renovar-dialog`, `licenca-segunda-via-dialog`, `licenca-suspender-dialog` |
| `localizacoes` | `localizacao-form-modal` |
| `pedidos` | `pedido-analise-dialog`, `pedido-horario-dialog`, `wizard/step-localizacao`, `wizard/step-tipo` |

Always the same shape — a `maxLength` that mirrors the SIGOVP column width:

```tsx
<LimitedTextareaField
  id="fundamentacao"
  label="Fundamentação"
  maxLength={500}
  required
/>
```

---

## §5.2 Current props

| Prop | Type | Notes |
|---|---|---|
| `id` | `string` | Doubles as the **form field name** — it is what `form.watch(id)` reads. |
| `label` | `string` | |
| `maxLength` | `number` | Required; drives the cap, the bar and the counter. |
| `rows` | `number` (default `3`) | |
| `className`, `readOnly`, `placeholder`, `required` | | Forwarded to `IGRPTextarea`. |

Note the `id`-as-name conflation: the component passes `id` to `IGRPTextarea`
(which uses it for both `id` and `name` when `name` is absent) *and* uses it as
the `form.watch` key. A DS version should take `name` and let `id` default to
it, like every other Horizon input.

---

## §5.3 Behaviour to reproduce

1. **Live counter** — `length / maxLength`, `tabular-nums`, right-aligned,
   `role="status" aria-live="polite"`, wired to the textarea through
   `aria-describedby`. Screen-reader-only prefixes ("Caracteres utilizados:",
   "de") make the pair read as a sentence rather than "42 / 500".
2. **Progress bar** — a 2px track above the counter, width
   `min(100, length / maxLength * 100)%`, with a colour ramp:
   - `< maxLength - 30` → `bg-primary/35`
   - `>= maxLength - 30` → warning
   - `>= maxLength` → `bg-destructive`
   The 30-character warning threshold is absolute, not proportional — on a
   `maxLength={100}` field it lights at 70%, on a `maxLength={2000}` field at
   98.5%. That is arguably the wrong curve; see §5.5.
3. **Hard cap on the value, not just the keyboard.** An effect watches the
   value and, whenever `length > maxLength`, writes back
   `String(value).slice(0, maxLength)` with `shouldValidate: true,
   shouldDirty: true`. This is what catches over-long values arriving from
   `setValue` or from a loaded record.
4. The counter reads `0` for `null`/`undefined`, not `"4"` for the string
   `"null"` — length is computed through a small `fieldValueLength()` guard.

---

## §5.4 The token problem

The warning colours are app-local CSS variables consumed as
`bg-(--warning-bar)` and `text-(--text-warning)`, defined in
`src/styles/simple.css`:

```css
--warning-bar: --alpha(var(--color-amber-500) / 90%);
--text-warning: var(--color-amber-600);   /* amber-500 in dark */
```

The DS has `IGRPColors.soft.warning` but no *semantic* `--warning` /
`--warning-foreground` token pair in the same family as `--destructive` /
`--destructive-foreground`. Publishing that pair would remove this local CSS
block (and the identical one behind the stepper, §7). **That token request
stands on its own even if this component is declined.**

---

## §5.5 Proposed API

Add to `IGRPTextareaProps` rather than shipping a new component — the wrapper
exists only because the props are missing:

```ts
interface IGRPTextareaProps {
  // …existing
  /** Show the "n / max" counter. Requires `maxLength`. */
  showCounter?: boolean;
  /** Show the fill bar above the counter. Requires `maxLength`. Default:
   *  follows `showCounter`. */
  showProgress?: boolean;
  /** When to switch the counter/bar to the warning colour. A number is a
   *  remaining-character count, a `0–1` value is a fraction of `maxLength`.
   *  Default 0.9 — proportional, unlike the local component's flat 30. */
  warnAt?: number;
  /** Truncate the *value* (not just typing) to `maxLength`, including values
   *  arriving via setValue/reset. Default true when `maxLength` is set. */
  enforceMaxLength?: boolean;
  /** Counter formatter, for locales that want more than "42 / 500". */
  formatCounter?: (length: number, maxLength: number) => string;
}
```

`warnAt` defaulting to a *fraction* is a deliberate change from the local
behaviour; the flat 30-character threshold is a quirk of the first field it was
written for, not a design decision worth preserving.

---

## §5.6 Acceptance criteria

- [ ] `maxLength` without `showCounter` behaves exactly as today (no visual
      change for existing consumers).
- [ ] The counter updates on every keystroke and on `setValue`/`reset`.
- [ ] `form.setValue(name, "x".repeat(maxLength + 50))` leaves the stored value
      at exactly `maxLength` characters, marks the field dirty, and re-runs
      validation.
- [ ] `enforceMaxLength={false}` leaves the over-long value intact so a Zod
      `.max()` can fault it instead.
- [ ] The textarea's `aria-describedby` includes the counter, and the counter
      region is `aria-live="polite"` — announced on change, not on every key.
- [ ] Counter and bar cross to the warning style at `warnAt` and to the
      destructive style at exactly `maxLength`.
- [ ] `null`, `undefined` and non-string values report length `0`.
- [ ] Colours come from semantic tokens; no `dark:` overrides in the component.

---

## §5.7 Reference implementation

Verbatim. `useIGRPFormContext` is your export; `cn` is the same `cn` you ship.

### `src/app/(myapp)/_components/limited-textarea-field.tsx`

```tsx
"use client";

import {
  IGRPTextarea,
  useIGRPFormContext,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect, useId } from "react";
import { cn } from "@/lib/utils";

function fieldValueLength(value: unknown): number {
  if (value == null) return 0;
  return String(value).length;
}

export function LimitedTextareaField({
  id,
  label,
  maxLength,
  rows = 3,
  className,
  readOnly,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  maxLength: number;
  rows?: number;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const counterId = useId();
  const { form } = useIGRPFormContext();
  const value = form?.watch?.(id);
  const length = fieldValueLength(value);
  const atLimit = length >= maxLength;
  const nearLimit = length >= maxLength - 30;

  useEffect(() => {
    if (!form || length <= maxLength) return;
    form.setValue(id, String(value ?? "").slice(0, maxLength), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form, id, length, maxLength, value]);

  return (
    <div className="flex flex-col gap-2">
      <IGRPTextarea
        id={id}
        label={label}
        rows={rows}
        maxLength={maxLength}
        className={className}
        readOnly={readOnly}
        placeholder={placeholder}
        required={required}
        aria-describedby={counterId}
      />

      <div
        className="h-0.5 w-full overflow-hidden rounded-full bg-border/60"
        aria-hidden
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-300 ease-out",
            atLimit && "bg-destructive",
            nearLimit && !atLimit && "bg-(--warning-bar)",
            !nearLimit && "bg-primary/35",
          )}
          style={{
            width: `${Math.min(100, (length / maxLength) * 100)}%`,
          }}
        />
      </div>

      <div className="flex items-center justify-end">
        <p
          id={counterId}
          role="status"
          aria-live="polite"
          className={cn(
            "tabular-nums text-xs tracking-tight transition-colors",
            atLimit && "font-medium text-destructive",
            nearLimit && !atLimit && "text-(--text-warning)",
            !nearLimit && "text-muted-foreground",
          )}
        >
          <span className="sr-only">Caracteres utilizados: </span>
          {length}
          <span aria-hidden="true"> / </span>
          <span className="sr-only"> de </span>
          {maxLength}
        </p>
      </div>
    </div>
  );
}
```

### The warning tokens it consumes (`src/styles/simple.css`)

Consumed in TSX as `bg-(--warning-bar)` and `text-(--text-warning)`. These exist
only because the DS has no semantic `warning` pair; the house rules forbid raw
palette colours and `dark:` overrides in components, so the palette is confined
to this one file and swaps itself in dark mode.

```css
:root {
  /* "Near the limit" warning — distinct from `destructive`, which marks the
     limit actually reached. */
  --warning-bar: --alpha(var(--color-amber-500) / 90%);
  --text-warning: var(--color-amber-600);
}

.dark {
  --text-warning: var(--color-amber-500);
}
```
