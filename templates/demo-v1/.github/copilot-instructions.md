# GitHub Copilot instructions — IGRP Next.js template

This project uses the IGRP framework. All UI must follow the IGRP design system conventions documented in the canonical skill at `.agents/skills/igrp-design-system/SKILL.md`.

## Before suggesting any UI code

Open `.agents/skills/igrp-design-system/SKILL.md` and follow its three-layer picker (Horizon `IGRP*` first, then Custom, then Primitives only as escape hatch). For heavier families, also consult:

- `.agents/skills/igrp-design-system/references/forms.md` — `IGRPForm` + Zod + all `IGRPInput*`
- `.agents/skills/igrp-design-system/references/data-table.md` — `IGRPDataTable`, `createIGRPColumnHelper`, row actions
- `.agents/skills/igrp-design-system/references/charts.md` — `IGRPAreaChart` / `IGRPVerticalBarChart` / `IGRPLineChart` etc.

## Hard rules

- **All UI from `@igrp/igrp-framework-react-design-system`.** No raw shadcn, MUI, Mantine, Chakra, Ant Design, etc.
- **`'use client'`** on every file that imports from the design system. The package is wrapped in a client boundary.
- **Forms are always `IGRPForm` + Zod.** Never raw `<form>` or direct `react-hook-form`. `IGRPInput*` components auto-wire to the form via context using their `name` prop.
- **Semantic tokens only**: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-input`, `bg-primary`, `bg-destructive`, etc. Never raw palette (`bg-blue-500`, `text-red-600`).
- **No manual `dark:` overrides** in app code — tokens handle dark mode.
- **`cn()`** from the design system for class merging (not `clsx` or `classnames` directly).
- **`size-N`** when width equals height (`size-10`, not `w-10 h-10`).
- **`flex gap-N`** for spacing, not `space-x-N` / `space-y-N`.
- **Import tokens only**, never the removed `/styles` bundle: `@import "@igrp/igrp-framework-react-design-system/tokens";`

## Component cheat sheet

| You want… | Use |
|---|---|
| Text input bound to a form | `IGRPInputText name="…"` inside `IGRPForm` |
| Button | `IGRPButton` — has `loading`, `loadingText`, `iconName`, `iconPlacement`, `asChild` |
| Modal | `IGRPModalDialog` + `IGRPModalDialogContent` (sizes: `sm`/`md`/`lg`/`xl`/`full`) |
| Confirm prompt | `IGRPAlertDialog` |
| Table | `IGRPDataTable` with `createIGRPColumnHelper<TRow>()`; row actions via the `actions` prop |
| Chart | `IGRPAreaChart` / `IGRPLineChart` / etc.; colors from `IGRP_CHART_COLORS` |
| Card | `IGRPCard` + separate exports `IGRPCardHeader` / `IGRPCardTitle` / `IGRPCardDescription` / `IGRPCardContent` / `IGRPCardFooter` (NOT dot notation) |
| Page header | `IGRPPageHeader` |
| Class merge | `cn(...)` from the design system root |

For anything more, read `.agents/skills/igrp-design-system/SKILL.md` and the relevant reference file.

## Permissions — there is NO default-deny

A page with no permission check is fully open and deep-linkable; hiding a menu item is navigation UX, not enforcement. For every page you suggest:

- If it needs a permission, gate it on the **first line** of the server component: `await igrpAssertAuthorize("<perm>")` from `@igrp/framework-next` (denied → 403).
- If it does not, say so in a one-line comment so the next reader knows it was a decision.
- In a **server action** use `igrpAuthorize(name)` (boolean) and return `{ ok: false, code: "forbidden" }` — an action has no 403 boundary. Gate the action whenever it mutates: a hidden or disabled button is cosmetic.
- Client-side, wrap with `<IGRPAuthorization permission="…">` or read `usePermissions().isAllowed(…)` from `@igrp/framework-next-ui`. Never add a `permission` prop to a design-system component.

Full guide: `docs/PERMISSIONS.md`. Same rule in `AGENTS.md`.
