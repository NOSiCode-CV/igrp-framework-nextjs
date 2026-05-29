# `igrp` plugin

Umbrella Claude Code plugin for the **IGRP framework**. Ships team-authored skills that help developers build IGRP applications. Skills are namespaced as `/igrp:<skill>`.

## Skills

- **`/igrp:design-system`** — Authoritative usage reference for `@igrp/igrp-framework-react-design-system`. Three-layer picker (Horizon / Primitives / Custom), source-verified prop shapes for forms, data tables, charts, plus the repo-wide UI hard rules.

  Deep references under `skills/design-system/references/` (loaded on demand):

  | File | Covers |
  | --- | --- |
  | `forms.md` | `IGRPForm` + Zod, autowired `IGRPInput*`, `IGRPFormField`, `IGRPFormList` |
  | `data-table.md` | `IGRPDataTable`, `createIGRPColumnHelper`, the `actions` prop with typed row actions, cell renderers, filters, server-side pagination |
  | `charts.md` | `IGRPAreaChart` / `IGRPVerticalBarChart` / `IGRPLineChart` / … with the correct `categoryKey` + `bars: IGRPBarConfig[]` + `valueFormatter: (n) => string` API |
  | `horizon.md` | Shared `IGRPInputProps`, naming conventions, when Horizon is wrong |
  | `primitives.md` | When to drop down, CVA variants, shadcn drift policy |
  | `utilities.md` | `cn()`, `IGRPColors`, hooks |
  | `custom.md` | Domain pieces (`IGRPUserAvatar`, `IGRPStatsCard*`, `IGRPStatusBanner`) |

Future skills (e.g. `framework-next`, `next-auth`) will live under the same plugin in `skills/<name>/`.

## Install

```sh
# Inside Claude Code (one-time per developer):
/plugin marketplace add http://git.nosi.cv/igrp-3_0/igrp-framework-frontend/igrp-framework-nextjs
/plugin install igrp@nosi
```

Or scripted (non-interactive):

```sh
claude plugin marketplace add http://git.nosi.cv/igrp-3_0/igrp-framework-frontend/igrp-framework-nextjs
claude plugin install igrp@nosi
```

The design-system skill is then auto-loaded whenever you work on UI in an IGRP app, and is available explicitly as `/igrp:design-system` from the slash menu.

## Update

```sh
/plugin marketplace update nosi
```

This plugin does not declare an explicit `version` in `plugin.json`, so each commit to the marketplace repo counts as a new version — `/plugin marketplace update` always pulls the latest content.

## Auto-install for your project

To make the marketplace available to anyone who trusts your project folder, add it to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "nosi": {
      "source": {
        "source": "url",
        "url": "http://git.nosi.cv/igrp-3_0/igrp-framework-frontend/igrp-framework-nextjs.git"
      }
    }
  },
  "enabledPlugins": {
    "igrp@nosi": true
  }
}
```

## Private repository auth

If `git.nosi.cv` requires auth for clones, ensure your local git credential helper (or SSH agent) is set up. For Claude Code's background auto-update path, also export a token in your shell:

```sh
# Gitea / GitLab-compatible:
export GITLAB_TOKEN=glpat_xxxxxxxxxxxx
```

See the Claude Code [private-repo plugin docs](https://code.claude.com/docs/en/plugin-marketplaces#private-repositories) for the full list of supported providers.

## Versioning

Since `version` is omitted from `plugin.json`, the **git commit SHA** is the version. Every commit to `plugins/igrp/` (or any of its files) is a new version that consumers receive on the next `/plugin marketplace update`.

If you ever want explicit semver pinning instead, add `"version": "1.0.0"` to `plugin.json` and bump it on each release. See the [version-resolution rules](https://code.claude.com/docs/en/plugin-marketplaces#version-resolution-and-release-channels) — once you set it, the value must change on every release or users won't see updates.

## Develop locally

To iterate on the plugin without going through the marketplace:

```sh
claude --plugin-dir ./plugins/igrp
```

That loads the plugin straight from disk. Run `/reload-plugins` after edits to pick up changes without restarting.

## Adding a new skill to this plugin

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`).
2. Optionally add `references/` for progressive-disclosure docs.
3. Validate: `claude plugin validate ./plugins/igrp`.
4. Commit. Users get it on their next `/plugin marketplace update nosi`.

The skill will be invokable as `/igrp:<skill-name>`.
