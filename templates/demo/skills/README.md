# IGRP Design System Skills

Agent skill for building UI with `@igrp/igrp-framework-react-design-system`.

## Structure

```skills/
├── igrp-design-system/          <- single skill: entry point for all UI work
│   ├── SKILL.md                 <- master: component table, patterns, rules, links
│   ├── evals/                   <- eval prompts per component area
│   │   ├── button.json
│   │   ├── form.json
│   │   └── ... (one per area)
│   ├── rules/                   <- global rules (apply to all components)
│   │   ├── forms.md
│   │   ├── styling.md
│   │   └── composition.md
│   ├── references/              <- package-level docs
│   │   ├── overview.md          <- types, utilities, deprecated components
│   │   └── theming.md           <- CSS setup, tokens, dark mode, theme variants
│   └── components/              <- per-area deep API docs (loaded on demand)
│       ├── button/
│       │   └── button.md
│       ├── calendar-datepicker/
│       │   ├── calendar.md
│       │   ├── date-picker.md
│       │   └── time.md
│       ├── card/
│       │   ├── card.md
│       │   └── card-details.md
│       ├── charts/
│       │   ├── area-line-bar.md
│       │   ├── pie-radar-radial.md
│       │   └── types.md
│       ├── custom/
│       │   ├── stats-card.md
│       │   ├── stats-card-top-border.md
│       │   ├── status-banner.md
│       │   └── user-avatar.md
│       ├── datatable/
│       │   ├── datatable.md
│       │   ├── cells.md
│       │   ├── filters.md
│       │   ├── pagination.md
│       │   └── row-actions.md
│       ├── feedback/
│       │   ├── alert.md
│       │   ├── badge.md
│       │   ├── notification.md
│       │   └── toaster.md
│       ├── form/
│       │   ├── form.md
│       │   ├── form-field.md
│       │   ├── form-list.md
│       │   └── standalone-list.md
│       ├── inputs/
│       │   ├── input-text.md
│       │   ├── select.md
│       │   ├── checkbox.md
│       │   ├── combobox.md
│       │   ├── date-picker.md
│       │   ├── number.md
│       │   └── textarea.md
│       ├── layout/
│       │   ├── container.md
│       │   ├── page-header.md
│       │   ├── page-footer.md
│       │   └── sidebar.md
│       ├── modal/
│       │   ├── modal-dialog.md
│       │   └── alert-dialog.md
│       ├── navigation/
│       │   ├── menu-navigation.md
│       │   ├── dropdown-menu.md
│       │   └── tabs.md
│       └── ui/
│           └── ui-overview.md
│
├── scripts/
│   └── setup-cursor-skills.ps1  <- links skill into all agent dirs (run once)
├── CRUD_EXAMPLE.md              <- step-by-step CRUD guide
└── README.md                    <- this file
```

## How it works

Agents discover `igrp-design-system/` from their skills directory and load `SKILL.md` as the entry point. From there they follow links into `components/` on demand — only reading the specific area they need for the task at hand (Option B: load on demand).

| Agent reads... | From... |
| ---------------- | --------- |
| `SKILL.md` | Auto-discovered via skills directory |
| `components/datatable/*.md` | Followed as links from `SKILL.md` when building a table |
| `rules/forms.md` | Followed when writing a form |
| `references/theming.md` | Followed when setting up CSS or theming |

## Setup (run once after cloning)

```powershell
# From repo root
.\templates\demo\skills\scripts\setup-cursor-skills.ps1
```

| Agent | Discovery path |
| ------- | --------------- |
| Cursor | `.cursor/skills/igrp-design-system/` |
| Claude Code | `templates/demo/.claude/skills/igrp-design-system/` |
| Trae / OpenHands | `templates/demo/.agents/skills/igrp-design-system/` |
| GitHub Copilot | `.github/copilot-instructions.md` (inline reference) |

## Quick Start: CRUD Example

See **[CRUD_EXAMPLE.md](./CRUD_EXAMPLE.md)** for a step-by-step guide to building a full CRUD.
