# IGRPForm

## Description

Form component with react-hook-form integration and zod validation. Must wrap all form fields.

## Props

| Prop | Type | Required |
|------|------|----------|
| schema | ZodSchema | yes |
| onSubmit | (values) => void \| Promise<void> | yes |
| defaultValues | object | no |
| validationMode | onSubmit \| onChange \| onBlur \| onTouched \| all | no |
| formRef | RefObject<IGRPFormHandle> | no |
| resetAfterSubmit | boolean | no |

## Child Components

- IGRPFormField – wraps each input with label and validation
- IGRPInputText, IGRPSelect, IGRPCheckbox, etc. – form inputs

## Example

```tsx
const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
});

<IGRPForm schema={schema} onSubmit={(values) => console.log(values)}>
  <IGRPFormField name="name" label="Name" required>
    <IGRPInputText name="name" />
  </IGRPFormField>
  <IGRPFormField name="email" label="Email" required>
    <IGRPInputText name="email" type="email" />
  </IGRPFormField>
  <IGRPButton type="submit">Submit</IGRPButton>
</IGRPForm>
```

## Structured

```yaml
component: IGRPForm
requires:
  - IGRPFormField
  - zod schema
  - react-hook-form (via IGRPForm)
inputs:
  - IGRPInputText
  - IGRPInputNumber
  - IGRPSelect
  - IGRPCheckbox
  - IGRPRadioGroup
  - IGRPTextarea
  - IGRPDatePickerSingle
  - IGRPInputFile
  - etc.
```
