# Trae project rules — IGRP Next.js template

This project uses the IGRP framework. All UI must follow the IGRP design system conventions.

## Required reading before UI work

**Read `.agents/skills/igrp-design-system/SKILL.md` and follow its instructions** before writing any form, table, chart, modal, or component import from `@igrp/igrp-framework-react-design-system`. It documents the three-layer picker (Horizon → Custom → Primitives), the prop shapes the package actually exports, and the repo-wide hard rules.

Deep references for heavy families live alongside SKILL.md under `.agents/skills/igrp-design-system/references/` — load only the relevant one:

- `forms.md` — `IGRPForm` + Zod + all `IGRPInput*` (any form work)
- `data-table.md` — `IGRPDataTable`, `createIGRPColumnHelper`, row actions
- `charts.md` — `IGRPAreaChart` / `IGRPVerticalBarChart` / etc.
- `horizon.md`, `primitives.md`, `utilities.md`, `custom.md`

@.agents/skills/igrp-design-system/SKILL.md

## Hard rules

- All UI from `@igrp/igrp-framework-react-design-system`. Never raw shadcn/MUI/Mantine.
- `'use client'` on every file importing from the design system.
- Forms are **always** `IGRPForm` + Zod — never raw `<form>` or direct `react-hook-form`.
- Semantic tokens only (`bg-primary`, `text-destructive`, …) — never raw palette (`bg-blue-500`).
- No manual `dark:` overrides — tokens handle dark mode.
- `cn()` for class merging, `size-*` when w = h, `flex gap-*` not `space-x-*` / `space-y-*`.

## Permissions — there is NO default-deny

A page with no permission check is fully open and deep-linkable; a hidden menu item is navigation UX, not enforcement.

- Page needing a permission → `await igrpAssertAuthorize("<perm>")` from `@igrp/framework-next` on the **first line** of the server component (denied → 403).
- Page not needing one → say so in a one-line comment, so it reads as a decision rather than an omission.
- Server action → `igrpAuthorize(name)` (boolean) + `{ ok: false, code: "forbidden" }`; an action has no 403 boundary. Always gate the action behind a mutating control — the control itself is cosmetic.
- Client UI → `<IGRPAuthorization permission="…">` or `usePermissions().isAllowed(…)` from `@igrp/framework-next-ui`. Never add a `permission` prop to a design-system component.

Full guide: `docs/PERMISSIONS.md`. Same rule in `AGENTS.md`.
