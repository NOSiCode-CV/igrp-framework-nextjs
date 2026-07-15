# @igrp/template-migrator

CLI that automates IGRP template upgrades. Bundles all migration guides for `templates/demo-v1` into a single executable package — consumers run it with `pnpm dlx` to bring their app up to the latest framework version without manual file edits.

---

## Package structure

```
packages/template-migrator/
├── scripts/
│   ├── pack.ts              # Prebuild: reads migration guides → emits dist/manifest.json + dist/payload/
│   ├── check-drift.ts       # Release gate: payloads/deps/new files vs. the live template
│   └── drift-orphans.ts     # New-file (orphan) detection logic + exemption lists
├── src/
│   ├── cli.ts               # Binary entry point (bin: igrp-migrate)
│   ├── index.ts             # Public API re-exports (for programmatic use)
│   ├── types.ts             # Shared types: MigrationStep, Manifest, LockFile, …
│   ├── manifest.ts          # Loads dist/manifest.json at runtime
│   ├── apply.ts             # Executes a single MigrationStep against an app root
│   ├── lock.ts              # Reads/writes .igrp-migrations-lock.json (consumer project root)
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

   All 6 (or N) migrations should print `packed <id>`. Check `dist/manifest.json` to confirm the new entry is present.

5. **Test locally** against a copy of `demo-v1`:

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
| `file.create` | `path`, `from` | Copies payload file to `path`; fails if destination already exists |
| `file.write` | `path`, `mode: "replace"`, `from` | Overwrites `path` with payload file |
| `file.delete` | `path` | Deletes `path` from the app |
| `env.add` | `file`, `keys` | Appends missing keys (with doc comments) to an `.env` file |
| `deps.bump` | `manifest`, `ranges` | Updates version ranges in `package.json` (deps or devDeps) |

`from` values must be relative to `migrations/demo-v1/` (e.g. `payload/NN/src/file.ts`). The pack script strips the leading `payload/` when copying to `dist/payload/`; the runtime in `apply.ts` does the same strip when resolving the source.

---

## Drift gate (`check:drift`)

The `migrations/demo-v1/payload/` tree is a **hand-maintained copy** of `templates/demo-v1`. If you edit the template but forget to author a migration, the two silently diverge: apps scaffolded from the zip get the change, apps upgraded via this CLI never do.

`scripts/check-drift.ts` reconciles them on three axes — **file payloads**, **dependency pins**, and **new files**. It collapses every migration into the final expected state per managed path and per bumped dependency, then compares against the live template:

```bash
pnpm --filter @igrp/template-migrator check:drift
```

It **fails** (exit 1) when:

- a managed file changed in the template but no migration re-captured it,
- a migration ships a file the template no longer has,
- a referenced payload file is missing on disk,
- a dependency a migration bumps has moved on in the template/workspace but no migration captured the new version (the template pins `@igrp/*` as `workspace:*`, so the comparison resolves each `workspace:*` to its current package version — what the zip would ship),
- a migration bumps a dependency the template doesn't declare,
- a **new template file** exists (tracked or untracked-but-not-gitignored) that no migration ships, is not exempt, and is not grandfathered in the baseline (see below).

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
