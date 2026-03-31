---
name: igrp-form
description: >-
  Build forms with IGRP Design System using IGRPForm, IGRPFormField, Zod validation,
  and react-hook-form. Use when the user asks for forms, form validation, form fields,
  form submission, or creating input forms. Always prefer IGRPForm over raw HTML forms
  or other form libraries when working in templates/demo or with @igrp/igrp-framework-react-design-system.
---

# IGRP Form Skill

Build validated forms with the IGRP Design System. Uses `IGRPForm`, `IGRPFormField`, Zod schemas, and react-hook-form.

## Quick Start

```tsx
import { z } from 'zod';
import { useRef } from 'react';
import {
  IGRPForm,
  IGRPInputText,
  IGRPButton,
  type IGRPFormHandle,
} from '@igrp/igrp-framework-react-design-system';

const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
});

function MyForm() {
  const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null);

  return (
    <IGRPForm
      schema={schema}
      formRef={formRef}
      onSubmit={async (values) => console.log(values)}
    >
      <IGRPInputText name="name" label="Name" required />
      <IGRPInputText name="email" label="Email" type="email" required />
      <IGRPButton type="submit">Submit</IGRPButton>
    </IGRPForm>
  );
}
```

**Important**: IGRP input components (IGRPInputText, IGRPSelect, IGRPCheckbox, etc.) auto-detect form context and wire themselves. Use `IGRPFormField` only when wrapping custom or primitive inputs—pass `control` from `useIGRPFormContext().form.control`.

## Workflow

1. Define a Zod schema matching your form shape.
2. Create a ref for `IGRPFormHandle<typeof schema>`.
3. Wrap fields in `IGRPForm` with `schema`, `formRef`, and `onSubmit`.
4. Use IGRP input components (IGRPInputText, IGRPSelect, IGRPCheckbox, etc.) directly—they auto-wire when inside IGRPForm.
5. Use `IGRPFormField` only for custom or primitive inputs; pass `control` from `useIGRPFormContext().form.control`.

## Key Rules

- **Always use Zod** for validation. IGRPForm requires a `schema` prop.
- **formRef is required** – use it to call `submit()`, `reset()`, `setGlobalError()`, or `clearGlobalError()` programmatically.
- **IGRPFormField** (for custom inputs) must receive `control` from `useIGRPFormContext().form.control`.
- Use `resetKey` when loading a new record (e.g. `resetKey={recordId}`) to remount the form instead of syncing via effect.

## References

- [form.md](references/form.md) – IGRPForm API, IGRPFormHandle, validation modes
- [form-field.md](references/form-field.md) – IGRPFormField props, render function
- [form-list.md](references/form-list.md) – IGRPFormList for dynamic field arrays
- [standalone-list.md](references/standalone-list.md) – IGRPStandaloneList for non-form lists

## Edge Cases

- **Programmatic submit**: Call `formRef.current?.submit()` from a parent (e.g. modal footer).
- **Reset after load**: Use `resetKey={id}` when switching records to avoid stale values.
- **Global errors**: Use `formRef.current?.setGlobalError('message')` for API errors.
- **Disabled form**: Pass `disabled={true}` to disable all inputs.
