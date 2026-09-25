# §12 — `IGRPCardRadioGroup` / `IGRPCardRadioField`: single choice as selectable cards

**Status:** resolved in the release after `0.1.0-beta.146` by `IGRPRadioGroup variant="card"`
· **Kind:** new component (composition the kit already almost has) + defect

> **Resolution.** `IGRPRadioGroup variant="card"` meets the §3 behavioural contract — the
> alternative §3 offered, since the value, form binding and error contract are the same field's.
> Differences from the §3 interface: no separate controlled component (`IGRPRadioGroup` already
> switches between form-bound and controlled via `value` / `onValueChange`); options are
> `IGRPOptionsProps`, so the icon prop is `icon`, not `iconName`, and `badge` was added to that
> shared type; `orientation` (responsive grid or one column) replaces `gridClassName`; `ariaLabel`
> and `invalid` are not props — the `<legend>` names the group and invalid state follows the error.
>
> **Prerequisite defect.** §2's premise no longer held: the shadcn re-sync of 2026-09-15 moved
> `FieldLabel` and the radio/checkbox/switch primitives to `data-checked:` selectors, which Radix
> never matches, so the selected state did not render anywhere in the kit. Fixed in `tokens.css`
> ([ADR 0002](../packages/design-system/docs/adr/0002-data-checked-matches-radix-state.md)). A
> local port of §5 against the current primitives would also have been unstyled until that fix.
>
> The contract in §3 now also holds for the default variant (field set + legend, validate + dirty +
> touch on pick, `errorText` in controlled mode, per-option disabled dims text only).
**Design system:** `@igrp/igrp-framework-react-design-system@0.1.0-beta.145`
**Consumer:** Next.js 15.5.25 · React 19.2.8 · Tailwind v4 · `react-hook-form` via `IGRPForm`
**Local components:** `_components/card-radio-group.tsx` (controlled) and
`_components/card-radio-field.tsx` (form-bound) — full source at the bottom

## 1. What we needed

Several screens in our specification type a single-choice field as **"SELECT
(cards visuais)"**: the options are shown as selectable cards, each with an
icon, a title and a one-line explanation, rather than as a dropdown or a row of
radio dots. In our app this backs the request type (3 options, each with its
own meaning for the rest of the form) and the time-pattern selector (3 options
that change which date fields appear below).

The cards are not decoration: the options carry consequences the user has to
weigh before picking, and a dropdown hides exactly the text that makes the
choice obvious.

## 2. What the design system offers, and why it did not cover it

`IGRPRadioGroup` is the single-choice field, and its option type already
carries a `description`:

```ts
// dist/components/horizon/input/radio-group.d.ts
type IGRPRadioOption = {
    /** Option value. */
    value: string;
    /** Option label. */
    label: string;
    /** Optional description. */
    description?: string;
    /** Disable this option. */
    disabled?: boolean;
};

interface IGRPRadioGroupProps extends IGRPBaseAttributes,
    VariantProps<typeof radioItemVariants>,
    React.ComponentProps<typeof RadioGroup> {
    options: IGRPRadioOption[];
    error?: string;
    /** @deprecated This props will be deprecated in the next major release. */
    gridSize?: IGRPGridSize;
}
```

What is missing is the **presentation**: it renders dots in a row/grid, there
is no per-option icon, and there is no card surface, so an option with a
description reads as loose text next to a dot rather than as a choice you click
on. `IGRPSelect` / `IGRPCombobox` are the other single-choice fields and both
hide the descriptions behind a closed trigger.

Meanwhile the primitives layer **already ships the hard part**. `FieldLabel`
carries the whole card behaviour when it wraps a `Field`:

```js
// dist/components/primitives/field.js — FieldLabel
cn(
  "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
  "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border *:data-[slot=field]:p-4",
  "has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10",
  className,
)
```

So the kit can already draw a radio card — it just does not expose one as a
field. Every consumer that wants the pattern has to rediscover this class
soup, and the ones that do not will hand-roll a `<label>` with
`selected && "border-primary"`, which is what we shipped first and what drifts
from the control's real state.

## 3. What we are asking for

Two exports, mirroring the split the kit already uses elsewhere (a controlled
presentational piece plus a form-bound field):

```ts
type IGRPCardRadioOption = {
  value: string;
  label: string;
  description?: string;
  /** Lucide icon name, as IGRPIcon takes it. */
  icon?: IGRPIconName | string;
  /** Short tag rendered next to the label. */
  badge?: string;
  disabled?: boolean;
};

/** Controlled; no form context. */
interface IGRPCardRadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: IGRPCardRadioOption[];
  /** Accessible name for the group. */
  ariaLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Form-bound: same conventions as IGRPRadioGroup. */
interface IGRPCardRadioFieldProps {
  name?: string;
  label?: string;
  options: IGRPCardRadioOption[];
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  errorText?: string;
  emptyLabel?: string;
  /** Grid classes for the card row. */
  gridClassName?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  /** Controlled mode, for use outside IGRPForm. */
  value?: string;
}
```

An acceptable alternative: keep one component and add
`variant="card"` + `icon`/`badge` on `IGRPRadioOption` to `IGRPRadioGroup`. We
care about the behaviour below, not the name.

**Behavioural contract we depend on**

- Selected styling comes from the radio's own `data-state`, never from a prop
  the consumer computes. A card cannot look selected while its radio is not.
- Clicking anywhere on the card selects it; the card is one label for one
  radio, and the radio keeps real keyboard semantics (arrow keys move within
  the group, `:focus-visible` rings the whole card).
- `disabled` per option dims that card's title and description — not a blanket
  opacity on a wrapper.
- The field form writes with validate + dirty + touched, so a required-field
  error clears as soon as the user picks a card.
- Grouping uses `FieldSet` + `FieldLegend`, the message uses `FieldError`
  (`role="alert"`), and invalid state is `data-invalid` on the set plus
  `aria-invalid` on the group — the same contract the rest of the kit's fields
  follow.
- Cards in a row are equal height regardless of description length.

## 4. Why it should live in the design system

Three reasons. It is a **presentation of a field the kit already owns**, so
leaving it out means every app re-derives the same `has-data-[state=checked]`
composition. The **class soup is internal knowledge** — the behaviour above
depends on `data-slot` names and `group/field` scopes that are implementation
details of `field.js`, which consumers should not be pinned to. And it costs
**no new dependency**: `RadioGroup`, `Field*`, `Badge`, `IGRPIcon` and `cn` are
all already exported.

## 5. Our local implementation

`CardRadioGroup` is the controlled piece; `CardRadioField` wraps it for
`IGRPForm` (label, helper text, error, empty state) and maps our option type
onto it. Two notes for whoever ports it:

- The selected/hover/focus/invalid states are pure CSS on the `FieldLabel`; the
  only JS state is the radio group's value.
- `CardRadioField` reads and writes the form through `useIGRPFormContext()`,
  and also accepts `value` for use outside a form.
- The `DESIGN_SYSTEM_REQUESTS.md §12` mentioned in both docblocks is this
  request; "cards visuais" is the wording of our functional specification.

### 5.1 `card-radio-group.tsx` (verbatim)

```tsx
"use client";

import {
  Badge,
  cn,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  IGRPIcon,
  type IGRPIconName,
  RadioGroup,
  RadioGroupItem,
} from "@igrp/igrp-framework-react-design-system";
import { useId } from "react";

export interface CardRadioOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  iconName?: IGRPIconName | string;
  /** Short tag shown next to the label — e.g. "Permite renovação". */
  badge?: string;
  disabled?: boolean;
}

interface CardRadioGroupProps<T extends string = string> {
  /** Currently selected option value. */
  value: T;
  /** Fired with the newly picked value — never fired for the already-selected card. */
  onValueChange: (value: T) => void;
  options: CardRadioOption<T>[];
  /** Accessible name for the group (visually hidden). */
  ariaLabel?: string;
  /** Marks the whole group invalid, for the surrounding field to explain. */
  invalid?: boolean;
  disabled?: boolean;
  /** Overrides the responsive column grid. */
  className?: string;
}

/**
 * Single choice rendered as selectable cards ("cards visuais" in the SIGOVP
 * spec) instead of a dropdown or a row of radio dots.
 *
 * It is the shadcn *radio card* composition as the design system ships it:
 * `FieldLabel` wrapping a `Field` already carries the card chrome (border,
 * padding) and the `has-data-[state=checked]` selected state, so selection is
 * styled by CSS from the radio's own state — no `selected && "…"` class
 * juggling, and the state stays correct even mid-transition.
 *
 * Controlled only; `CardRadioField` is the form-bound wrapper. Asked upstream
 * as `IGRPCardRadioGroup` (`DESIGN_SYSTEM_REQUESTS.md §12`).
 */
export function CardRadioGroup<T extends string = string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  invalid,
  disabled,
  className,
}: CardRadioGroupProps<T>) {
  const groupId = useId();

  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
        "aria-invalid:[&_[data-slot=field-label]]:border-destructive/50",
        className,
      )}
    >
      {options.map((option) => {
        const itemId = `${groupId}-${option.value}`;
        const itemDisabled = disabled || option.disabled;

        return (
          <FieldLabel
            key={option.value}
            htmlFor={itemId}
            className={cn(
              "h-full cursor-pointer transition-colors",
              "hover:bg-accent/40 has-data-[state=checked]:hover:bg-primary/10",
              "has-[[data-slot=radio-group-item]:focus-visible]:ring-[3px] has-[[data-slot=radio-group-item]:focus-visible]:ring-ring/50",
              itemDisabled && "cursor-not-allowed",
            )}
          >
            <Field
              orientation="horizontal"
              data-disabled={itemDisabled || undefined}
            >
              <FieldContent>
                <FieldTitle className="gap-2">
                  {option.iconName ? (
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-has-data-[state=checked]/field:bg-primary/10 group-has-data-[state=checked]/field:text-primary"
                      aria-hidden
                    >
                      <IGRPIcon iconName={option.iconName} className="size-4" />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 text-pretty">
                    {option.label}
                  </span>
                  {option.badge ? (
                    <Badge variant="secondary" className="shrink-0 font-normal">
                      {option.badge}
                    </Badge>
                  ) : null}
                </FieldTitle>
                {option.description ? (
                  <FieldDescription className="text-xs">
                    {option.description}
                  </FieldDescription>
                ) : null}
              </FieldContent>
              <RadioGroupItem
                id={itemId}
                value={option.value}
                disabled={itemDisabled}
              />
            </Field>
          </FieldLabel>
        );
      })}
    </RadioGroup>
  );
}
```

### 5.2 `card-radio-field.tsx` (verbatim)

```tsx
"use client";

import {
  cn,
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
  type IGRPOptionsProps,
  useIGRPFormContext,
} from "@igrp/igrp-framework-react-design-system";
import {
  CardRadioGroup,
  type CardRadioOption,
} from "@myapp/_components/card-radio-group";
import { useId } from "react";

export type CardRadioFieldOption = IGRPOptionsProps & {
  disabled?: boolean;
  /** Short tag shown next to the label. */
  badge?: string;
};

function toCardOptions(options: CardRadioFieldOption[]): CardRadioOption[] {
  return options.map((o) => ({
    value: o.value,
    label: o.label,
    description: o.description,
    iconName: o.icon,
    badge: o.badge,
    disabled: o.disabled,
  }));
}

export interface CardRadioFieldProps {
  /** Field name in the surrounding `IGRPForm` schema. Ignored in controlled mode. */
  name?: string;
  label?: string;
  options: CardRadioFieldOption[];
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  /** Error message override; by default the form's own error for `name` is shown. */
  errorText?: string;
  /** Shown instead of the cards when `options` is empty. */
  emptyLabel?: string;
  /** Grid classes for the card row; defaults to 1/2/3 columns. */
  gridClassName?: string;
  className?: string;
  /** Runs after the value is written to the form — for cascade resets, etc. */
  onValueChange?: (value: string) => void;
  /** Controlled mode (outside `IGRPForm`): pass both. */
  value?: string;
}

/**
 * Card radio field — a single-choice field rendered as the spec's "cards
 * visuais", bound to `IGRPForm` the same way `IGRPRadioGroup` is.
 *
 * Follows the shadcn grouping rule the design system implements: a `FieldSet`
 * with a `FieldLegend` around the radios, `FieldDescription` for the helper
 * text and `FieldError` (`role="alert"`) for the message, with `data-invalid`
 * on the set and `aria-invalid` on the control so label and cards pick up the
 * error state themselves.
 *
 * Reach for it when each option deserves a description or an icon and there
 * are only a handful of them; keep `IGRPRadioGroup` for terse choices. Asked
 * upstream as `IGRPCardRadioField` (`DESIGN_SYSTEM_REQUESTS.md §12`).
 */
export function CardRadioField({
  name,
  label,
  options,
  required,
  disabled,
  helperText,
  errorText,
  emptyLabel = "Sem opções disponíveis.",
  gridClassName,
  className,
  onValueChange,
  value: valueProp,
}: CardRadioFieldProps) {
  const fieldId = useId();
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  const { form } = useIGRPFormContext();
  const controlled = valueProp !== undefined;
  const rawValue = controlled
    ? valueProp
    : name
      ? form?.watch?.(name)
      : undefined;
  const value = typeof rawValue === "string" ? rawValue : "";

  const fieldError =
    errorText ??
    (name
      ? (form?.formState?.errors?.[name]?.message as string | undefined)
      : undefined);

  function handleChange(next: string) {
    if (!controlled && name) {
      form?.setValue?.(name, next, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
    onValueChange?.(next);
  }

  return (
    <FieldSet
      className={cn("gap-3", className)}
      data-invalid={fieldError ? true : undefined}
      data-disabled={disabled || undefined}
      aria-describedby={
        cn(helperText && helperId, fieldError && errorId) || undefined
      }
    >
      {label ? (
        <FieldLegend
          variant="label"
          className={cn("mb-0", fieldError && "text-destructive")}
        >
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </FieldLegend>
      ) : null}

      {options.length === 0 ? (
        <FieldDescription>{emptyLabel}</FieldDescription>
      ) : (
        <CardRadioGroup
          value={value}
          onValueChange={handleChange}
          options={toCardOptions(options)}
          ariaLabel={label}
          disabled={disabled}
          invalid={Boolean(fieldError)}
          className={gridClassName}
        />
      )}

      {fieldError ? (
        <FieldError id={errorId} className="text-xs">
          {fieldError}
        </FieldError>
      ) : helperText ? (
        <FieldDescription id={helperId} className="text-xs">
          {helperText}
        </FieldDescription>
      ) : null}
    </FieldSet>
  );
}
```

## 6. What we would delete on our side

Both files, and their call sites would move to `IGRPCardRadioField` (or
`IGRPRadioGroup variant="card"`) with the same props.
