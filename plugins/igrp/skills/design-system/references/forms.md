# Forms: `IGRPForm` + Zod

Every form is `IGRPForm` with a Zod schema (zod 4). Horizon fields bind by `name`: there's no `register`, no `Controller` and no `useForm`.

Vocabulary (from the DS's `CONTEXT.md`):
- A field is **form-bound** inside `IGRPForm`, where its value lives in the form under `name`.
- It is **controlled** outside a form, where you own `value` / `onChange`.

## Minimum form

```tsx
"use client"

import { useRef } from "react"
import { z } from "zod"
import {
  IGRPButton,
  IGRPForm,
  type IGRPFormHandle,
  IGRPInputText,
  IGRPSelect,
  IGRPSwitch,
  useIGRPFormContext,
} from "@igrp/igrp-framework-react-design-system"

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.email("Endereço inválido"),
  role: z.enum(["admin", "editor", "viewer"]),
  active: z.boolean(),
})

function SubmitButton() {
  const { isSubmitting } = useIGRPFormContext() // reactive; the button doesn't read form state itself
  return <IGRPButton type="submit" loading={isSubmitting}>Guardar</IGRPButton>
}

export function UserForm({ onSave }: { onSave: (v: z.output<typeof schema>) => Promise<void> }) {
  const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null)
  return (
    <IGRPForm
      schema={schema}
      formRef={formRef}
      defaultValues={{ name: "", email: "", role: "viewer", active: true }}
      onSubmit={onSave}
      gridClassName="sm:grid-cols-2"
    >
      <IGRPInputText name="name" label="Nome" required />
      <IGRPInputText name="email" label="Email" type="email" required />
      <IGRPSelect
        name="role"
        label="Perfil"
        placeholder="Escolha um perfil"
        options={[{ value: "admin", label: "Administrador" }, { value: "editor", label: "Editor" }, { value: "viewer", label: "Leitor" }]}
      />
      <IGRPSwitch name="active" label="Ativo" />
      <div className="sm:col-span-2"><SubmitButton /></div>
    </IGRPForm>
  )
}
```

## `IGRPForm` props

| Prop | Notes |
| --- | --- |
| `schema` | The Zod schema. `onSubmit` receives `z.output<typeof schema>`. |
| `formRef` | **Required by the type.** It's `RefObject<IGRPFormHandle<S> \| null>`, which is `null` until mounted. |
| `defaultValues` | `z.input<S>`. Give every field a default, including `""` for text and `null` for dates. |
| `onSubmit(values)` | May be async. **Throw to report failure.** The form logs it, shows `err.message` (or an i18n fallback) in a red banner above the fields, optionally toasts it, then calls `onError`. The banner clears on the next submit. |
| `onError(err)`, `showToastOnError` | The toast needs a mounted toaster (the template already mounts one). |
| `validationMode` | RHF mode, default `"onSubmit"`. |
| `resetAfterSubmit` | Resets to the defaults after a successful submit. |
| `disabled` | Disables every field (fieldset) and blocks native submit. `formRef.current.submit()` still submits. |
| `gridClassName` | Merged into `grid gap-4` (one column by default). Use `sm:grid-cols-2`, plus `sm:col-span-2` on a child, to make a field span both columns. |
| `resetKey` | Changing it resets values, dirty/touched state and the global error to the current `defaultValues`, even mid-edit. While set, `defaultValues` don't re-sync on their own. |
| `className`, `id`, `children` | Use `id` with `<IGRPButton type="submit" form={id}>` for a button outside the form (e.g. in a modal footer). |

**`defaultValues` re-sync:** a *new object identity* is applied only while the form is not dirty. A changed value under the same identity, or new defaults arriving after the user has typed, are ignored.

**Loading a different record:** pass `resetKey={record.id}` together with that record's `defaultValues`, or call `formRef.current?.reset(values)`. Don't run a `useEffect` + `setValue` loop.

**Handle (`formRef.current`):** every RHF `UseFormReturn` method (`setValue`, `getValues`, `reset`, `trigger`, `watch`, …), plus `submit()`, `setGlobalError(msg)`, `clearGlobalError()` and `isSubmitting`. That `isSubmitting` is a non-reactive snapshot; for UI, use `useIGRPFormContext().isSubmitting` in a child component.

**`useIGRPFormContext()`** returns `{ form, isSubmitting, formError?, disabled? }` and throws outside `IGRPForm`.

## Fields and the value each one writes

Shared props: `name`, `label`, `helperText`, `required` and `className`. Write your Zod schema to match the **Writes** column.

| Field | Writes | Notes |
| --- | --- | --- |
| `IGRPInputText` | `string` | `type="number"` still writes a string, so use `IGRPInputNumber`. |
| `IGRPInputNumber` | `number \| undefined` | Clearing writes `undefined` (`z.number().optional()`). Props: `min` / `max` (clamped on blur) and `formatOptions: Intl.NumberFormatOptions`. |
| `IGRPInputPassword` | `string` | `showPasswordToggle` (default true). |
| `IGRPInputPhone` | E.164 `string \| undefined` | `defaultCountry` (e.g. `"CV"`), `countries`, `international` (default true). |
| `IGRPInputUrl` | `protocol + address` | `name` is required. `protocols`, `defaultProtocol` (default `"https://"`). An emptied field still holds `"https://"`, so validate with `z.url()`, not `.min(1)`. |
| `IGRPInputSearch` | `string` | `onSearch`, `isDebounce` + `debounceMs` (2000). Enter runs `onSearch` and **does not submit the form**. |
| `IGRPTextarea` | `string` | `rows` (3). |
| `IGRPInputTime` | `"HH:mm"` | |
| `IGRPDateTimeInput` | masked `string` `"dd/MM/yyyy, HH:mm"` | Not a `Date`. Pass a matching `placeholder`, because the default uses dashes. |
| `IGRPDatePickerSingle`, `IGRPDatePickerInputSingle` (typed and masked) | `Date \| null` | **Clearing writes `null`**, so use `z.date().nullable()`. They read a Date, a number, ISO or `"yyyy-MM-dd"`. Props: `dateFormat` (`"dd-MM-yyyy"`), `disableBefore`, `disableAfter`, `disableDayOfWeek`. |
| `IGRPDatePickerRange` | `DateRange { from, to? }` | |
| `IGRPDatePickerMultiple` | `Date[]` | |
| `IGRPSelect` | `string` | `placeholder` defaults to the catalog ("Selecionar uma opção"). Also `showSearch`. |
| `IGRPCombobox` | `string` | Searchable single choice for long lists. Re-clicking the selected option clears it to `""`. |
| `IGRPMultiSelect` | `string[]` | Kept in **option order**, not click order. Props: `maxSelected`, `hideChips`, `hideBulkActions`, `showSearch` (auto from 8 options). Codes with no matching option stay selected. Never use `IGRPCombobox variant="multiple"` (deprecated). |
| `IGRPRadioGroup` | `string` | `variant="card"` gives option cards (see below). |
| `IGRPCheckbox`, `IGRPSwitch` | `boolean` | Checked only when the value is `=== true`, so the string `"true"` won't check it. |
| `IGRPInputColor` | `string` | Writes **`oklch(...)` by default**. Pass `format="hex"` for hex. |
| `IGRPInputFile` | See notes | Default variant: `File \| null`, or a **`FileList`** with `multiple`, plus `accept`. `variant="dropzone"`: `File \| null`, or `File[]` with `multiple`, plus `acceptTypes`, `maxSize` (10 MB), `maxFiles`, `onFilesChange`. |
| `IGRPInputHidden` | as set | |

Options for every choice field are `IGRPOptionsProps`: `{ value, label, description?, icon?, group?, status?, color?, image?, flag?, disabled?, badge? }`.

## Binding rules

- **Binding follows the context, not `name`.** A field inside a form binds to `name`. If `name` is missing, it falls back to `id` and then to a generated key, so it **still binds**, just under a key your schema doesn't know. Always pass `name`, matching the schema key (`contacts.0.email` for nested paths).
  - `IGRPMultiSelect` and `IGRPRadioGroup` bind only when `name` is set and `value` isn't.
- **Error message prop:** most fields show the schema error automatically.
  - To override the text, use `errorText` on `IGRPCombobox`, `IGRPMultiSelect`, `IGRPRadioGroup` and `IGRPFormField`, and `error` on text-like inputs, `IGRPCheckbox`, `IGRPSwitch`, `IGRPInputColor` and the rich-text editor.
  - `IGRPSelect` ignores both in form mode.
- **Icons:** only `IGRPInputText` (`showIcon` + `iconName` + `iconPlacement`), `IGRPInputSearch` (icon shown by default) and `IGRPCombobox` (per-option `icon`) render an icon. Other fields accept the props and drop them.
- **Grid spans:** `IGRPTextarea`, `IGRPInputTime`, `IGRPInputFile`, `IGRPCheckbox` and `IGRPSwitch` put `className` on the control, not on the grid cell. Wrap them in a `<div className="sm:col-span-2">` to span columns.
- **`IGRPInputAddOn` is not form-bound.** It's a controlled prefix/suffix input (`options`, `selectValue`, `onSelectValueChange`). Inside a form, use an `IGRPInputText` plus a separate `IGRPSelect`, or wrap it in `IGRPFormField`.
- Your own `onChange` / `onBlur` on a field runs after the binding and can't replace it.

## Option cards: `IGRPRadioGroup variant="card"`

Use it for a handful of choices that each need a description or icon. Don't hand-roll a `<label>` with `selected && "border-primary"`; the card's selected look comes from the radio's own state.

```tsx
<IGRPRadioGroup
  name="tipoPedido"
  label="Tipo de pedido"
  variant="card"
  required
  options={[
    { value: "nova", label: "Nova licença", description: "Primeiro pedido.", icon: "FilePlus" },
    { value: "renovacao", label: "Renovação", description: "Prolonga uma licença.", icon: "RefreshCw", badge: "Permite renovação" },
  ]}
/>
```

- `orientation: "horizontal"` (the default) is a responsive 1/2/3-column grid of equal-height cards; `"vertical"` is a single column.
- `icon` and `badge` render only on cards.
- `emptyLabel` replaces the cards when there are no options.
- Picking an option validates, dirties and touches the field. Override the message with `errorText`.
- Deprecated: `variant="outline" | "soft"` (they render as default), `size`, `gridSize` and `error`.

## Rich text: `IGRPRichTextEditor` / `IGRPRichTextView`

These live in a **separate entry**, so apps that don't import it never bundle TipTap:

```tsx
import { IGRPRichTextEditor, IGRPRichTextView } from "@igrp/igrp-framework-react-design-system/rich-text"

<IGRPRichTextEditor name="corpo" label="Corpo do email" required preset="email" readOnly={isView}
  variables={[{ value: "{{nome_titular}}", label: "Nome do titular" }]} />

<IGRPRichTextView html={preview} maxHeight={240} />
```

- **Value:** it writes an HTML `string`, and an empty body is `""`, so `z.string().min(1)` works as "required". It binds by `name`, or runs controlled with `value` / `onChange`. `value` is ignored inside a form.
- **Toolbar:** pass either `preset` or `controls`, never both.
  - `preset="full"` is the default.
  - `preset="email"` offers only email-safe formatting.
  - `controls={["bold", "italic", "link"]}` sets an explicit control list.
- **Read-only:** `readOnly` and `disabled` hide the toolbar without dirtying the form.
- **Variables:** they insert plain `{{…}}` text. There are no images and no source view.
- **Rendering stored HTML:** render it only through `IGRPRichTextView` (`html`, `emptyLabel` (default `"—"`), `maxHeight`). It re-parses the HTML through the same schema, so scripts, iframes, event handlers and `javascript:` links are dropped. **Never use `dangerouslySetInnerHTML`.** The view protects the DOM, not the stored data.
- **Styling:** typography comes from DS tokens. Don't wrap it in `prose`.

## Repeating rows: `IGRPFormList`

```tsx
<IGRPFormList<{ name: string; email: string }>
  name="contacts"
  id="contacts"
  label="Contactos"
  defaultItem={{ name: "", email: "" }}
  addButtonLabel="Adicionar contacto"
  computeLabel={(item, i) => item.name || `Contacto ${i + 1}`}
  renderItem={(_item, index) => (
    <>
      <IGRPInputText name={`contacts.${index}.name`} label="Nome" />
      <IGRPInputText name={`contacts.${index}.email`} label="Email" />
    </>
  )}
/>
```

- **Field-array name:** it's `name ?? id`. Child names must be `` `${name}.${index}.field` ``.
- **`renderItem(item, index, onChange?)`:** the third argument is `undefined` in form mode.
- **`defaultItem`:** required in practice, because the add button is disabled without it.
- **Empty lists:** `allowEmpty` defaults to `false`, so the list seeds one row and won't remove the last one. Set `allowEmpty` to allow an empty list.
- **Other props:**
  - Accordion: `allowMultipleOpen`.
  - Item handling: `onItemRemove(item, index)` and `renderRemoveAction(...)`.
  - Header badge: `badgeValue`, `variant`, `color`, `dot`.
  - Appearance: `description`, `addButtonIconName`, `showIcon` (default true) and `iconName`.
- **Controlled mode:** `value` / `defaultValue` / `onChange` work only outside `IGRPForm`. `IGRPStandaloneList` is a deprecated alias for that.

## Custom widgets: `IGRPFormField`

For a widget that isn't form-aware (a signature pad, a third-party picker). Unlike the `IGRP*` fields, **it takes `control` explicitly**:

```tsx
function SignatureField() {
  const { form } = useIGRPFormContext()
  return (
    <IGRPFormField name="signature" label="Assinatura" control={form.control} required>
      {(field, fieldState) => <SignaturePad value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />}
    </IGRPFormField>
  )
}
```

- **`children`:** `(field, fieldState) => ReactNode` (positional arguments) or a plain node.
- **Other props:** `helperText`, `errorText`, `required`, `isToggle` (horizontal layout for toggles), `labelPlacement` (only `"end"` has an effect) and `className`.
- **Don't wrap an `IGRP*` field in it.** Doing so duplicates the label and the message.

To build a reusable form-aware widget, read `useIGRPFormContext().form` and bind it yourself. `IGRPLabel` and `IGRPFieldDescription` (`helperText`, `error`) supply matching chrome.

## Server actions and `FormData`

The cleanest way is to pass the typed values object to a server action that validates it again with the same schema. For multipart (uploads), `convertValuesToFormData(values)` flattens the top level:
- `File` values, `FileList`s and `File[]` append one binary entry per file under the key.
- Arrays of primitives append one entry each.
- Nested objects and list rows become JSON strings.
- Booleans become `"true"` / `"false"`.
- `null` / `undefined` are skipped.
- **Dates go through `toISOString()`, which is an instant in UTC.** A date-only value at local midnight reads as the previous day in UTC+ zones, so format it yourself (`"yyyy-MM-dd"`) when the backend wants a calendar day.

## Calendars vs date pickers

- **Date pickers are form fields.** That's `IGRPDatePicker*`, `IGRPDateTimeInput` and `IGRPInputTime`.
- **Calendars are display widgets with caller-owned state, not form fields.** That's `IGRPCalendarSingle`, `IGRPCalendarRange`, `IGRPCalendarMultiple` and their `*Time` variants. Use them for things like an availability view.

## Default strings

Built-in placeholders and messages come from `IGRPI18nProvider` (pt by default; see `utilities.md`). Per-instance props (`placeholder`, `addButtonLabel`, …) override the provider. Pass the per-instance prop only when the copy is specific to that screen.
