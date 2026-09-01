# `.agents/` — shared AI agent context

Single source of truth for the instructions every AI coding agent working in
this template should follow. Tool-specific files exist only because each tool
auto-discovers its own path; they are **thin bridges** that point here.

```
.agents/
  rules/
    ui.md                       ← design-system + UI hard rules  (canonical)
    permissions.md              ← permission gating rules        (canonical)
  skills/
    igrp-design-system/         ← full component reference (SKILL.md + references/)
```

## Bridges — do not put rule content in these

| File | Read by | Contains |
|---|---|---|
| `AGENTS.md` | Codex, Amp, Jules, generic agents | pointers + project shape |
| `.cursor/rules/igrp-design-system.mdc` | Cursor (glob-scoped) | pointers via `@`-refs |
| `.trae/rules/project_rules.md` | Trae | pointers via `@`-refs |
| `.github/copilot-instructions.md` | GitHub Copilot | **generated** — see below |
| `.claude/skills/igrp-design-system/SKILL.md` | Claude Code | pointer to the skill |
| `CLAUDE.md` | Claude Code (monorepo only, not shipped) | pointers + template internals |

Copilot is the exception: it ingests `.github/copilot-instructions.md` as
literal text and will not open a referenced file. That file is therefore
**generated** by concatenating `rules/*.md`. Never hand-edit it — edit the
canonical rule file and regenerate:

## Where the skill comes from

`skills/igrp-design-system/` is **not committed** in the IGRP monorepo. It is
injected at packaging time by `create-template/create-zip-template.ps1` from
`plugins/igrp/skills/design-system/`, so a scaffolded app has it while the
monorepo keeps one copy. If you are reading this inside the monorepo and the
directory is missing, that is why — the canonical content is at
`<monorepo>/plugins/igrp/skills/design-system/`.
