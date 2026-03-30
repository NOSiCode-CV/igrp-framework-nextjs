# IGRP Design System Skills

Agent skills for building UI with the IGRP Design System (`@igrp/igrp-framework-react-design-system`).

## Quick Start: CRUD Example

See **[CRUD_EXAMPLE.md](./CRUD_EXAMPLE.md)** for a step-by-step guide on using these skills to build a full CRUD. Step 1 covers how to start with all skills agents.

## Skills Index

| Skill | When to Use |
|-------|-------------|
| [igrp-form](./igrp-form/) | Forms, validation, form fields |
| [igrp-inputs](./igrp-inputs/) | Text inputs, select, checkbox, textarea, etc. |
| [igrp-datatable](./igrp-datatable/) | Data tables, pagination, filtering, sorting |
| [igrp-button](./igrp-button/) | Buttons, variants, loading states |
| [igrp-card](./igrp-card/) | Cards, card details |
| [igrp-charts](./igrp-charts/) | Area, line, bar, pie, radar, radial charts |
| [igrp-modal](./igrp-modal/) | Modal dialogs, alert dialogs |
| [igrp-calendar-datepicker](./igrp-calendar-datepicker/) | Calendars, date pickers, time inputs |
| [igrp-layout](./igrp-layout/) | Container, page header/footer, sidebar |
| [igrp-navigation](./igrp-navigation/) | Menu navigation, dropdown menus, tabs |
| [igrp-feedback](./igrp-feedback/) | Alerts, notifications, badges, toasts |
| [igrp-custom](./igrp-custom/) | Stats cards, status banner, user avatar |
| [igrp-primitives](./igrp-primitives/) | Primitives for custom composition |

## Usage

### Cursor (project-level discovery)

Cursor discovers skills from `.cursor/skills/` or `.agents/skills/` at the repo root. Run the setup script to link these skills:

```powershell
# From repo root
.\templates\demo\skills\scripts\setup-cursor-skills.ps1
```

This creates junctions in `.cursor/skills/` pointing to each skill here. Cursor will then auto-discover them. You can also invoke skills manually with `/igrp-form`, `/igrp-datatable`, etc.

### Anthropic / skills.sh (package for distribution)

To create `.skill` files for installation via `npx skills add`:

```powershell
# From repo root (no dependencies)
.\templates\demo\skills\scripts\package-skill-standalone.ps1
```

Output: `templates/demo/skills/dist/*.skill`. Install with:

```bash
npx skills add ./templates/demo/skills/dist/igrp-form.skill
```

Alternative: `package-all-skills.ps1` uses skill-creator's package_skill.py (requires PyYAML; may have encoding issues on Windows).

## Structure

Each skill contains:

- `SKILL.md` – Main instructions and trigger description
- `references/` – Per-component API docs (heavy depth)
- `evals/` – Test prompts for skill-creator workflow
