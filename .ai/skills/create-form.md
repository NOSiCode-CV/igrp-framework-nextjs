# Skill: Create Form

## Use when user requests

- forms
- inputs
- validation
- form fields

## Rules

1. Use IGRPForm
2. Use IGRPFormField for each field
3. Use react-hook-form (via IGRPForm)
4. Use zod schema for validation
5. Use IGRPInputText, IGRPSelect, IGRPCheckbox, etc. (never raw input/select)

## Example

```tsx
import {
  IGRPForm,
  IGRPFormField,
  IGRPInputText,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';
import { z } from 'zod';

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

## See also

- .cursor/skills/igrp-design-system/ (Cursor skill)
- docs/ai/components/form.md
- examples/form-basic.tsx
