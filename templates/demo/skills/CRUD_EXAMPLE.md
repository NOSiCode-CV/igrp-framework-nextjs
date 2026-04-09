# CRUD with IGRP Design System – Step-by-Step Guide

This guide shows how to use the IGRP design system skills in Cursor to build a full CRUD (Create, Read, Update, Delete) interface.

---

## Step 1: Start with All Skills Agents

Before building anything, ensure Cursor can discover and use the IGRP skills.

### 1.1 Run the setup script

From the **repo root** (`igrp-framework-nextjs`):

```powershell
.\templates\demo\skills\scripts\setup-cursor-skills.ps1
```

This creates junctions in `.cursor/skills/` pointing to each skill. Cursor will auto-discover them on next load.

### 1.2 Verify skills are available

1. Open Cursor Settings → Rules (or `Cmd+Shift+J` / `Ctrl+Shift+J`)
2. Check that skills appear in the Agent Decides section
3. Or type `/` in Agent chat and search for `igrp-form`, `igrp-datatable`, etc.

### 1.3 Skills you have

| Skill | Use for |
| ------- | --------- |
| `igrp-form` | Forms, validation, form fields |
| `igrp-inputs` | Text, select, checkbox, textarea, etc. |
| `igrp-datatable` | Data tables, pagination, filtering |
| `igrp-button` | Buttons, loading states |
| `igrp-card` | Cards, content containers |
| `igrp-modal` | Modals, dialogs |
| `igrp-layout` | Page header, footer, sidebar |
| `igrp-feedback` | Alerts, badges, toasts |
| `igrp-navigation` | Tabs, dropdown menus |
| `igrp-custom` | Stats cards, avatars |
| `igrp-ui` | Low-level composition |

### 1.4 Context files

The agent uses these for design system rules:

- `./AGENTS.md` – Design system first rule
- `./DESIGN_SYSTEM.md` – Component catalog

---

## Step 2: Define Your Entity

Decide what you’re building a CRUD for (e.g. Products, Users, Orders) and its fields.

**Example – Products:**

| Field | Type | Required |
| ------- | ------ | ---------- |
| name | string | Yes |
| description | text | No |
| price | number | Yes |
| status | select (Active/Inactive) | Yes |

---

## Step 3: Ask for the List Page

Prompt the agent:

```Create a list page for [Entity] using IGRPDataTable. Include:
- Columns: [list your columns]
- Pagination
- Row actions: Edit and Delete buttons
- "Add [Entity]" button in the page header

Use @igrp/igrp-framework-react-design-system. Put the page at src/app/(igrp)/[route]/page.tsx.
```

**Example:**

```Create a list page for products using IGRPDataTable. Include:
- Columns: name, description, price, status (as badge)
- Pagination
- Row actions: Edit and Delete
- "Add Product" button in the page header

Use @igrp/igrp-framework-react-design-system.
```

---

## Step 4: Ask for the Create/Edit Form in a Modal

Prompt the agent:

```Add a modal for creating and editing [Entity]. Use IGRPModalDialog with:
- IGRPForm inside, Zod schema for [list fields]
- Fields: [list with types, e.g. IGRPInputText for name, IGRPSelect for status]
- Save and Cancel buttons
- Open modal when clicking "Add [Entity]" or Edit in the table
- Reset form when opening for create; load data when opening for edit
```

**Example:**

```Add a modal for creating and editing products. Use IGRPModalDialog with:
- IGRPForm, Zod schema for name, description, price, status
- IGRPInputText (name), IGRPTextarea (description), IGRPInputNumber (price), IGRPSelect (status: Active/Inactive)
- Save and Cancel in the footer
- Open from "Add Product" and from Edit action in the table
- Use resetKey when switching between create and edit
```

---

## Step 5: Ask for Delete Confirmation

Prompt the agent:

```Add delete confirmation using IGRPAlertDialog. When user clicks Delete in the table:
- Show confirmation dialog
- On confirm, call delete action and refresh the list
- Show toast on success/error
```

---

## Step 6: Ask for Server Actions / API

Prompt the agent:

```Create server actions for [Entity] CRUD:
- fetchList: get all with pagination
- create: insert new
- update: update by id
- delete: delete by id

Use the existing data layer pattern in this project.
```

Adjust to match your project’s data layer (e.g. Prisma, API routes, etc.).

---

## Step 7: Optional – Invoke Skills Directly

To focus the agent on a specific skill, use slash commands:

- `/igrp-datatable` – for table changes
- `/igrp-form` – for form changes
- `/igrp-modal` – for modal changes

Example: *`/igrp-form` Add a product form with name, price, and status fields.*

---

## Full Example Prompt (All-in-One)

You can use a single prompt for the whole CRUD:

```Create a full CRUD for products using the IGRP design system:

1. List page (src/app/(igrp)/products/page.tsx):
   - IGRPDataTable with columns: name, description, price, status (badge)
   - Pagination, row actions (Edit, Delete)
   - IGRPPageHeader with "Add Product" button

2. Create/Edit modal:
   - IGRPModalDialog with IGRPForm
   - Fields: name (IGRPInputText), description (IGRPTextarea), price (IGRPInputNumber), status (IGRPSelect: Active/Inactive)
   - Zod validation, Save/Cancel

3. Delete: IGRPAlertDialog confirmation, then delete and refresh

4. Server actions: fetchProducts, createProduct, updateProduct, deleteProduct (mock or connect to your data)

Use @igrp/igrp-framework-react-design-system. Follow templates/demo/AGENTS.md and the igrp-form, igrp-datatable, igrp-modal skills.
```

---

## Troubleshooting

| Issue | Solution |
| ------ | ---------- |
| Agent doesn’t use design system | Re-run `setup-cursor-skills.ps1`, restart Cursor |
| Wrong components | Explicitly mention "IGRPForm", "IGRPDataTable" in the prompt |
| Skills not found | Check `.cursor/skills/` has junctions; verify in Cursor Settings → Rules |
