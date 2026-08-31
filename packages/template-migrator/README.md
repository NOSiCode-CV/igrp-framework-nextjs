# @igrp/template-migrator

CLI that automates IGRP template upgrades. Bundles all migration guides for `templates/demo-v1` into a single executable package — consumers run it with `pnpm dlx` to bring their app up to the latest framework version without manual file edits.

---

## Package structure

```
packages/template-migrator/
├── scripts/
│   ├── pack.ts              # Prebuild: reads migration guides → emits dist/manifest.json + dist/payload/
│   ├── check-drift.ts       # Release gate: payloads/deps/new files/lock vs. the live template
│   ├── drift-orphans.ts     # New-file (orphan) detection logic + exemption lists
│   ├── template-lock.ts     # Shared lock reconciliation (diff + rebuild), used by both scripts below
│   ├── sync-template-lock.ts # Regenerates the template's shipped .igrp-migrations-lock.json
│   └── payload-copy.ts      # Payload copy with LF normalisation + binary detection
├── src/
│   ├── cli.ts               # Binary entry point (bin: igrp-migrate)
│   ├── index.ts             # Public API re-exports (for programmatic use)
│   ├── types.ts             # Shared types: MigrationStep, Manifest, LockFile, …
│   ├── manifest.ts          # Loads dist/manifest.json at runtime
│   ├── apply.ts             # Executes a single MigrationStep against an app root
│   ├── lock.ts              # Reads/writes .igrp-migrations-lock.json (consumer project root)
│   ├── journal.ts           # Crash-durable record of an in-flight migration
│   ├── unwind.ts            # Reverses executed steps (shared: error path + crash recovery)
│   ├── hash.ts              # File hashing helpers
│   └── commands/
│       ├── status.ts        # igrp-migrate status
│       ├── plan.ts          # igrp-migrate plan [--to <id>]
│       ├── apply.ts         # igrp-migrate apply [--to <id>] [--yes]
│       ├── list.ts          # igrp-migrate list
│       ├── rollback.ts      # igrp-migrate rollback <id>
│       └── check.ts         # igrp-migrate check  (CI gate)
```

The **source of truth for migrations lives in this package at `migrations/demo-v1/`**. `scripts/pack.ts` reads those files at build time and embeds everything into `dist/`.

---

## How the build works

```
pnpm --filter @igrp/template-migrator build
```

Three sequential steps (wired as `prebuild → build:js → build:types`):

### 1. `prebuild` — `scripts/pack.ts`

Reads every `NN.MIGRATIONS-*.md` file in `migrations/demo-v1/`, parses the YAML frontmatter, then:

- **Copies payload files** from `migrations/demo-v1/payload/NN/` → `dist/payload/NN/` (strips the `payload/` prefix from the `from` field so the dist layout is `dist/payload/NN/file`, not `dist/payload/payload/NN/file`).
- **Normalises text payloads to LF** on the way into `dist/` (see `scripts/payload-copy.ts`). Payloads are usually captured on Windows and carry CRLF, while the live template is LF — without this, an upgraded app ends up with CRLF where a scaffolded app has LF, the template's own Biome run rewrites every migrated file, and `git diff` after an `apply` shows whole-file churn. Binary payloads (detected by a NUL byte in the leading bytes) are copied verbatim. The build reports how many files it normalised.
- **Emits `dist/manifest.json`** — a single JSON object with all migration metadata and steps.

Any `.md` guide without valid YAML frontmatter (between `---` fences) will throw and abort the build.

### 2. `build:js` — tsup

Bundles `src/cli.ts` and `src/index.ts` as ESM into `dist/cli.js` and `dist/index.js`. Source maps are included.

### 3. `build:types` — tsc

Emits `.d.ts` declaration files from `tsconfig.build.json` (no JS output, types only).

---

## Adding a new migration

1. **Write the prose guide** in `migrations/demo-v1/`:

   ```
   NN.MIGRATIONS-DDMMYYYY.md
   ```

   The filename must match `^\d+\.MIGRATIONS.*\.md$`. Use the next sequential number.

2. **Add YAML frontmatter** at the very top of the file:

   ```yaml
   ---
   id: NN-short-slug
   date: YYYY-MM-DD
   targetFrameworkVersion: 0.1.0-beta.XXX   # or null if not tied to a specific version
   requires: ["NN-1-previous-slug"]          # or [] if standalone
   steps:
     - type: file.write
       path: src/some/file.ts
       mode: replace
       from: payload/NN/some/file.ts
     - type: file.create
       path: src/new/file.tsx
       from: payload/NN/new/file.tsx
     - type: env.add
       file: .env.example
       keys:
         NEW_VAR:
           doc: "Description shown as a comment above the key"
           default: ""
           required_if: "SOME_OTHER_VAR=true"   # optional
     - type: deps.bump
       manifest: package.json
       ranges:
         "@igrp/framework-next": "0.1.0-beta.XXX"
   ---
   ```

3. **Create the payload files** in `migrations/demo-v1/payload/NN/` — the final state of each file after the migration is applied.

4. **Build and verify**:

   ```bash
   pnpm --filter @igrp/template-migrator build
   ```

   All N migrations should print `packed <id>`. Check `dist/manifest.json` to confirm the new entry is present.

5. **Sync the template's shipped lock** so freshly scaffolded apps don't see the new migration as pending:

   ```bash
   pnpm --filter @igrp/template-migrator sync:template-lock
   ```

   Commit the updated `templates/demo-v1/.igrp-migrations-lock.json`. Skipping this fails the drift gate at release.

6. **Confirm the gate is clean**:

   ```bash
   pnpm --filter @igrp/template-migrator check:drift
   ```

7. **Test locally** against a copy of `demo-v1`:

   ```bash
   # From the consumer app directory
   node path/to/packages/template-migrator/dist/cli.js status
   node path/to/packages/template-migrator/dist/cli.js plan
   node path/to/packages/template-migrator/dist/cli.js apply --yes
   ```

---

## Step types reference

| Type | Required fields | What it does |
|---|---|---|
| `file.create` | `path`, `from` | Copies payload file to `path`. Overwrites if the destination already exists — the distinction from `file.write` is intent (a file the migration introduces), not enforcement. That tolerance is deliberate: it keeps a catch-up migration re-applied over an already-current tree from aborting |
| `file.write` | `path`, `mode: "replace"`, `from` | Overwrites `path` with payload file |
| `file.delete` | `path` | Deletes `path` from the app |
| `env.add` | `file`, `keys` | Appends missing keys (with doc comments) to an `.env` file. Keys already present are left alone, and the undo lists only the keys this step actually appended. In practice migrations only ever target `.env.example` — a consumer's real `.env` holds secrets, is gitignored, and never ships in the zip, so `apply` prints a reminder to copy new keys across |
| `env.remove` | `file`, `keys` | Removes the listed keys from an `.env` file, capturing their values so the undo can restore them. Mainly generated as the inverse of `env.add`, but valid to author directly |
| `deps.bump` | `manifest`, `ranges` | Updates version ranges in `package.json` (deps or devDeps). A dep the app doesn't declare is **not added** — adding it could contradict a deliberate removal — but it is reported as a warning, since some bumps are load-bearing for the migration's own feature |

`from` values must be relative to `migrations/demo-v1/` (e.g. `payload/NN/src/file.ts`). The pack script strips the leading `payload/` when copying to `dist/payload/`; the runtime in `apply.ts` does the same strip when resolving the source.

---

## Drift gate (`check:drift`)

The `migrations/demo-v1/payload/` tree is a **hand-maintained copy** of `templates/demo-v1`. If you edit the template but forget to author a migration, the two silently diverge: apps scaffolded from the zip get the change, apps upgraded via this CLI never do.

`scripts/check-drift.ts` reconciles them on four axes — **file payloads**, **dependency pins**, **new files**, and the **shipped migration lock**. It collapses every migration into the final expected state per managed path and per bumped dependency, then compares against the live template:

```bash
pnpm --filter @igrp/template-migrator check:drift
```

It **fails** (exit 1) when:

- a managed file changed in the template but no migration re-captured it,
- a migration ships a file the template no longer has,
- a referenced payload file is missing on disk,
- a dependency a migration bumps has moved on in the template/workspace but no migration captured the new version (the template pins `@igrp/*` as `workspace:*`, so the comparison resolves each `workspace:*` to its current package version — what the zip would ship),
- a migration bumps a dependency the template doesn't declare,
- a **new template file** exists (tracked or untracked-but-not-gitignored) that no migration ships, is not exempt, and is not grandfathered in the baseline (see below),
- the template's shipped **`.igrp-migrations-lock.json`** doesn't record every migration as applied, records one that no longer exists, has a stale `manifestHash`, or lists entries out of migration order (see below).

It **warns** (exit 0) for `file.write` patch-mode paths (no full-file payload to diff), files a migration deletes that the template still has, `@igrp/*` template deps no migration ever pins, and baseline entries the template no longer has.

The gate runs automatically at the start of `release` (see below), so a forgotten migration can't be published.

### New-file check (baseline)

Every template file must be **migration-managed**, **exempt**, or listed in `migrations/demo-v1/template-baseline.json` (the grandfathered set that predates this check). Anything else is an *orphan*: scaffolded apps would get it, upgraded apps never would — so the gate fails.

Exempt paths (see `scripts/drift-orphans.ts`) are zip-excluded content (`create-template/`, `CHANGELOG.md`, `CLAUDE.md`, …) and docs/AI-tooling content that ships in the zip but isn't runtime code (`docs/`, `specs/`, `.github/`, `.cursor/`, `.trae/`, `AGENTS.md`).

When the gate flags a new file:

1. **Preferred:** author a `file.create` migration shipping it to existing apps.
2. **Deliberate opt-out** (the file genuinely shouldn't reach upgraded apps): regenerate the baseline —

   ```bash
   pnpm --filter @igrp/template-migrator check:drift:update-baseline
   ```

   This recomputes the baseline (current files − managed − exempt), pruning stale entries. Commit the result. Don't hand-edit the baseline to silence a failure — that recreates the blind spot this check exists to close.

### Template lock check

`templates/demo-v1/.igrp-migrations-lock.json` is a tracked file that ships **inside the zip on purpose**: a freshly scaffolded app must open with every migration already marked applied, because the template tree already contains their result.

That only holds while the lock keeps pace. When it falls behind, a brand-new app reports migrations it already has as pending — `igrp-migrate check` fails on day one, and `apply` re-runs finished migrations, writing `undo` entries that describe a state the app was never in. Neither of the other axes can see this: the orphan check exempts the lock by path, and no migration manages its content.

So after adding a migration (or correcting one's `steps` in place), regenerate the lock:

```bash
pnpm --filter @igrp/template-migrator sync:template-lock
```

Add `--check` for a dry run that reports what's stale and exits 1 without writing — the same condition the gate enforces.

Regeneration is **append-and-refresh, not rewrite**: existing entries keep their recorded `appliedAt` and `cliVersion` (that's history, and churning it every release would lose the record of which CLI stamped each migration). Only `manifestHash` is refreshed, missing entries are appended in migration order, and entries for deleted migrations are dropped.

New entries carry an empty `undo`/`fileHashes`, which is the honest representation: nothing was executed against a file tree here — the template simply *is* the post-migration state, so rolling a scaffolded app back past its baseline isn't a supported operation.

---

## Releasing

This package follows the same changeset + Sonatype flow as the other `@igrp/*` packages. The `release` script runs `check:drift` first, so the publish aborts if the payloads have drifted from the template.

### 1. Record a changeset

```bash
# From the repo root
pnpm changeset
```

Select `@igrp/template-migrator` and write a summary. **Always choose `patch`** — never `minor` or `major`. This repo is in changeset pre-release mode (`beta` tag); a `minor`/`major` bump would advance the real semver minor/major and break the `0.1.0-beta.*` pattern. `patch` increments only the beta counter, which is what you want for both new migrations and CLI fixes.

### 2. Version

```bash
pnpm version:changesets
```

Applies the pending changesets, bumps `package.json`, and updates `CHANGELOG.md`.

### 3. Build

```bash
pnpm --filter @igrp/template-migrator build
```

Verify the output:

- `dist/manifest.json` contains all expected migrations.
- `dist/payload/` has one subdirectory per migration (`01/`, `02/`, …) with no nested `payload/` folder.
- `dist/cli.js` is executable and imports correctly.

### 4. Publish

Use the package's own `release` script — **never** bare `pnpm publish`, `changeset publish`, or `pnpm release:publish` (those use the `beta` tag in pre-release mode and would publish to the wrong tag):

```bash
pnpm --filter @igrp/template-migrator release
```

The `release` script runs `pnpm build` then `pnpm publish --registry=https://sonatype.nosi.cv/repository/igrp/ --tag latest --no-git-checks`, pinning the Sonatype registry and `latest` tag.

### 5. Verify on the registry

```bash
pnpm dlx @igrp/template-migrator@latest list
```

Should print the migration list without errors, confirming the tarball is reachable and valid.

---

## Versioning convention

The version tracks the framework release it is paired with:

```
0.1.0-beta.<framework-beta-number>
```

Example: when `@igrp/framework-next` ships `0.1.0-beta.116`, bump `template-migrator` to `0.1.0-beta.116` in the same changeset run.

Every change — new migration or CLI-only fix — uses a `patch` changeset, which advances only the beta counter:

```
0.1.0-beta.115   →   0.1.0-beta.116
```

Never bump the `0.1.0` portion (that requires a `minor`/`major` changeset, which is disallowed here — see the hard rules and the **Releasing** section above).

---

## Lock file schema

The CLI writes `.igrp-migrations-lock.json` in the consumer app root after each applied migration:

```ts
interface LockFile {
  version: 1;
  template: "demo-v1";
  applied: LockEntry[];
}

interface LockEntry {
  id: string;               // migration ID, e.g. "04-multi-auth-provider"
  appliedAt: string;        // ISO 8601 timestamp
  cliVersion: string;       // CLI version that applied this migration
  manifestHash: string;     // hash of the migration's steps at apply time
  undo: MigrationStep[];    // inverse steps for rollback
  fileHashes: Record<string, string>;  // SHA-256 of each written file
}
```

The lock file is owned by the consumer — they commit it to version control. The CLI never deletes it; `rollback` removes the last entry and the files it wrote.

An entry with an empty `undo` **and** no `undoPayloads` is a *baseline* entry: it came from the template's shipped lock, meaning a scaffolded app already contained that migration's result and the CLI never executed it there. `rollback` refuses those (unless `--force`), because removing one would report success, change no files, and leave the app claiming the migration is unapplied.

## Crash recovery journal

`apply` writes `.igrp-migration-journal.json` to the consumer's project root before a migration's first step, updates it after each step, and removes it once the lock entry is persisted.

Its presence on startup means exactly one thing: a previous run died mid-migration. The in-process transactional unwind only runs inside `catch`, so a signal (Ctrl-C, CI timeout, power loss) bypasses it and leaves files mutated with nothing recorded. Without the journal, the retry would re-capture its undo baseline from the *already-migrated* files — so the lock would record migrated content as the pre-migration original, and a later `rollback` would silently restore the wrong state.

On the next `apply` the recorded undo is replayed first (via `src/unwind.ts`, the same code the error path uses), then the migration re-applies from a clean baseline. If any path cannot be restored, `apply` aborts rather than proceeding on an unknown baseline.

The journal is transient and consumer-local; it is exempt from the drift gate's new-file check.

---

## Local development tips

- **Run the pack script in isolation** to iterate on frontmatter parsing without a full build:

  ```bash
  cd packages/template-migrator
  pnpm tsx scripts/pack.ts
  ```

- **Inspect the manifest**:

  ```bash
  node -e "console.log(JSON.stringify(require('./dist/manifest.json'), null, 2))" | head -60
  ```

- **Smoke-test the CLI** before publishing by pointing `node` directly at `dist/cli.js` from inside a test app directory.
