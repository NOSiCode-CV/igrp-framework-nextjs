# §11 — `IGRPMultiSelect`: a multi-select field whose value reaches the formq

**Status:** resolved in the release after `0.1.0-beta.146` by `IGRPMultiSelect` (see
[ADR 0001](../packages/design-system/docs/adr/0001-multi-select-separate-from-combobox.md))
· **Kind:** defect + new component

> **Resolution.** `IGRPMultiSelect` meets the §3 contract. `IGRPCombobox variant="multiple"`
> is deprecated rather than fixed. The single-mode defects in §2.3 (the field is never touched,
> and the popover is modal) are fixed in `IGRPCombobox` itself. Differences from the §3
> interface: string props accept `{count}` / `{label}` placeholders instead of functions, a
> `hideChips` prop was added, and option `disabled` now lives on `IGRPOptionsProps`. A bare
> string is still read as a one-item selection, but it is not part of the declared type.
**Design system:** `@igrp/igrp-framework-react-design-system@0.1.0-beta.145`
**Consumer:** Next.js 15.5.25 · React 19.2.8 · Tailwind v4 · `react-hook-form` via `IGRPForm`
**Local component:** `_components/multi-select-field.tsx` (full source at the bottom)

## 1. What we needed

A form field where the user picks **several** values from a closed list of
domain codes, and the form ends up holding a `string[]`. Our concrete case is
"Tipo de atualização" on a licence-update request: 6 codes, at least one
required, the picked set is sent to the API as an array of strings and read
back into the same field when the record is reopened for editing.

## 2. What the design system offers, and why it did not work

`IGRPCombobox` advertises exactly this through `variant="multiple"`:

```ts
// dist/components/horizon/input/combobox.d.ts
interface IGRPComboboxProps extends Omit<IGRPInputProps, "onChange"> {
q    /** Single or multiple selection. */
    variant?: "single" | "multiple";
    /** Options to display. */
    options: IGRPOptionsProps[];
    /** Selected value(s). */
    value?: string | string[];
    /** Called when selection changes. */
    onChange?: (selected: string | string[]) => void;
    // …
}
```

Used inside an `IGRPForm` as

```tsx
<IGRPCombobox
  name="tipoAtualizacao"
  label="Tipo de atualização"
  variant="multiple"
  required
  options={tipoAtualizacaoOptions}
  placeholder="Selecione os tipos de atualização"
/>
```

/the multiple mode does not hold together as a form field for us:

1. **The array does not survive the round trip.** Picking two or more options
  does not leave a stable `string[]` in the form state that a later
   `getValues()` / submit agrees with, and a `defaultValue` that is already an
   array is not reflected as a selection when the form is reopened in edit
   mode. A field that cannot be rehydrated cannot back an edit screen.
2. **No way to see or undo the selection without reopening the popover.** The
  trigger is a single line of text; there is no per-value removal.
3. **Error display never clears by itself.** The trigger is a `PopoverTrigger`
  `IGRPButton`, which never fires `blur` in the react-hook-form sense, so
   under `mode: "onTouched"` a field that was programmatically marked invalid
   stays red even after the user picks a valid set. (This is the same shape of
   problem we reported for the single-value combobox.)

Neither `IGRPSelect` nor `IGRPCheckbox` closes the gap: `IGRPSelect` is
single-value, and a bare row of checkboxes gives no summary, no search and no
"select all" for lists that grow past a handful.

## 3. What we are asking for

A first-class `IGRPMultiSelect` (or a `variant="multiple"` on `IGRPCombobox`
that satisfies the contract below), with the usual Horizon field conventions —
`name` binds to the surrounding `IGRPForm`, `label`, `required`, `disabled`,
`helperText`, `errorText`:

```ts
interface IGRPMultiSelectProps {
  /** Field name in the surrounding IGRPForm schema. */
  name?: string;
  label?: string;
  options: (IGRPOptionsProps & { disabled?: boolean })[];
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  /** Overrides the form's own error message for `name`. */
  errorText?: string;
  placeholder?: string;
  /** Shown in the dropdown when nothing matches the search. */
  emptyLabel?: string;
  searchPlaceholder?: string;
  /** Force the search box on/off. Suggested default: on from ~8 options up. */
  showSearch?: boolean;
  /** Hide the "select all" / "clear" row. */
  hideBulkActions?: boolean;
  /** Cap on how many options can be picked. */
  maxSelected?: number;
  className?: string;
  /** Controlled mode, for use outside IGRPForm. */
  value?: string[];
  onChange?: (value: string[]) => void;
}
```

**Behavioural contract we depend on**

- The form value is always `string[]`. An initial value of `["A","B"]` renders
as two selected options; `getValues(name)` right after a click returns the
post-click array (we rely on this — see §5.2).
- Selection order follows the `options` order, not the click order, so a
re-opened record shows the same order it was saved with.
- Picking or clearing marks the field dirty **and** touched and revalidates, so
a required-field error clears as soon as the user picks something.
- The popover is **not** modal. In a multi-step form inside a scroll container,
Radix's modal mode (scroll-lock + focus guards) closed our popover a few
hundred milliseconds after it opened; non-modal is also the better behaviour
for a field, since the rest of the form stays readable.
- No interactive control nested inside the trigger button: chips with their own
remove buttons belong outside the `<button>`, not in it.

## 4. Why it should live in the design system

Multi-value domain fields are not specific to this app: any IGRP screen backed
by a `array[string]` DTO field hits the same wall, and today each app either
re-implements this or silently ships a field whose value never arrives. The
piece is pure UI over primitives the kit already exports (`Popover`,
`Command*`, `Checkbox`, `Badge`, `Button`, `IGRPIcon`, `cn`), so it costs the
team one component and no new dependency.

## 5. Our local implementation

### 5.1 What it does

- Trigger shows the single label, or `N opções selecionadas` plus a count
badge; placeholder styling while empty; `aria-invalid` + destructive border
when the field is in error.
- Popover holds a `Command` list with one checkbox row per option (optional
`description` and `icon`), keyboard navigation, an auto-appearing search box
from 8 options up, and a footer with `x de y` plus "Selecionar tudo" /
"Limpar".
- Picked options are echoed **below** the trigger as chips, each with its own
remove button.
- Bound to the form through `useIGRPFormContext()`; also usable standalone via
`value` / `onChange`.

### 5.2 Two things worth copying

- **Read the value at click time, not at render time.** Handlers that closed
over the render's selection lost an edit when two clicks landed in the same
tick (removing two chips quickly): both started from the same array and the
second write undid the first. The handlers now call `getValues(name)` to get
the current array before computing the next one.
- **Tolerate a loose string.** Our Zod layer accepts a bare string where the
API declares `array[string]`, so the field normalizes whatever it reads into
a list (`toList`) instead of assuming an array.

### 5.3 Source (verbatim)

Two comments in it point at things outside this file: `DESIGN_SYSTEM_REQUESTS.md §11`
is this request, and `pedido-schema.ts` is our Zod schema, which accepts a bare
string where the API declares `array[string]` — hence `toList`.

```tsx
"use client";

import {
  Badge,
  Button,
  Checkbox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  IGRPIcon,
  type IGRPOptionsProps,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useIGRPFormContext,
} from "@igrp/igrp-framework-react-design-system";
import { useId, useMemo, useState } from "react";

export type MultiSelectOption = IGRPOptionsProps & { disabled?: boolean };

/**
 * O schema aceita string solta além de `string[]` (ver `apiOptionalStringArray`
 * em pedido-schema.ts), por isso o valor do campo normaliza-se sempre em lista.
 */
function toList(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.filter((v): v is string => typeof v === "string");
  if (typeof raw === "string" && raw !== "") return [raw];
  return [];
}

export interface MultiSelectFieldProps {
  /** Field name in the surrounding `IGRPForm` schema. Ignored in controlled mode. */
  name?: string;
  label?: string;
  options: MultiSelectOption[];
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  /** Error message override; by default the form's own error for `name` is shown. */
  errorText?: string;
  /** Text on the trigger while nothing is picked. */
  placeholder?: string;
  /** Text inside the dropdown when no option matches the search. */
  emptyLabel?: string;
  searchPlaceholder?: string;
  /** Force the search box on/off. Default: shown from 8 options up. */
  showSearch?: boolean;
  /** Hide the "Selecionar tudo" / "Limpar" row. */
  hideBulkActions?: boolean;
  /** Cap on how many options can be picked. */
  maxSelected?: number;
  className?: string;
  /** Controlled mode (outside `IGRPForm`): pass both. */
  value?: string[];
  onChange?: (value: string[]) => void;
}

/**
 * Multi-select field for `IGRPForm` — o substituto de
 * `IGRPCombobox variant="multiple"`, cujo modo múltiplo não mantém o valor em
 * lista sincronizado com o formulário (`DESIGN_SYSTEM_REQUESTS.md §11`).
 *
 * Selection lives in a popover list with checkboxes; the picked options are
 * echoed underneath as removable chips, so the choices stay readable without
 * reopening the dropdown and no interactive control ends up nested inside the
 * trigger button.
 *
 * Works either bound to the form by `name`, or controlled via `value`/`onChange`.
 */
export function MultiSelectField({
  name,
  label,
  options,
  required,
  disabled,
  helperText,
  errorText,
  placeholder = "Selecione as opções",
  emptyLabel = "Sem opções disponíveis.",
  searchPlaceholder = "Pesquisar…",
  showSearch,
  hideBulkActions,
  maxSelected,
  className,
  value: valueProp,
  onChange,
}: MultiSelectFieldProps) {
  const fieldId = useId();
  const listId = `${fieldId}-list`;
  const helperId = `${fieldId}-helper`;
  const [open, setOpen] = useState(false);

  const { form } = useIGRPFormContext();
  const controlled = valueProp !== undefined;
  const rawValue = controlled
    ? valueProp
    : name
      ? form?.watch?.(name)
      : undefined;

  const selected = useMemo(() => toList(rawValue), [rawValue]);

  /**
   * O valor tal como está *agora*, não o da renderização que registou o
   * handler: dois cliques no mesmo tick (remover dois chips em sequência
   * rápida) partiam ambos do mesmo `selected` e o segundo desfazia o primeiro.
   */
  function selectedNow(): string[] {
    if (controlled) return selected;
    if (!name) return selected;
    return toList(form?.getValues?.(name));
  }

  const fieldError =
    errorText ??
    (name
      ? (form?.formState?.errors?.[name]?.message as string | undefined)
      : undefined);

  const optionByValue = useMemo(
    () => new Map(options.map((o) => [o.value, o])),
    [options],
  );
  const selectableValues = useMemo(
    () => options.filter((o) => !o.disabled).map((o) => o.value),
    [options],
  );
  const allSelected =
    selectableValues.length > 0 &&
    selectableValues.every((v) => selected.includes(v));
  const atLimit = maxSelected !== undefined && selected.length >= maxSelected;

  function commit(next: string[]) {
    if (controlled) {
      onChange?.(next);
      return;
    }
    onChange?.(next);
    if (!name) return;
    form?.setValue?.(name, next, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  }

  function toggle(optionValue: string) {
    const atual = selectedNow();
    if (atual.includes(optionValue)) {
      commit(atual.filter((v) => v !== optionValue));
      return;
    }
    if (maxSelected !== undefined && atual.length >= maxSelected) return;
    // Mantém a ordem das opções, não a ordem dos cliques — é o que o utilizador
    // vê na lista e o que torna o valor gravado estável entre edições.
    const next = options
      .map((o) => o.value)
      .filter((v) => v === optionValue || atual.includes(v));
    commit(next);
  }

  function remove(optionValue: string) {
    commit(selectedNow().filter((v) => v !== optionValue));
  }

  const searchVisible = showSearch ?? options.length >= 8;
  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (optionByValue.get(selected[0])?.label ?? selected[0])
        : `${selected.length} opções selecionadas`;

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2", className)}>
      {label ? (
        <label
          htmlFor={fieldId}
          className="text-sm font-medium leading-none text-foreground"
        >
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </label>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={fieldId}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={helperText ? helperId : undefined}
            disabled={disabled}
            className={cn(
              "w-full justify-between gap-2 font-normal",
              selected.length === 0 && "text-muted-foreground",
              fieldError && "border-destructive",
            )}
          >
            <span className="truncate">{summary}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              {selected.length > 1 ? (
                <Badge variant="secondary" className="tabular-nums">
                  {selected.length}
                </Badge>
              ) : null}
              <IGRPIcon
                iconName="ChevronsUpDown"
                className="size-4 opacity-50"
              />
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-72 min-w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-0"
        >
          <Command>
            {searchVisible ? (
              <CommandInput placeholder={searchPlaceholder} className="h-9" />
            ) : null}
            <CommandList id={listId} className="max-h-64">
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  const itemDisabled =
                    option.disabled || (atLimit && !isSelected);

                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.value}`}
                      disabled={itemDisabled}
                      onSelect={() => toggle(option.value)}
                      className="flex items-start gap-3"
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={itemDisabled}
                        tabIndex={-1}
                        aria-hidden
                        className="pointer-events-none mt-0.5"
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center gap-2 text-sm leading-snug">
                          {option.icon ? (
                            <IGRPIcon
                              iconName={option.icon}
                              className="size-4 shrink-0 text-muted-foreground"
                            />
                          ) : null}
                          {option.label}
                        </span>
                        {option.description ? (
                          <span className="text-xs leading-relaxed text-muted-foreground">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>

            {hideBulkActions || options.length === 0 ? null : (
              <div className="flex items-center justify-between gap-2 border-t p-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {selected.length} de {options.length}
                  {maxSelected !== undefined ? ` (máx. ${maxSelected})` : ""}
                </span>
                <span className="flex items-center gap-1">
                  {maxSelected === undefined ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={allSelected || selectableValues.length === 0}
                      onClick={() => commit(selectableValues)}
                    >
                      Selecionar tudo
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={selected.length === 0}
                    onClick={() => commit([])}
                  >
                    Limpar
                  </Button>
                </span>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((v) => {
            const option = optionByValue.get(v);
            return (
              <li key={v}>
                <Badge
                  variant="secondary"
                  className="gap-1 py-1 pr-1 pl-2 font-normal"
                >
                  <span className="truncate">{option?.label ?? v}</span>
                  {disabled ? null : (
                    <button
                      type="button"
                      onClick={() => remove(v)}
                      aria-label={`Remover ${option?.label ?? v}`}
                      className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <IGRPIcon iconName="X" className="size-3" />
                    </button>
                  )}
                </Badge>
              </li>
            );
          })}
        </ul>
      ) : null}

      {fieldError ? (
        <p className="text-xs text-destructive">{fieldError}</p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
```

## 6. What we would delete on our side

`_components/multi-select-field.tsx` in full, and its call sites would go back
to `IGRPCombobox variant="multiple"` — or to `IGRPMultiSelect` — with the same
props.