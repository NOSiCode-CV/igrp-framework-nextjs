# §6. `IGRPLookupField` — a read-only input whose value is _picked_, not typed

> Part of the SIGOVP design-system request bundle — see [README.md](README.md). Cite as `§6`.

**Local workaround.** `src/app/(myapp)/_components/lookup-field.tsx`
(`LookupField` + the private `LookupSearchButton`), with three domain wrappers
on top: `src/app/(myapp)/_components/nif-field.tsx`,
`src/app/(myapp)/_components/num-doc-field.tsx` and
`src/app/(myapp)/_components/licenca-field.tsx`.

**Why it exists.** The pattern is "input + adjacent search button that opens a
picker dialog, which writes the value back into the form". Three things you ship
are nearby, and none of them is it:

- **`IGRPInputSearch`** is the closest _Horizon_ component and is the wrong
  shape: it is a search box — it owns the query, debounces it, and calls
  `onSearch` with the typed text. Ours is a _value display_ whose button opens
  someone else's dialog and whose input is frequently read-only. Expressing one
  as the other means fighting both the debounce and the value ownership.
- **`IGRPInputAddOn`** pairs an input with a `<select>`, not a button.
- **`InputGroup` / `InputGroupAddon` / `InputGroupButton`** (primitives, and
  exported) are the right _layout_ building blocks, and we should say plainly
  that our reference implementation predates our noticing them: it hand-rolls a
  `flex gap-2` row where `InputGroup` would do. If you take this request, build
  the Horizon component on those primitives rather than on our markup.

What is missing is not the chrome, then, but the Horizon-level piece: a
form-bound field with label, helper text, error wiring and — the substantive ask
— the two-field pairing in §6.4, which no combination of the above expresses.

---

## §6.1 Who uses it

Via its three wrappers, in the **pedidos wizard**:

- `NifLookupField` — Etapa 3 "Pesquisa NIF" (the only consumer of
  `SIMPLE_GLOBAL_API_SERVICE_URL`); typed NIF, button queries the global API.
- `NumDocLookupField` — Etapa 3 document-number lookup.
- `LicencaLookupField` — Etapa 1 "Nº de licença anterior"
  (`src/app/(myapp)/_features/pedidos/components/wizard/step-tipo.tsx`),
  opening `LicencaSearchDialog`.

`LicencaLookupField` is the case that shaped the API and is worth reading in
full — it is why `inputDisabled` and `errorText` exist.

---

## §6.2 Current props

| Prop                   | Type                                          | Notes                                              |
| ---------------------- | --------------------------------------------- | -------------------------------------------------- |
| `id`                   | `string`                                      | Also the form field name of the **visible** value. |
| `label`                | `string`                                      |                                                    |
| `required`             | `boolean?`                                    |                                                    |
| `onLookupClick`        | `() => void`                                  | Fired by the button; the caller opens the dialog.  |
| `lookupAriaLabel`      | `string`                                      | Accessible name of the icon button.                |
| `disabled`             | `boolean?`                                    | Disables input **and** button.                     |
| `inputDisabled`        | `boolean?`                                    | Disables only the input; defaults to `disabled`.   |
| `lookupDisabled`       | `boolean?`                                    | Disables only the button.                          |
| `lookupDisabledReason` | `string?`                                     | Tooltip explaining a disabled button.              |
| `iconName`             | `IGRPIconName \| string` (default `"Search"`) |                                                    |
| `buttonClassName`      | `string?`                                     |                                                    |
| `labelTooltip`         | `string?`                                     | `Info` icon next to the label.                     |
| `labelSuffix`          | `ReactNode?`                                  | Right-aligned slot on the label row.               |
| `helperText`           | `string?`                                     |                                                    |
| `errorText`            | `string?`                                     | See §6.4 — this is the important one.              |

---

## §6.3 Behaviour to reproduce

1. **Label row** — `IGRPLabel` + optional `Info` tooltip button + optional
   right-aligned `labelSuffix`, `justify-between`.
2. **Field row** — `flex gap-2`, input `min-w-0 flex-1`, icon button
   `shrink-0`.
3. **Disabled button tooltip.** A disabled `IGRPButton` is wrapped in
   `<span className="inline-flex shrink-0">` so the tooltip still opens —
   the same Radix rule as §3 and §9. When the button is enabled, or no reason
   was given, no tooltip wrapper is mounted at all.
4. **Two independent disabled axes.** `inputDisabled ?? disabled` for the
   input, `disabled || lookupDisabled` for the button. `LicencaLookupField`
   uses this to make the input permanently read-only (the value is a uuid, not
   something a human types) while leaving the search button live.
5. `helperText` dims (`text-muted-foreground/80`) when disabled, and is wired
   through `aria-describedby`.

---

## §6.4 The `errorText` requirement (the part the DS must not drop)

A lookup routinely has **two** form fields: a hidden id that is validated and
sent, and a visible display string that is neither. In
`LicencaLookupField`, `idLicencaAnterior` (uuid, in `IGRPInputHidden`) is what
the Zod refinement faults; `numeroLicencaAnterior` is what the user reads.

A form input can only render _its own_ error, so the fault on the hidden field
has no way to reach the screen. `errorText` is the escape hatch: the wrapper
reads `form.formState.errors[valueField].message` itself and hands it to the
visible field.

Ask: make the DS component understand the pair natively —

```ts
  /** Field holding the value that is validated and submitted. When set, the
   *  component renders the hidden input, and surfaces that field's error under
   *  the visible one. */
  valueName?: string;
  /** Field holding the human-readable text shown in the (usually read-only)
   *  input. Defaults to `name`. */
  displayName?: string;
```

so apps stop hand-wiring `IGRPInputHidden` + `errors[x].message` per lookup.

---

## §6.5 Proposed API

```ts
export interface IGRPLookupFieldProps {
  name: string
  valueName?: string // §6.4
  displayName?: string // §6.4
  label: string
  required?: boolean
  onLookup: () => void // rename: it is not only a click path
  lookupLabel: string // accessible name of the button
  iconName?: IGRPIconName | string // default "Search"
  disabled?: boolean
  inputDisabled?: boolean
  lookupDisabled?: boolean
  lookupDisabledReason?: string
  loading?: boolean // new: the lookup is in flight
  onClear?: () => void // new: see below
  labelTooltip?: string
  labelSuffix?: React.ReactNode
  helperText?: string
  errorText?: string // still useful as a manual override
  className?: string
  inputClassName?: string
  buttonClassName?: string
}
```

Two additions with no local precedent but an obvious need:

- **`loading`** — the NIF lookup is a network round-trip against the global API
  and currently gives no feedback; every consumer would otherwise hand-roll a
  spinner over the button.
- **`onClear`** — a picked-only value cannot be deleted with the keyboard when
  the input is read-only. Today the only way out of a wrong selection is to
  pick a different one.

---

## §6.6 Acceptance criteria

- [ ] Button click fires `onLookup`; the input never owns or debounces a query.
- [ ] `inputDisabled` alone leaves the button interactive; `disabled` disables
      both.
- [ ] A disabled button with `lookupDisabledReason` opens its tooltip on hover
      **and** on keyboard focus.
- [ ] With `valueName` set, the hidden input is rendered, its Zod error appears
      under the visible input, and clearing it clears both fields.
- [ ] `helperText` and `errorText` are both reachable via `aria-describedby`;
      the input is `aria-invalid` when an error is showing.
- [ ] `loading` disables the button and shows a spinner in place of the icon.
- [ ] The label's `Info` tooltip trigger is a real focusable button with an
      accessible name.

---

## §6.7 Reference implementation

The generic field first, then the three domain wrappers — they are what show
the shapes the API has to support, and `LicencaLookupField` in particular is
the case described in §6.4.

### `src/app/(myapp)/_components/lookup-field.tsx`

```tsx
import {
  IGRPButton,
  IGRPIcon,
  type IGRPIconName,
  IGRPInputText,
  IGRPLabel,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@igrp/igrp-framework-react-design-system"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

function LookupSearchButton({
  iconName,
  lookupAriaLabel,
  disabled,
  disabledReason,
  onLookupClick,
  buttonClassName,
}: {
  iconName: IGRPIconName | string
  lookupAriaLabel: string
  disabled: boolean
  disabledReason?: string
  onLookupClick: () => void
  buttonClassName?: string
}) {
  const button = (
    <IGRPButton
      type="button"
      size="icon"
      showIcon
      iconName={iconName}
      onClick={onLookupClick}
      aria-label={lookupAriaLabel}
      disabled={disabled}
      className={cn("shrink-0 transition-opacity", disabled && "opacity-50", buttonClassName)}
    />
  )

  if (!disabled || !disabledReason) {
    return button
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0">{button}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-sm">
          {disabledReason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function LookupField({
  id,
  label,
  required,
  onLookupClick,
  lookupAriaLabel,
  disabled,
  lookupDisabled,
  iconName = "Search",
  buttonClassName,
  labelTooltip,
  labelSuffix,
  helperText,
  lookupDisabledReason,
  inputDisabled,
  errorText,
}: {
  id: string
  label: string
  required?: boolean
  onLookupClick: () => void
  lookupAriaLabel: string
  disabled?: boolean
  lookupDisabled?: boolean
  iconName?: IGRPIconName | string
  buttonClassName?: string
  labelTooltip?: string
  labelSuffix?: ReactNode
  helperText?: string
  lookupDisabledReason?: string
  /**
   * Disables the text input on its own, leaving the search button live.
   * For lookups where the value may only be *picked* (it is an id the user
   * cannot type), not typed — see `LicencaLookupField`. Defaults to
   * `disabled`, so callers that don't pass it keep the previous behaviour.
   */
  inputDisabled?: boolean
  /**
   * Validation message to show under the field. Needed when the value being
   * validated lives on a different form field than the one rendered here (a
   * hidden id next to a visible display value), because the input can only
   * surface its own error.
   */
  errorText?: string
}) {
  const isInputDisabled = Boolean(inputDisabled ?? disabled)
  const isButtonDisabled = Boolean(disabled || lookupDisabled)
  const describedById = helperText ? `${id}-lookup-hint` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <IGRPLabel htmlFor={id} label={label} required={required} />
          {labelTooltip ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex shrink-0 rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Informação"
                  >
                    <IGRPIcon iconName="Info" className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  <p className="text-sm">{labelTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
        {labelSuffix ? <div className="shrink-0">{labelSuffix}</div> : null}
      </div>

      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <IGRPInputText
            id={id}
            required={required}
            aria-label={label}
            aria-describedby={describedById}
            disabled={isInputDisabled}
          />
        </div>
        <LookupSearchButton
          iconName={iconName}
          lookupAriaLabel={lookupAriaLabel}
          disabled={isButtonDisabled}
          disabledReason={isButtonDisabled ? lookupDisabledReason : undefined}
          onLookupClick={onLookupClick}
          buttonClassName={buttonClassName}
        />
      </div>

      {helperText && (
        <p
          id={describedById}
          className={cn("text-xs leading-snug", disabled ? "text-muted-foreground/80" : "text-muted-foreground")}
        >
          {helperText}
        </p>
      )}

      {errorText && <p className="text-xs leading-snug text-destructive">{errorText}</p>}
    </div>
  )
}
```

### `src/app/(myapp)/_components/licenca-field.tsx`

```tsx
import { IGRPInputHidden, useIGRPFormContext } from "@igrp/igrp-framework-react-design-system"
import { LookupField } from "./lookup-field"

/**
 * §3.2.2 Etapa 1, campo "Nº licença": *"Permite pesquisar licença. Abre a
 * lista de licença listando todas as licenças com estado Expirada e as
 * licenças Ativas que vão expirar em 30 dias."*
 *
 * O campo tem **duas identidades** e é preciso mantê-las separadas:
 *
 *  - `valueField` (`idLicencaAnterior`) — o que segue no pedido.
 *    `PedidoStep1RequestDTO.idLicencaAnterior` é `format: uuid` no contrato,
 *    logo tem de ser o `id` da licença.
 *  - `displayField` (`numeroLicencaAnterior`) — o que o utilizador lê e
 *    reconhece (`000001/CMS-SG/2026`). Não existe no DTO; é só de apresentação.
 *
 * Estavam no mesmo campo, e o que a caixa de pesquisa escrevia era o **número**
 * — ou seja, todas as renovações enviavam um número onde o serviço espera um
 * uuid, e a gravação da Etapa 1 falhava. Ao reabrir um pedido dava-se o inverso:
 * o uuid gravado aparecia num campo rotulado "Nº de licença anterior".
 *
 * Daí o input ser só de leitura: um uuid não é digitável, portanto o valor só
 * pode ser **escolhido**. O botão de pesquisa fica sempre ativo (a própria
 * caixa de diálogo tem a sua pesquisa por número), sem o mínimo de caracteres
 * que fazia sentido enquanto se escrevia aqui.
 *
 * A validação (`refineStep1`) continua a incidir sobre `valueField`, que é o
 * campo que tem de existir; como esse campo está escondido, a mensagem é
 * trazida para junto do input visível através de `errorText`.
 */
export function LicencaLookupField({
  valueField = "idLicencaAnterior",
  displayField = "numeroLicencaAnterior",
  label = "Nº de licença anterior",
  disabled,
  onLookupClick,
}: {
  /** Form field holding the licença `id` (uuid) — hidden, validated, sent. */
  valueField?: string
  /** Form field holding the licença `numero` — shown, read-only. */
  displayField?: string
  label?: string
  disabled?: boolean
  onLookupClick: () => void
}) {
  const { form } = useIGRPFormContext()
  const numero = (form?.watch?.(displayField) ?? "") as string
  const id = (form?.watch?.(valueField) ?? "") as string

  const errorText = form?.formState?.errors?.[valueField]?.message as string | undefined

  // Um pedido gravado antes de o número ser resolvido (ou com a licença já
  // indisponível) mostra o campo vazio; sem esta nota, um valor gravado
  // pareceria "nada escolhido" e o utilizador podia apagá-lo sem saber.
  const helperText = disabled
    ? "Campo bloqueado."
    : id && !numero
      ? "Licença selecionada — número indisponível de momento."
      : "Selecione a licença através da pesquisa."

  return (
    <>
      <IGRPInputHidden name={valueField} />
      <LookupField
        id={displayField}
        label={label}
        required
        onLookupClick={onLookupClick}
        lookupAriaLabel="Pesquisar licença anterior"
        disabled={disabled}
        inputDisabled
        helperText={helperText}
        errorText={errorText}
        iconName="FileSearch"
      />
    </>
  )
}
```

### `src/app/(myapp)/_components/nif-field.tsx`

```tsx
import { useIGRPFormContext } from "@igrp/igrp-framework-react-design-system"
import { countDigits, LOOKUP_MIN, minDigitsHint } from "../_lib/lookup-utils"
import { LookupField } from "./lookup-field"

export { countDigits } from "../_lib/lookup-utils"

export function NifLookupField({
  id = "nif",
  isEdit,
  onLookupClick,
}: {
  /** Form field path (e.g. "nif" or "requerentes.0.nif") */
  id?: string
  isEdit?: boolean
  onLookupClick: (nif: string) => void
}) {
  const { form } = useIGRPFormContext()
  const nif = (form?.watch?.(id) ?? "") as string
  const digitCount = countDigits(nif)
  const min = LOOKUP_MIN.nif
  const lookupDisabled = isEdit || digitCount < min
  const digitHint = minDigitsHint(digitCount, min)

  // const helperText = isEdit ? "NIF não editável neste contexto." : digitHint;

  const lookupDisabledReason = isEdit ? "NIF bloqueado." : (digitHint ?? "Pesquisar titular por NIF.")

  return (
    <LookupField
      id={id}
      label="NIF"
      required
      onLookupClick={() => onLookupClick(nif)}
      lookupAriaLabel="Pesquisar NIF"
      disabled={isEdit}
      lookupDisabled={lookupDisabled}
      lookupDisabledReason={lookupDisabledReason}
      iconName="UserRoundSearch"
    />
  )
}
```

### `src/app/(myapp)/_components/num-doc-field.tsx`

```tsx
import { useIGRPFormContext } from "@igrp/igrp-framework-react-design-system"
import { countDigits, LOOKUP_MIN } from "../_lib/lookup-utils"
import { LookupField } from "./lookup-field"

export function NumDocLookupField({
  id = "nr_identificacao",
  tipoIdentificacaoId,
  isEdit,
  onLookupClick,
  labelTooltip,
}: {
  /** Form field path (e.g. "nr_identificacao", "requerentes.0.nr_identificacao", or "numero_documento") */
  id?: string
  /** When set, input and search stay disabled until this field has a value (e.g. tipo de documento) */
  tipoIdentificacaoId?: string
  isEdit?: boolean
  onLookupClick: (numDoc: string) => void
  labelTooltip?: string
}) {
  const { form } = useIGRPFormContext()
  const numDoc = (form?.watch?.(id) ?? "") as string
  const tipoIdentificacao = tipoIdentificacaoId ? ((form?.watch?.(tipoIdentificacaoId) ?? "") as string) : null
  const tipoSelected = tipoIdentificacaoId ? Boolean(tipoIdentificacao?.trim()) : true
  const digitCount = countDigits(numDoc)
  const min = LOOKUP_MIN.numDoc
  const inputDisabled = isEdit || !tipoSelected
  const lookupDisabled = inputDisabled || digitCount < min
  // const digitHint = minDigitsHint(digitCount, min);

  let helperText: string | undefined
  let lookupDisabledReason: string | undefined

  if (isEdit) {
    helperText = "Nº documento não editável neste contexto."
    lookupDisabledReason = "Campo bloqueado."
  } else if (!tipoSelected) {
    helperText = "Selecione primeiro o tipo de documento."
    lookupDisabledReason = helperText
    // } else if (digitHint) {
    //   helperText = digitHint;
    //   lookupDisabledReason = digitHint;
  } else {
    lookupDisabledReason = "Pesquisar por número de documento."
  }

  return (
    <LookupField
      id={id}
      label="Nº Documento"
      required
      onLookupClick={() => onLookupClick(numDoc)}
      lookupAriaLabel="Pesquisar Nº Documento"
      disabled={inputDisabled}
      lookupDisabled={lookupDisabled}
      lookupDisabledReason={lookupDisabledReason}
      helperText={helperText}
      iconName="FileSearch"
      labelTooltip={labelTooltip}
    />
  )
}
```
