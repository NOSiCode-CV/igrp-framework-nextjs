# Forms — IGRPForm + Zod

**Every form in IGRP code uses `IGRPForm` + a Zod schema.** Not raw `<form>`. Not bare `react-hook-form`. The Horizon `IGRPInput*` components read form context via `useFormContext()` and auto-wire — using them outside `IGRPForm` is supported (they fall back to standalone-input mode), but inside one they validate, display errors, and bind to the schema by their `name` prop.

## Minimum viable form

```tsx
"use client"

import { useRef } from "react"
import { z } from "zod"
import {
  IGRPForm,
  type IGRPFormHandle,
  IGRPInputText,
  IGRPButton,
} from "@igrp/igrp-framework-react-design-system"

const schema = z.object({
  email: z.string().email("Endereço inválido"),
  name: z.string().min(2, "Nome obrigatório"),
})

export function ContactForm() {
  const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null)

  return (
    <IGRPForm
      schema={schema}
      formRef={formRef}
      defaultValues={{ email: "", name: "" }}
      onSubmit={async (values) => {
        // values is fully typed as z.infer<typeof schema>
        await saveContact(values)
      }}
      gridClassName="grid gap-4 sm:grid-cols-2"
    >
      <IGRPInputText name="name" label="Nome" showIcon iconName="User" />
      <IGRPInputText name="email" label="Email" type="email" />
      <IGRPButton type="submit" loadingText="A guardar…">Guardar</IGRPButton>
    </IGRPForm>
  )
}
```

The `name` prop on each input is what binds it to the schema. No `register()`, no `Controller`, no `<FormField>` boilerplate.

## `IGRPForm` props

- `schema` — Zod schema (`AnyZod`). Drives validation + the type of `values` in `onSubmit`.
- `formRef` — **required** by the current API. `RefObject<IGRPFormHandle<TSchema> | null>`. The handle extends RHF's `UseFormReturn` and adds `submit()`, `reset()`, `setGlobalError(msg)`, `clearGlobalError()`, `isSubmitting`. Even if you don't need imperative control, you still need to declare a ref and pass it.
- `defaultValues` — `z.input<TSchema>`. The form's `useEffect` syncs new `defaultValues` into the form *only if it's not dirty*; pass a `resetKey` to force a reset.
- `validationMode` — RHF mode: `"onSubmit"` (default) / `"onChange"` / `"onBlur"` / `"onTouched"` / `"all"`.
- `onSubmit(values)` — receives the *parsed/output* type. Async is fine. The form catches thrown errors, surfaces them via `setGlobalError`, and optionally shows a toast.
- `onError(err)` — receives the thrown error after `setGlobalError` runs.
- `showToastOnError` — boolean; when `onSubmit` throws, show a Sonner toast.
- `resetAfterSubmit` — boolean; resets to `defaultValues` after a successful submit.
- `resetKey: React.Key` — change this prop to force a remount-style reset (cleaner than effectful `setValue` loops). Use it when reusing the same form for a new record.
- `disabled` — disables every field via a wrapping `<FieldSet>`.
- `gridClassName` — applied to the inner `<div className="grid gap-4 ...">`. Default is single-column. Pass `grid gap-4 sm:grid-cols-2` for two columns; use `sm:col-span-2` on individual children to break out.
- `className`, `id`, `children`.

## Inputs that auto-wire

All of these read `useFormContext()` and register themselves by `name`:

| Field type | Component |
| --- | --- |
| Text | `IGRPInputText` (`type` accepts `text` / `email` / `number`) |
| Number | `IGRPInputNumber` |
| Password | `IGRPInputPassword` |
| Phone | `IGRPInputPhone` |
| Search | `IGRPInputSearch` |
| URL | `IGRPInputUrl` |
| Multiline | `IGRPTextarea` |
| With prefix/suffix | `IGRPInputAddOn` |
| Color | `IGRPInputColor` |
| Hidden | `IGRPInputHidden` |
| File upload | `IGRPInputFile` |
| Single select | `IGRPSelect` (small lists) / `IGRPCombobox` (searchable / large lists) |
| Radio | `IGRPRadioGroup` |
| Checkbox | `IGRPCheckbox` |
| Switch | `IGRPSwitch` |
| Time | `IGRPInputTime` |
| Date | `IGRPDatePickerSingle` |
| Date range | `IGRPDatePickerRange` |
| Datetime | `IGRPDateTimeInput` |

Common props on all: `name` (required, matches the Zod key), `label`, `helperText`, `required`, `inputClassName`, `className`, `error` (override the form's error message).

**Icon caveat:** every Horizon input takes `iconName` + `iconPlacement`, but the icon only renders if `showIcon` is also set to `true`. Passing just `iconName="User" iconPlacement="start"` will not show the icon — add `showIcon`.

## Dynamic arrays — `IGRPFormList`

For repeating sub-records (line items, contacts), use `IGRPFormList`. Inside an `IGRPForm` it wires to RHF's `useFieldArray` using its **`id` prop as the field name** (counter-intuitive but that's the API). It also has a controlled "standalone" mode via `value` / `onChange`.

```tsx
<IGRPFormList<{ name: string; email: string }>
  id="contacts"
  defaultItem={{ name: "", email: "" }}
  label="Contactos"
  addButtonLabel="Adicionar contacto"
  renderItem={(item, index, onChange) => (
    <>
      <IGRPInputText name={`contacts.${index}.name`} label="Nome" />
      <IGRPInputText name={`contacts.${index}.email`} label="Email" />
    </>
  )}
/>
```

Key props:
- `id: string` — **required**; used as both the DOM id and the field-array name in form mode.
- `defaultItem?: TItem` — shape of a new item when the user adds.
- `renderItem(item, index, onChange?) => ReactNode` — **required**, positional args. The third arg is the per-item `onChange` (used in standalone mode).
- `label`, `description`, `addButtonLabel`, `addButtonIconName`, `addButtonClassName`.
- `computeLabel(item, index) => string` — per-item label for the accordion trigger.
- `badgeValue`, `variant`, `color`, `dot`, `badgeClassName` — show a count/status badge in the list header.
- `allowEmpty`, `allowMultipleOpen`.
- `renderRemoveAction({ index, ariaLabel, onRemove, onTriggerClick }) => ReactNode` — custom remove button.
- `onItemRemove(item, index)` — callback on removal.
- Standalone mode: `value?: TItem[]`, `defaultValue?: TItem[]`, `onChange?(items)` — when present and there's no `IGRPFormContext`, the list manages its own state.

## Composing with `IGRPFormField`

If you need a custom field that the Horizon catalog doesn't cover (wrapping a third-party widget, a custom signature pad, etc.), use `IGRPFormField`. Unlike the `IGRPInput*` components, **it does not autowire** — you pass `control` explicitly from `useFormContext` (or from your own `useForm`).

```tsx
import { useFormContext } from "react-hook-form"
import { IGRPFormField } from "@igrp/igrp-framework-react-design-system"

function SignatureField() {
  const { control } = useFormContext()
  return (
    <IGRPFormField name="signature" label="Assinatura" control={control}>
      {(field, fieldState) => (
        <SignaturePad value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />
      )}
    </IGRPFormField>
  )
}
```

The children render-prop receives `(field, fieldState)` **positionally** (not as a destructured object). `field` is `ControllerRenderProps`, `fieldState` is `ControllerFieldState`. Other props: `helperText`, `required`, `labelPlacement` (`"start" | "end" | "center"`), `isToggle` (horizontal layout for switches), `className`.

Don't wrap an `IGRPInput*` in an `IGRPFormField` — they already do their own field/label/message wiring. Double-wrapping produces duplicate labels and disconnected validation messages.

## Imperative control

```tsx
const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null)

// later:
formRef.current?.submit()
formRef.current?.reset()
formRef.current?.setGlobalError("Falha de rede — tente novamente")
formRef.current?.setValue("email", "novo@example.com") // any UseFormReturn method
formRef.current?.isSubmitting // boolean
```

## Submitting as FormData (server actions)

If the server action expects multipart/`FormData` (e.g. file uploads), convert before sending:

```ts
import { convertValuesToFormData } from "@igrp/igrp-framework-react-design-system"

onSubmit={async (values) => {
  const fd = convertValuesToFormData(values)
  await uploadAction(fd)
}}
```

## Calendars vs date pickers

- **Date pickers (`IGRPDatePicker*`, `IGRPDateTimeInput`, `IGRPInputTime`)** — form-bound inputs. Use inside `IGRPForm`.
- **Calendars (`IGRPCalendarSingle`, `IGRPCalendarRange`, `IGRPCalendarMultiple`, `*Time` variants)** — standalone display widgets (e.g. an availability picker on a dashboard). Not form-bound; manage state yourself.

## Default strings are pt-PT

Built-in messages, placeholders, and helper copy ship in pt-PT (e.g. "Selecione…", "Hoje"). Override per-component via props rather than translating in code — props like `placeholder`, `addButtonLabel`, `notFoundLabel`, etc. are exposed for that purpose.

## Pitfalls

- **Omitting `formRef`** — it's required in the current typings. Even if you don't use it, declare a `useRef<IGRPFormHandle<typeof schema> | null>(null)` and pass it.
- **Putting a primitive `<Input>` inside `IGRPForm`** — it won't register. Use `IGRPInputText`.
- **Wrapping an `IGRPInput*` in `IGRPFormField`** — produces duplicate labels/errors. Use `IGRPFormField` only for custom widgets that aren't already form-aware.
- **Setting `iconName` without `showIcon`** — the icon won't render. Both are needed.
- **Missing `name` on an `IGRPInput*`** — it'll render in standalone mode (no form binding). Always provide `name` matching the schema.
- **Numeric fields with `IGRPInputText type="number"`** — Zod will receive a *string* unless the schema coerces (`z.coerce.number()`) or you use `IGRPInputNumber`. Prefer `IGRPInputNumber`.
- **Async `onSubmit` swallowing errors** — `IGRPForm` already catches and surfaces them (`setGlobalError`, optional toast). Throw or `setGlobalError` — don't `try/catch` and return silently.
- **Resetting via `useEffect` + `setValue`** — change `resetKey` instead. Cleaner and avoids the dirty-state-skip pitfall (the form's effect won't sync new `defaultValues` if it's dirty).
