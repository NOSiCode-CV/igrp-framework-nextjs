# IGRP Template Migration Automation — Spec

## Overview

Consumer apps scaffolded from `templates/demo-legacy` (`@igrp/framework-next-template`) consume the IGRP framework via five published packages:

- `@igrp/framework-next-auth`
- `@igrp/framework-next-types`
- `@igrp/igrp-framework-react-design-system`
- `@igrp/framework-next-ui`
- `@igrp/framework-next`

Every framework bump (the pending `heavy-pants-sink` changeset lifts all five from `0.1.0-beta.114` → `0.1.0-beta.115`) can require matching source edits in the consumer app — new files, deleted files, `.env.example` additions, and `package.json` range bumps. Those edits are currently distributed as hand-authored markdown under `templates/demo-legacy/.igrpmigrations/` (six files, `01 → 06`, covering 2025-11-10 → 2026-04-23) and executed by hand.

This spec defines **`@igrp/template-migrator`**, a single CLI that is published to the internal Sonatype registry and ships every migration known to date. Consumer apps install it once, run `pnpm dlx @igrp/template-migrator apply`, and land on the matching framework version — deterministically, idempotently, with a full audit trail.

Scope is **`templates/demo-legacy` only**. `templates/demo` is out of scope for this iteration.

## Goals

1. Ship a **single installable CLI** (`@igrp/template-migrator`) on the internal Sonatype registry that applies every known migration to a consumer app with one command.
2. Make the **first release cumulative**: it bundles all six existing migrations (`01..06`) so any app started from `demo-legacy` at any prior beta can catch up in a single run.
3. Preserve the existing `.igrpmigrations/*.md` authoring ergonomics — prose stays human-readable; the package build step extracts the executable payload.
4. Track applied migrations per app in `.igrpmigrations.lock.json` so upgrades are resumable, idempotent, and auditable.
5. Let future framework releases ship new migrations by bumping a single package — no runner/data split, no per-release npm artefact.

## Non-Goals

- Migrating `templates/demo` (the new-gen template). Out of scope.
- Rewriting framework package source. The migrator edits **consumer** repos only.
- Running `pnpm install` or `pnpm build:framework` automatically. Those remain explicit follow-ups so Sonatype credentials + `install:deps` flow are not bypassed.
- AST codemods. The six existing migrations are file-level edits, env additions, and dependency bumps — a declarative step list covers all of them.
- Publishing to the public npm registry. Target stays the NOSi Sonatype registry with `--tag latest`, per repo hard rules.

## Users & Use Cases

- **Template maintainer** cuts beta.115: authors `07.MIGRATIONS-*.md` under `templates/demo-legacy/.igrpmigrations/`, adds a changeset to `@igrp/template-migrator`, then publishes the new CLI version as part of the release workflow.
- **Consumer app engineer** pinned at beta.84 runs `pnpm dlx @igrp/template-migrator@latest apply` and their app lands on beta.115 with every migration from `01 → 07` applied in order, skipping any already recorded in the lock file.
- **Claude Code agent** invokes the same CLI on behalf of the user.
- **CI job** runs `pnpm dlx @igrp/template-migrator check` on PRs to block merges that skipped a required migration.

## Functional Requirements

### A. Single-package design

One workspace package at `packages/template-migrator/` publishes as `@igrp/template-migrator`. It contains three things:

1. **CLI + library** — the runner logic that reads the manifest, writes the lock file, renders diffs, and applies steps.
2. **Bundled manifest + payloads** — the executable representation of every migration under `templates/demo-legacy/.igrpmigrations/` at build time.
3. **`bin: { "igrp-migrate": "..." }`** — the executable entry point installed into `node_modules/.bin`.

Publishing cadence: bumped on every framework release that adds a migration. Version numbers track the framework (`0.1.0-beta.115` CLI bundles migrations through migration `07`, which targets framework beta.115).

The CLI is **cumulative**: installing any version brings every migration authored up to that point, regardless of which intermediate framework release the consumer was on. The lock file is the source of truth for what has already been applied.

### B. Authoring (what the template maintainer writes)

Existing markdown stays under `templates/demo-legacy/.igrpmigrations/NN.MIGRATIONS-DDMMYYYY.md`. A YAML front-matter header is added at the top of each file:

```yaml
---
id: 05-auth-bypass-unification
date: 2026-04-20
targetFrameworkVersion: 0.1.0-beta.113
requires: ["04-access-sync"]
steps:
  - type: file.create
    path: src/lib/auth.ts
    from: payload/05/lib/auth.ts
  - type: file.delete
    path: src/lib/auth-helpers.ts
  - type: file.delete
    path: src/lib/auth-options.ts
  - type: file.write
    path: src/middleware.ts
    mode: replace
    from: payload/05/middleware.ts
  - type: env.add
    file: .env.example
    keys:
      AUTH_PROVIDER: { default: "keycloak", doc: "keycloak | autentika | none" }
      AUTENTIKA_CLIENT_ID: { required_if: "AUTH_PROVIDER=autentika" }
  - type: deps.bump
    manifest: package.json
    ranges:
      "@igrp/framework-next": "0.1.0-beta.113"
      "@igrp/framework-next-auth": "0.1.0-beta.113"
      "@igrp/framework-next-types": "0.1.0-beta.113"
      "@igrp/framework-next-ui": "0.1.0-beta.113"
      "@igrp/igrp-framework-react-design-system": "0.1.0-beta.113"
      next: "^15.5.15"
---

# (existing human-readable guide body follows unchanged)
```

Payload files live beside the guides under `templates/demo-legacy/.igrpmigrations/payload/NN/**` and are the actual sources/patches the steps copy into the consumer app.

### C. Bundling (how `@igrp/template-migrator` is built)

The package's own `build` script runs in two passes:

1. **Pack migrations.** A prebuild step walks `templates/demo-legacy/.igrpmigrations/`, validates every frontmatter header, and emits:
   - `dist/manifest.json` — the ordered list of every migration (`01 → N`).
   - `dist/payload/NN/**` — every payload file referenced by a step, copied verbatim.
2. **Compile CLI.** `tsup` builds the runner + `bin.js` shim into `dist/`.

At publish time, `pnpm publish` ships `dist/` to Sonatype. The manifest is loaded from `dist/manifest.json` at runtime; payloads are resolved relative to the package install location.

### D. First release — all six migrations

The first published version of `@igrp/template-migrator` bundles every migration authored to date:

| # | Id (derived from filename) | Target framework version | Source |
| --- | --- | --- | --- |
| 01 | `01-preview-mode-not-found` | ~beta.80 | `01.MIGRATIONS-10112025.md` |
| 02 | `02-access-sync-config-refactor` | `0.1.0-beta.84` | `02.MIGRATIONS-05122025.md` |
| 03 | `03-tailwind-v4-tokens` | n/a (styling only) | `03.MIGRATIONS-04022026.md` |
| 04 | `04-multi-auth-provider` | `0.1.0-beta.113` | `04.MIGRATIONS-20042026.md` |
| 05 | `05-edge-safe-auth-bypass` | `0.1.0-beta.114` | `05.MIGRATIONS-23042026.md` |
| 06 | `06-error-handling-overhaul` | `0.1.0-beta.115` | `06.MIGRATIONS-23042026.md` |

The CLI's version on first publish matches the highest `targetFrameworkVersion` in the manifest — `0.1.0-beta.115` — so consumers upgrading to the beta.115 framework install `@igrp/template-migrator@0.1.0-beta.115`.

### E. CLI surface

All commands are invoked via `pnpm dlx @igrp/template-migrator <cmd>` (or via a locally installed `igrp-migrate` binary).

- `igrp-migrate status` — applied vs pending for the current app, read from `.igrpmigrations.lock.json` at app root.
- `igrp-migrate plan [--to <id>]` — print ordered pending steps with full diffs; no writes.
- `igrp-migrate apply [--to <id>] [--yes]` — execute pending steps in order; prompt before each unless `--yes`; commit lock progress after each successful migration; abort on first failure. Prints the mandatory follow-up (`pnpm install`) on completion.
- `igrp-migrate rollback <id>` — revert a single applied migration using the `undo` payload stored in the lock file.
- `igrp-migrate check` — CI mode: exit non-zero if the installed CLI's manifest is ahead of the lock file, or if the working tree is dirty.
- `igrp-migrate list` — print every migration the installed CLI version knows about (applied + pending + future).

### F. Lock file (`.igrpmigrations.lock.json` at app root)

```ts
interface LockFile {
  version: 1;
  template: "demo-legacy";
  applied: Array<{
    id: string;                    // "05-edge-safe-auth-bypass"
    appliedAt: string;             // ISO timestamp
    cliVersion: string;            // "0.1.0-beta.115"
    manifestHash: string;          // sha256 of the migration entry at apply time
    undo: MigrationStep[];         // reverse ops, materialised at apply time
    fileHashes: Record<string, string>;  // pre-apply hashes for verification
  }>;
}
```

### G. Step types (typed allow-list)

```ts
type MigrationStep =
  | { type: "file.create"; path: string; from: string }
  | { type: "file.write"; path: string; mode: "replace" | "patch"; from?: string; patch?: string }
  | { type: "file.delete"; path: string }
  | { type: "env.add"; file: string; keys: Record<string, EnvKeySpec> }
  | { type: "deps.bump"; manifest: string; ranges: Record<string, string> };
```

Unknown step types fail closed. No step ever executes shell commands or JS from the payload — the manifest is data-only.

### H. Dependency bumps

`deps.bump` patches ranges in `package.json` but never runs `pnpm install`. The CLI prints the follow-up command at the end of `apply`:

```
Next steps:
  pnpm install
  pnpm build:framework   # only if inside the monorepo; consumers skip this
```

This preserves the `install:deps` / Sonatype credential flow required by the repo's hard rules.

### I. `.env.example` merges

`env.add` only touches `.env.example` — never the user's local `.env`. Existing keys and comments are preserved; new keys are appended with their doc block.

## Data Model

```ts
// bundled into @igrp/template-migrator/dist/manifest.json
interface Manifest {
  version: 1;
  cliVersion: string;              // matches package.json "version"
  template: "demo-legacy";
  migrations: MigrationEntry[];    // ordered, cumulative 01..N
}

interface MigrationEntry {
  id: string;
  date: string;
  requires: string[];
  targetFrameworkVersion: string | null;  // null for styling-only migrations
  steps: MigrationStep[];
  guideHref: string;               // relative path to the .md for display
  contentHash: string;             // sha256 over steps + payload contents
}
```

## API / Interface

- **Package:** `@igrp/template-migrator` (single publishable package).
- **Binary:** `igrp-migrate` (via the package's `bin` field).
- **Library entry:** `import { loadManifest, plan, apply, rollback, status, check } from "@igrp/template-migrator";` — used by Claude Code or other tooling that wants to drive the migrator programmatically.
- **Workspace additions:**
  - `packages/template-migrator/` — the new publishable package.
  - `packages/template-migrator/scripts/pack.ts` — prebuild step that reads `templates/demo-legacy/.igrpmigrations/` and emits `dist/manifest.json` + `dist/payload/**`.
  - `.changeset/config.json` — add `@igrp/template-migrator` to the release set; **not** ignored (unlike the templates themselves).

## Constraints

- **Scope:** `templates/demo-legacy` only. The runner hard-codes `template: "demo-legacy"` in the manifest and refuses to run against apps whose `package.json` name does not resolve to `@igrp/framework-next-template` (with an override flag for edge cases).
- **Node ≥ 22**, pnpm only. Runner has zero native deps; parses YAML via `yaml`, renders diffs via `diff`.
- **No network calls** from the runner. Manifest and payloads ship inside the installed package.
- **Registry:** publish only to `https://sonatype.nosi.cv/repository/igrp/` with `--tag latest`.
- **Security:** declarative steps only; payload can contain source files but never executable scripts the runner invokes.
- **Performance:** `status` and `plan` under 500 ms for the full cumulative backlog.
- **Lint toolchain parity:** runner never invokes Biome / ESLint itself. Consumers run their own `pnpm format` / `pnpm lint` after `apply`.

## Acceptance Criteria

- [ ] `pnpm --filter @igrp/template-migrator build` produces a `dist/` containing the compiled CLI, `manifest.json` with six entries (`01..06`), and every payload file referenced by any step.
- [ ] `pnpm --filter @igrp/template-migrator publish` ships the package to Sonatype under the beta.115 version tag.
- [ ] In a fresh checkout of a `demo-legacy`-based app at beta.84, `pnpm dlx @igrp/template-migrator@0.1.0-beta.115 apply --yes` produces a tree identical (file-for-file, modulo generated artefacts) to one upgraded by hand following `01 → 06`, and the final `package.json` pins framework packages at `0.1.0-beta.115`.
- [ ] Re-running `apply` after a successful run is a no-op; lock file is unchanged.
- [ ] Interrupting `apply` mid-step leaves the lock file consistent; the next `apply` resumes from the first un-applied migration.
- [ ] `rollback <id>` restores pre-migration file state exactly, verified via `fileHashes`.
- [ ] `igrp-migrate check` fails in CI when the installed CLI version's manifest is ahead of the lock file.
- [ ] Cutting beta.116 requires: (a) new `07.MIGRATIONS-*.md` with frontmatter, (b) a changeset bumping `@igrp/template-migrator`, (c) `pnpm publish` — no structural changes to the package.
- [ ] Existing `templates/demo-legacy/.igrpmigrations/01..06.MIGRATIONS-*.md` files are updated in place with valid frontmatter; their prose bodies remain unchanged.
- [ ] Code blocks inline in the existing six guides are either (a) extracted into `payload/NN/**` files and referenced via `from:`, or (b) declared inline under the frontmatter using a fenced `payload:` block — whichever the pack step chooses to support.

## Summary — Better Automation Approach

The existing six migration guides share a narrow, finite change surface: create / edit / delete files, append env keys, bump dependency ranges. The leverage is to (1) keep the prose authoring workflow intact, (2) add a small machine-readable header that encodes those operations declaratively, and (3) ship the whole set as a single installable CLI (`@igrp/template-migrator`) so consumer apps upgrade via `pnpm dlx @igrp/template-migrator apply` instead of re-reading markdown.

Wins over the status quo:

1. **Deterministic upgrades** — same input, same output across engineers and across CI.
2. **One install, any starting version** — the CLI is cumulative; the lock file tells it what to skip.
3. **Resumable + auditable** — the lock file makes multi-version jumps safe to interrupt and replay.
4. **One package, one cadence** — no runner/data split to reason about; each framework bump with a migration means one `@igrp/template-migrator` release.
5. **Authoring stays cheap** — maintainers keep writing the detailed markdown guides they already write; only the frontmatter is new.
6. **Claude-friendly** — a single CLI shape (`plan → apply → check`) is the integration point for agents.

## Phased Rollout

1. **Phase 0 — Backfill frontmatter (all six).** Add YAML frontmatter headers to every existing `01..06.MIGRATIONS-*.md`. Extract inline code blocks into `templates/demo-legacy/.igrpmigrations/payload/NN/**`. Guides remain usable by hand throughout this phase.
2. **Phase 1 — Package skeleton + pack step.** Scaffold `packages/template-migrator/`. Implement the prebuild pack script that emits `dist/manifest.json` + `dist/payload/**` from the six backfilled guides. Land `status`, `plan`, and `list` commands (read-only).
3. **Phase 2 — Apply + lock file.** `apply` with diffs, prompts, resumability, and `.igrpmigrations.lock.json`. Exercise end-to-end against a fresh `demo-legacy` clone at beta.84 and verify the tree ends up matching a manual upgrade to beta.115.
4. **Phase 3 — First publish.** Cut `@igrp/template-migrator@0.1.0-beta.115` alongside the existing `heavy-pants-sink` framework bump. Add a consumer-upgrade section to the repo README and to `templates/demo-legacy/README.md`.
5. **Phase 4 — `rollback` + `check`.** Ship reverse operations and CI mode. Add a GitHub Action workflow consumers can copy into their own repos to gate merges on migrations being up to date.

## Open Questions

- **Inline vs. extracted payloads.** Backfilling all six guides means either extracting every fenced code block into a file under `payload/NN/**` (cleanest for the pack step) or teaching the pack step to read tagged fenced blocks in place (less churn, more parser). Which is preferred for Phase 0?
- **CLI version scheme.** Is `0.1.0-beta.115` (track the framework) the right versioning, or should `@igrp/template-migrator` carry its own semver independent from the framework? Tracking the framework is simpler; independent semver avoids forced bumps for runner-only fixes.
- **`@igrp/platform-access-management-client-ts` drift.** The template currently pins this at `0.2.0-beta.2` — it's outside the five IGRP framework packages but sometimes ships alongside them. Should `deps.bump` steps cover it too, or does it stay manually managed?
- **Auth verification.** `pnpm dlx` against Sonatype requires `.npmrc` credentials. Do we assume the consumer already has the internal registry configured, or does the CLI need to surface a clearer error when auth fails?
- **`templates/demo`.** Out of scope for now, but the manifest carries `template: "demo-legacy"` so a future `@igrp/template-migrator` can expand. Confirm when `demo` should get its own migration series and whether it ships from the same CLI or a sibling package.
