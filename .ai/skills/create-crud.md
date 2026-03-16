# Skill: Create CRUD

## Use when user requests

- CRUD
- create read update delete
- list + form
- admin page

## Rules

1. Create list page with IGRPDataTable
2. Create form page with IGRPForm + IGRPFormField + inputs
3. Use IGRPPageHeader for page title
4. Use IGRPButton for actions (Create, Edit, Delete)
5. Use IGRPModalDialog or separate pages for create/edit
6. Use zod schema for form validation

## Structure

- List: IGRPDataTable with columns, row actions (edit, delete)
- Form: IGRPForm with schema, IGRPFormField per field, IGRPButton submit
- Schema: zod object in separate file or inline

## Example

```tsx
// List page
<IGRPPageHeader title="Users" />
<IGRPDataTable columns={columns} data={users} />

// Form (create/edit)
<IGRPForm schema={userSchema} onSubmit={handleSubmit}>
  <IGRPFormField name="name" label="Name" required>
    <IGRPInputText name="name" />
  </IGRPFormField>
  <IGRPFormField name="email" label="Email" required>
    <IGRPInputText name="email" type="email" />
  </IGRPFormField>
  <IGRPButton type="submit">Save</IGRPButton>
</IGRPForm>
```

## See also

- .cursor/skills/igrp-design-system/ (Cursor skill)
- .ai/skills/create-form.md
- .ai/skills/create-table.md
- examples/crud-page.tsx
