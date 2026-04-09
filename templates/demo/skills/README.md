# IGRP Design System Skills

Agent skill for building UI with `@igrp/igrp-framework-react-design-system`.

## Structure

```skills/
├── igrp-design-system/          <- single skill: entry point for all UI work
│   ├── SKILL.md                 <- master: component table, patterns, rules, links
│   ├── evals/                   <- eval prompts per component area
│   ├── rules/                   <- forms.md, styling.md, composition.md
│   ├── references/              <- overview.md, theming.md
│   └── components/              <- per-area deep API docs (loaded on demand)
│       ├── button/
│       ├── calendar-datepicker/
│       ├── card/
│       ├── charts/
│       ├── command/
│       ├── custom/
│       ├── datatable/
│       ├── feedback/
│       ├── form/
│       ├── inputs/
│       ├── layout/
│       ├── modal/
│       ├── navigation/
│       └── ui/
│
├── scripts/
│   └── setup-cursor-skills.ps1  <- creates Cursor junction (run once)
├── CRUD_EXAMPLE.md              <- step-by-step CRUD guide
└── README.md                    <- this file
```

## How each agent reads the skill

Each agent config file **points directly at `skills/igrp-design-system/SKILL.md`** — no extra copies or sync needed. The skill file links out to `components/` on demand.

| Agent | How it reads `SKILL.md` |
|-------|------------------------|
| **Cursor** | `.cursor/rules/igrp-design-system.mdc` (`alwaysApply`) points at `skills/igrp-design-system/SKILL.md` |
| **Claude Code** | `CLAUDE.md` uses `@./skills/igrp-design-system/SKILL.md` to include it at startup |
| **Trae / OpenHands** | `AGENTS.md` instructs the agent to read `./skills/igrp-design-system/SKILL.md` |
| **GitHub Copilot** | `.github/copilot-instructions.md` references `skills/igrp-design-system/SKILL.md` |

The `skills/` folder is the **single source of truth** — no duplication, no syncing.

## Setup (run once after cloning — Cursor only)

Cursor also discovers skills via `.cursor/skills/`. Run this once to create the junction:

```powershell
# From anywhere inside the repo
.\templates\demo\skills\scripts\setup-cursor-skills.ps1
```

All other agents (Claude, Trae, Copilot) read `skills/` directly via their config files — no setup required.

## Quick Start: CRUD Example

See **[CRUD_EXAMPLE.md](./CRUD_EXAMPLE.md)** for a step-by-step guide to building a full CRUD.
