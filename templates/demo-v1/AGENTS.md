# Agent instructions — IGRP Next.js template

This project is built on the IGRP framework (`@igrp/framework-next`,
`@igrp/framework-next-ui`, `@igrp/framework-next-auth`,
`@igrp/igrp-framework-react-design-system`).

## Required reading

All agent rules live in one place — `.agents/`. Read these before touching code:

- **`.agents/rules/ui.md`** — design-system hard rules, three-layer picker,
  component cheat sheet. Required before any work in `src/**/*.{ts,tsx}`.
- **`.agents/rules/permissions.md`** — permission gating. There is **no
  default-deny**: an ungated page is fully open and deep-linkable. Required
  before adding any page or server action.
- **`.agents/skills/igrp-design-system/SKILL.md`** — the full component
  reference and source-verified prop shapes. Required before writing any form,
  table, chart, modal, or design-system import. Deep references for the heavy
  families are under `.agents/skills/igrp-design-system/references/` — load
  only the one relevant to your task.

@.agents/rules/ui.md
@.agents/rules/permissions.md

`.agents/README.md` explains the layout and how the tool-specific bridge files
(`.cursor/`, `.trae/`, `.github/`) relate to it. Put rule content in
`.agents/rules/`, never in a bridge.

## Project shape

- `src/app/` — Next.js App Router routes.
- `src/app/(igrp)/layout.tsx` — runs auth checks, loads session, wraps the route
  group in `IGRPLayout`.
- `src/middleware.ts` — NextAuth session validation, honors
  `IGRP_PREVIEW_MODE` / `AUTH_PROVIDER=none`.
- `src/igrp.template.config.ts` — assembles the IGRP runtime config via
  `igrpBuildConfig`.
- `src/actions/igrp/` — server actions; `src/app/api/auth/*` holds NextAuth
  routes.

For Claude-Code-specific guidance see `CLAUDE.md`.
