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
