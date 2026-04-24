# Automation Plan — Turborepo + Changesets + Template Release

**Status:** Analysis + plan (no code written yet)
**Date:** 2026-04-23

This document covers three related improvements to the `igrp-framework-nextjs` monorepo. They compose: **Turborepo** speeds up the build; **Changesets + CI** automates versioning and publishing; a tuned **template release flow** removes the manual `workspace:*` → concrete-version cascade.

---

## Part 1 — Turborepo adoption

### 1.1 Current state

- `packages/**`, `templates/**`, `apps/**` managed as a pnpm workspace.
- Root `package.json` drives builds with hand-ordered scripts:

  ```jsonc
  "build:framework": "pnpm build:auth && pnpm build:next-types && pnpm build:ds && pnpm build:next-ui && pnpm build:next"
  ```

- Every repeated build re-runs every task — no caching across invocations.
- `pnpm -r run build` fans out but doesn't cache or topologically order by default.

### 1.2 Why Turborepo

| Pain | Turborepo answer |
|---|---|
| Manual ordering in `build:framework` | Topological order inferred from `dependencies` / `devDependencies` via `^build` |
| Every build re-runs everything | Content-hash cache of inputs/outputs; unchanged packages return in <100 ms |
| Parallel independent tasks sequential today | Turbo runs non-dependent tasks concurrently |
| No shared dev task coordination | `turbo run dev --parallel` starts every dev server under one supervisor |
| Slow CI | Remote cache (Vercel Remote Cache or self-hosted `turborepo-remote-cache`) shares hits across machines |

Turbo does **not** replace pnpm. pnpm keeps doing workspace resolution and install; Turbo orchestrates tasks on top.

### 1.3 Proposed configuration

Add `turbo` to root devDependencies, then a single `turbo.json`:

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env", "pnpm-lock.yaml", "tsconfig.json"],
  "globalEnv": ["NODE_ENV", "IGRP_PREVIEW_MODE", "AUTH_PROVIDER"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json", "tsup.config.ts", ".swcrc", "package.json"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint":    { "inputs": ["src/**", ".eslintrc*", "biome.json"] },
    "format":  { "cache": false },
    "test":    { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "clean":   { "cache": false },

    "dev":     { "cache": false, "persistent": true },
    "storybook": { "cache": false, "persistent": true },

    "test:storybook": {
      "dependsOn": ["^build", "storybook"],
      "outputs": ["test-results/**"]
    },

    "//#changeset-version": { "cache": false },
    "//#changeset-publish": { "cache": false, "dependsOn": ["build"] }
  }
}
```

Then root `package.json` scripts collapse to:

```jsonc
{
  "scripts": {
    "build": "turbo run build",
    "build:framework": "turbo run build --filter='./packages/framework/*' --filter=@igrp/igrp-framework-react-design-system",
    "dev:demo": "turbo run dev --filter=@igrp/framework-next-template",
    "lint":    "turbo run lint",
    "test":    "turbo run test",
    "clean":   "turbo run clean",
    "changeset":         "changeset",
    "changeset:version": "changeset version",
    "changeset:publish": "turbo run build --filter='[HEAD^1]' && changeset publish"
  }
}
```

`build:framework` becomes redundant — `turbo run build` already orders by dependency graph — but we keep it as an alias for discoverability.

### 1.4 Concrete changes

1. Add `turbo` to root `devDependencies` (`turbo@^2`).
2. Write `turbo.json` at repo root (per §1.3).
3. Add `.turbo` to root `.gitignore`.
4. Add `"dev": "next dev --turbopack"` and equivalents as `persistent: true` tasks so Turbo keeps them running.
5. Replace the hand-ordered `build:framework` script with the turbo filter version. Keep the name; it's referenced in `CLAUDE.md`.
6. For each package that builds with SWC + Babel + tsc (design-system, next-ui, next), add `outputs: ["dist/**"]` and verify caching keys don't include unrelated paths.
7. Optionally add `remoteCache` config later — Vercel Remote Cache is easiest; `turborepo-remote-cache` is self-hosted.

### 1.5 Risks

- **SWC + Babel pipeline** in some packages uses `rimraf dist_optimized && move dist_optimized dist`. Turbo's cache restoration may fight this. Validate by running `turbo run build` twice in a row and confirming `dist/` is identical.
- **React Compiler** pass has a fallback `build:without_reactcompiler` — both should be valid turbo tasks, but only `build` is cached.
- **Storybook + Playwright** expect specific filesystem layouts. `test:storybook` needs `storybook` running; express via `dependsOn`.
- **Template (next) build** uses `--turbopack` and produces `.next/`. Include in outputs with the standard `!.next/cache/**` exclusion.

### 1.6 Verification

- `pnpm i && turbo run build` — full cold build completes; measure time.
- `turbo run build` again — expect <2 s (full cache hit).
- Touch a file in `packages/framework/next-auth/src`, rerun — only `next-auth` + downstream rebuild.
- `turbo run build --dry=json | jq '.tasks[].taskId'` — sanity check the execution graph.
- CI parity: a GitHub Action runs the same command and inherits cache via remote cache or repo artifact upload (see Part 2 for wiring).

---

## Part 2 — Changesets → build → publish automation

### 2.1 Current state

- `.changeset/config.json` is stock: `commit: false`, `updateInternalDependencies: "patch"`, `baseBranch: "main"`.
- Root scripts: `changeset`, `version:changesets`. No publish automation.
- Each publishable package has its own `release` script: `pnpm build && yarn publish --registry=…`. **`yarn publish` does not rewrite `workspace:*` deps**, which is the root cause of the manual cascade (Part 3).
- `.npmrc` holds Sonatype creds in plaintext at the repo root — fine for a private dev env, must be replaced with CI secrets.
- No `.github/workflows/` directory exists.

### 2.2 Target flow (industry-standard changesets pattern)

```
┌─ Developer ─┐     ┌──────── Changesets bot ────────┐    ┌─ Publish workflow ─┐
│  PR with    │     │ Open "Version Packages" PR:    │    │ turbo build        │
│  .changeset │ ──▶ │  - bump versions               │──▶ │ changeset publish  │
│  entry      │     │  - regen CHANGELOGs            │    │ (pnpm publish)     │
│             │     │  - rewrite workspace consumers │    │                    │
└─────────────┘     └────────────────────────────────┘    └────────────────────┘
```

Two PRs from a developer's perspective: one with the code change, one the bot opens to bump versions. Merging the Version Packages PR triggers publish.

### 2.3 What `changeset publish` (via pnpm) does for free

- Builds the publishable tree in topological order (handled by Turbo via `dependsOn: ["build"]`).
- Calls `pnpm publish` per package (respects registry, tag, access).
- **`pnpm publish` rewrites `workspace:*` to the concrete version** of the depended-on workspace package at publish time. This is the piece yarn publish was missing and the piece that eliminates the manual cascade.

### 2.4 Concrete changes

1. **Fix every package's `release` / `publish` script** — switch from `yarn publish …` to `pnpm publish …` so `workspace:*` resolution kicks in. Example:

   ```jsonc
   // packages/framework/next-auth/package.json
   "release": "pnpm build && pnpm publish --registry=https://sonatype.nosi.cv/repository/igrp/ --tag latest --no-git-checks"
   ```

   Actually once we use `changeset publish`, per-package `release` scripts become optional — `changeset publish` walks every package with a pending version bump and calls `pnpm publish` itself. Keep them only for emergency manual releases.

2. **CI platform — GitLab CI/CD** (the project is hosted on GitLab, not GitHub). The overall shape is unchanged, but the file format, bot tool, and secret model differ.

   **Changesets on GitLab** — the GitHub ecosystem's `changesets/action@v1` auto-bot does not exist on GitLab. Two replacement options:

   - **Option A (recommended): [`changesets-gitlab`](https://github.com/svitejs/changesets-gitlab)** — a community-maintained CLI that mirrors the GitHub action's behavior. On every pipeline run on `main`:
     - If pending `.changeset/*.md` entries exist → opens (or updates) a "Version Packages" MR that runs `changeset version`.
     - If the latest commit is a merged Version Packages MR → runs `changeset publish`.
   - **Option B (no extra dependency):** a small shell + `@changesets/cli` script that does the same branching logic, using GitLab's MR API via `curl`. More code to maintain; no runtime dependency beyond changesets itself.

   We plan on Option A unless you'd rather not introduce another dependency — flag if so.

3. **`.gitlab-ci.yml`** at the repo root. Runners are project-specific, so every job declares `tags:` to pin to the right runner pool. Adjust the tag string (`igrp-runner` below) to match the label your runners advertise.

   ```yaml
   stages: [install, lint, build, test, release]

   default:
     image: node:22-bookworm
     tags: [igrp-runner]            # project-specific runner pool
     cache:
       key:
         files: [pnpm-lock.yaml]
       paths: [.pnpm-store/]

   variables:
     PNPM_HOME: "$CI_PROJECT_DIR/.pnpm-store"
     NPM_CONFIG_STORE_DIR: "$CI_PROJECT_DIR/.pnpm-store"

   .setup-pnpm: &setup-pnpm
     - corepack enable
     - corepack prepare pnpm@latest --activate
     - pnpm config set store-dir $PNPM_HOME
     - pnpm install --frozen-lockfile

   .seed-npmrc: &seed-npmrc
     - |
       cat > .npmrc <<EOF
       @igrp:registry=https://sonatype.nosi.cv/repository/igrp/
       //sonatype.nosi.cv/repository/igrp/:username=${SONATYPE_USER}
       //sonatype.nosi.cv/repository/igrp/:_password=${SONATYPE_PASS}
       //sonatype.nosi.cv/repository/igrp/:always-auth=true
       EOF

   install:
     stage: install
     script: *setup-pnpm
     artifacts:
       paths: [node_modules/, packages/*/node_modules/, templates/*/node_modules/]
       expire_in: 1 hour

   lint:
     stage: lint
     needs: [install]
     script:
       - *setup-pnpm
       - pnpm lint

   build:
     stage: build
     needs: [install]
     script:
       - *setup-pnpm
       - pnpm build   # will be `turbo run build` after Part 1 lands
     artifacts:
       paths: ["packages/*/dist/", "packages/*/*/dist/"]
       expire_in: 1 day
     cache:
       key: turbo-${CI_COMMIT_REF_SLUG}
       paths: [.turbo/]

   test:
     stage: test
     needs: [build]
     script:
       - *setup-pnpm
       - pnpm test

   # ── Release: only on main. Opens Version Packages MR or publishes. ───────
   release:
     stage: release
     needs: [build]
     rules:
       - if: '$CI_COMMIT_BRANCH == "main"'
     script:
       - *setup-pnpm
       - *seed-npmrc
       - pnpm changeset:publish   # internally: turbo build && changesets-gitlab
     variables:
       GITLAB_TOKEN: $CHANGESETS_TOKEN        # Project Access Token, see below
       GITLAB_CI_USER_NAME: "igrp-release-bot"
       GITLAB_CI_USER_EMAIL: "release-bot@nosi.cv"
   ```

   Root `package.json` script:

   ```jsonc
   "scripts": {
     "changeset:version": "changeset version",
     "changeset:publish": "pnpm build && changesets-gitlab"
   }
   ```

   `changesets-gitlab` internally decides whether to open the Version Packages MR or to run `changeset publish`, based on whether pending changesets exist.

4. **CI/CD variables** to add in GitLab (Project → Settings → CI/CD → Variables, all **masked + protected**):

   | Variable | Value | Notes |
   |---|---|---|
   | `SONATYPE_USER` | `igrp3.0` | current username in `.npmrc` |
   | `SONATYPE_PASS` | (see open item) | raw or base64 — test both on first run |
   | `CHANGESETS_TOKEN` | Project Access Token | scope: `api`, `write_repository`; role: `Developer` or higher. Required to push branches and open MRs. Create under Project → Settings → Access Tokens. |

   Do **not** reuse the built-in `CI_JOB_TOKEN` — it cannot push to protected branches by default and cannot open MRs via the API.

5. **Remove** the plaintext creds from `.npmrc` at the repo root. Replace with a `.npmrc.example` that documents the expected env vars. Put the real `.npmrc` behind `dotenv -e .env` for local dev (this matches the existing `install:deps` script).

6. **Changeset config tweak** — keep `"access": "restricted"` (Sonatype, not public npm). Consider adding:

   ```jsonc
   {
     "privatePackages": { "version": true, "tag": false },
     "ignore": ["@igrp/framework-next-template-new", "@igrp/applications-center"]
   }
   ```

   if you want CI to skip the big demo / app-center from the version PR.

### 2.5 Risks

- **Sonatype auth token format.** Some Sonatype instances expect `NPM_CONFIG__AUTH` base64 token, others the user/password split. Test once manually with a pnpm publish from a CI runner.
- **Tag confusion.** Today `release` uses `--tag next` (framework packages) or `--tag latest` (templates). `changeset publish` uses the package's `publishConfig.tag` or `latest` by default. Decide: one tag across the board, or mixed. If mixed, set `"publishConfig": { "tag": "next" }` on the prerelease packages.
- **Pre-release trains.** The current version `0.1.0-beta.113-2` suggests you're in beta. Changesets has a **pre-release mode** (`changeset pre enter beta`) that locks everything to beta bumps. Consider turning it on until 1.0.
- **Sonatype rate limiting / flakiness.** Per-package retry in `changeset publish` is shallow. The workflow step should be idempotent (safe to re-run).

### 2.6 Verification

1. Manually: `pnpm changeset` in a branch, add a patch entry, push, open PR, merge. Bot should open a "Version Packages" PR within ~30 s.
2. Merge the bot PR. Release workflow runs; confirm packages appear in Sonatype.
3. Change the registry URL to `https://registry.npmjs.org/` in a throwaway branch and run `pnpm publish --dry-run` inside one package to confirm `workspace:*` rewriting works — `package.json` in the tarball should show a real version, not `workspace:*`.
4. Use `npm view @igrp/framework-next-auth dependencies` after publish to double-check no `workspace:*` leaked.

---

## Part 3 — Template release flow

### 3.1 Current state

- `templates/demo-legacy` is a publishable package (`"name": "@igrp/framework-next-template"`, `"version": "0.1.0-beta.113"`).
- Its `dependencies` point to `@igrp/framework-next@workspace:*`, `@igrp/framework-next-auth@workspace:*`, etc.
- Root script: `"release:demo": "pnpm --filter @igrp/framework-next-template publish:template"` — **but `publish:template` does not exist** in the template's `package.json` (only `dev`, `build`, `start`, `lint`, `format`). That script is dead.
- The user's described manual flow: build package A → publish → edit package B's `package.json` to pin `A@<version>` → build → publish → repeat up the chain → finally pin concrete versions in the template.

### 3.2 What actually causes the cascade

Two things, in sequence:

1. **`yarn publish` does not rewrite `workspace:*`** (see Part 2). So if you ship with `workspace:*` you break consumers; the manual workaround is to hand-edit.
2. **No automated version bump of consumers when a producer changes** — without changesets' `updateInternalDependencies` doing its job, B's `package.json` keeps pointing at the old A version.

Both are solved for free by the **changesets + pnpm publish** flow in Part 2. Specifically:

- `changesets version`: when `@igrp/framework-next-auth` gets a patch, every workspace consumer (`next-types`, `next-ui`, `next`, the templates) gets an automatic patch bump with its version range updated — but only for deps written as `^x.y.z`, not `workspace:*`. For `workspace:*`, the version stays literal in the source; the magic happens at publish time.
- `pnpm publish` (via `changeset publish`): rewrites `workspace:*` → the **currently published** concrete version of each workspace dep in the tarball's `package.json`. Source code in git keeps `workspace:*`; tarball ships concrete versions.

So **the cascade is already solved at the tooling level** — the user's manual flow exists because `yarn publish` + absent CI. Switching to `pnpm publish` in automated CI eliminates it.

### 3.3 Template distribution shapes

Two ways consumers can pick up a template. They're independent and you can offer both.

#### 3.3.1 As a published npm package (recommended)

- `@igrp/framework-next-template@<version>` ends up in Sonatype with concrete framework-dep versions.
- Consumers scaffold with a CLI:

  ```bash
  pnpm create @igrp/app my-app
  # or
  pnpm dlx @igrp/create-app my-app
  ```

- The CLI:
  1. `pnpm pack @igrp/framework-next-template@latest` (downloads the tarball).
  2. Extracts into `my-app/`.
  3. `rm -rf` the `.igrpmigrations/`, `.claude/`, any internal-only files.
  4. Writes a fresh `README.md` focused on the scaffolded app.
  5. Runs `pnpm install` in the scaffolded folder.

- This is the cleanest path: the template is a real npm package, version-tagged, installable offline, and no clone-of-a-monorepo-ever-happens.

Add a small package to the monorepo: `packages/create-app/` (or similar) that ships the CLI. Its binary:

```jsonc
// packages/create-app/package.json
{
  "name": "@igrp/create-app",
  "bin": { "create-igrp-app": "./dist/cli.js" },
  "dependencies": { "prompts": "^2", "tar": "^7", "pacote": "^20" }
}
```

Use `pacote` to download the published template, not `git clone` — works without GitHub access and respects Sonatype.

#### 3.3.2 As a git-cloneable folder (easy but less polished)

- Users run `degit igrp/framework-nextjs/templates/demo-legacy my-app`.
- The `workspace:*` strings stay in `package.json` verbatim, which pnpm in the user's machine cannot resolve → failure.
- To make this path work, maintain a parallel **release branch** (`templates/demo-legacy-release`) that's auto-generated from `main` with workspace refs replaced by published versions. A release-time script does the rewrite and force-pushes the release branch.

This is more moving parts than (3.3.1) and strictly worse for reproducibility. Recommend we **not** support it as a first-class flow unless there's a hard external requirement.

### 3.4 Concrete changes

1. **Rename the template's package shape** so it's ready to publish as a scaffoldable unit.

   - Keep the current package name. `"@igrp/framework-next-template"` is fine.
   - Add `"files": ["src", "public", "next.config.*", "tsconfig.json", "biome.json", "package.json"]` so internal-only directories (`.igrpmigrations/`, `.claude/`) are NOT included in the tarball.
   - Add a proper `publishConfig`:

     ```jsonc
     "publishConfig": {
       "registry": "https://sonatype.nosi.cv/repository/igrp/",
       "tag": "next",
       "access": "restricted"
     }
     ```

   - Remove the non-existent `publish:template` reference from the root script. Replace with `release:demo` calling `changeset publish --filter=@igrp/framework-next-template` if you want a manual one-off.

2. **Add a changeset "ignore"** rule if the template's version should NOT auto-bump on every framework patch (templates tend to want coarser version movements). If you want it to auto-bump, leave changeset config as is — `updateInternalDependencies: "patch"` will do the right thing.

3. **Build a `create-igrp-app` CLI** (follow-up; not blocking):

   - New package `packages/create-app/`.
   - Uses `pacote` to download `@igrp/framework-next-template@<range>`.
   - Scaffolds, rewrites `name`, `version`, strips internal files.
   - Runs `pnpm install` in the scaffolded folder.
   - Publish as `@igrp/create-app` + expose via `pnpm create @igrp/app`.

4. **Keep `workspace:*` everywhere**. Never manually edit to concrete versions again — `pnpm publish` does it at release time.

5. **Document the flow**: add a section in the root `README.md` (or `CLAUDE.md`) pointing consumers at `pnpm create @igrp/app` once the CLI exists; until then, `pnpm dlx pacote extract @igrp/framework-next-template@next ./my-app` is a one-liner workaround.

### 3.5 Risks

- **Sonatype tarball layout.** Templates that include `node_modules/` or build artifacts by accident bloat the Sonatype storage. `files` in `package.json` is the defensive line; audit with `pnpm pack --dry-run` before every release.
- **peerDependencies inside the template.** Templates often carry `react`, `next` as real dependencies (not peer). When the CLI runs `pnpm install` on the scaffolded copy, it resolves against the published versions of `@igrp/framework-*` which themselves declare `react` / `next` as peers. Versions must match. Changesets respects peer ranges; keep peer ranges up to date manually (no tooling solves this one cleanly).
- **Lockfile at scaffolding time.** If the template ships with a `pnpm-lock.yaml` that references workspace packages, it will be invalid post-scaffold. Strip the lockfile from the tarball (add `pnpm-lock.yaml` to `.npmignore` or exclude from `files`); let the user's `pnpm install` generate a fresh one.
- **`.env` files.** Must never ship. Already excluded by npm defaults, but verify.

### 3.6 Verification

1. Locally: `cd templates/demo-legacy && pnpm pack --dry-run` — inspect file list; confirm `.igrpmigrations/`, `.claude/`, `.env`, `node_modules/` all absent.
2. Set up the release workflow; land a tiny patch in `@igrp/framework-next-auth`; merge the Version Packages PR; confirm:
   - Sonatype receives `@igrp/framework-next-auth@0.1.0-beta.114`.
   - Sonatype receives `@igrp/framework-next-template@<bumped>` where its `package.json` has `"@igrp/framework-next-auth": "0.1.0-beta.114"` — NOT `workspace:*`.
3. `pacote extract @igrp/framework-next-template@next /tmp/scaffold-test && cd /tmp/scaffold-test && pnpm i && pnpm dev` — end-to-end scaffold.

---

## Order of execution (locked)

### Step 1 — Changeset pre-release mode + cleanup (15 min, do first)

```bash
pnpm changeset pre enter beta
git add .changeset/pre.json && git commit -m "chore: enter beta pre-release mode"
```

Update `.changeset/config.json`:

```jsonc
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@igrp/framework-next-template-new", "@igrp/applications-center"]
}
```

### Step 2 — Part 2, release pipeline without Turbo (~1 day)

- Replace every package's `release` script body: `yarn publish ...` → `pnpm publish --registry=https://sonatype.nosi.cv/repository/igrp/ --no-git-checks`. Drop `--tag next`.
- Add `publishConfig` block to every publishable package:

  ```jsonc
  "publishConfig": {
    "registry": "https://sonatype.nosi.cv/repository/igrp/",
    "tag": "latest",
    "access": "restricted"
  }
  ```

- Replace plaintext creds in root `.npmrc` with env-var placeholders; create `.npmrc.example`.
- Install `changesets-gitlab` as a root devDependency.
- Write `.gitlab-ci.yml` per Part 2 §2 (stages: install, lint, build, test, release).
- Create a GitLab **Project Access Token** (scope: `api`, `write_repository`) and store as CI/CD variable `CHANGESETS_TOKEN` (masked + protected).
- Add `SONATYPE_USER` + `SONATYPE_PASS` CI/CD variables (masked + protected).
- First release: cut a tiny patch change, merge to a feature branch, open MR → confirm lint/build/test green, merge to `main` → confirm the release job opens a "Version Packages" MR, merge that MR → confirm the next release job runs `changeset publish` and the tarball in Sonatype has concrete deps (not `workspace:*`).

### Step 3 — Part 3, template publishing housekeeping (~½ day)

- Add to `templates/demo-legacy/package.json`:

  ```jsonc
  "files": [
    "src",
    "public",
    "next.config.ts",
    "tsconfig.json",
    "biome.json",
    "package.json",
    "README.md"
  ],
  "publishConfig": {
    "registry": "https://sonatype.nosi.cv/repository/igrp/",
    "tag": "latest",
    "access": "restricted"
  }
  ```

- Delete the dead `release:demo` → `publish:template` alias from root `package.json`.
- `pnpm pack --dry-run` inside `templates/demo-legacy`; confirm the file list matches the `files` array (no `.igrpmigrations/`, no `.claude/`, no `.env`, no `node_modules/`).
- Defer the `create-igrp-app` CLI to a follow-up.

### Step 4 — Part 1, Turbo adoption (~2–4 days)

- `pnpm add -w turbo@^2` + `turbo.json` per Part 1 §1.3.
- Update root scripts to call `turbo run <task>`; keep `build:framework` as a filter alias.
- Run the cold-vs-warm-build sanity matrix; fix any package whose cache keys miss inputs.
- Wire self-hosted `turborepo-remote-cache` — deploy the service, set `TURBO_API` / `TURBO_TOKEN` / `TURBO_TEAM` as repo secrets, export them in both workflow files.

### Why this order

- Step 1 is free and unlocks Step 2's bumping behavior.
- Step 2 is the biggest pain (manual cascade) and smallest net new tooling.
- Step 3 depends on Step 2's CI working — without `changeset publish` doing the tarball with concrete deps, housekeeping `files` alone doesn't help.
- Step 4 (Turbo) is pure optimization; landing it after the pipeline is stable lets you measure cache wins against a known baseline.

Introducing all four at once risks "what broke the release?" confusion when Sonatype rejects a tarball.

---

## Dependencies between parts

- **Part 2 depends on Part 3 §3.4.1** for the template's `publishConfig` / `files` to exist — otherwise `changeset publish` tries to publish the template with its full dev baggage.
- **Part 1 depends on Part 2** only for the `turbo run build` step in the release workflow — without Turbo, the workflow can call `pnpm -r build` as a placeholder.
- **Part 3's create-app CLI** doesn't depend on either — it can ship whenever, as long as there's a published template to download.

---

## Decisions locked in (2026-04-23)

1. **Pre-release train = ON.** Repo stays in `beta-*` for the foreseeable future.
   - Run `pnpm changeset pre enter beta` as a one-time setup; commit the resulting `.changeset/pre.json`.
   - Every `changeset version` in CI produces beta bumps (e.g. `0.1.0-beta.113-2` → `0.1.0-beta.114`).
   - When ready to stabilize: `pnpm changeset pre exit` + a final `changeset version` emits the `1.0.0` cut.

2. **Publish tag = `latest` for everything.** Simplifies CI — no per-package tag matrix.
   - Update every package's `publishConfig` to `{ "tag": "latest" }` (or omit since `latest` is the default).
   - Remove the `--tag next` flag from existing `release` scripts.
   - Single consequence: pre-release versions will also land under `latest`. Acceptable while everything is in beta; revisit when you cut 1.0.

3. **Turbo remote cache = self-hosted `turborepo-remote-cache`.**
   - Add a small service deployment (Docker; S3/MinIO or on-disk storage).
   - CI config: `TURBO_API`, `TURBO_TOKEN`, `TURBO_TEAM` env vars point at the self-hosted URL.
   - Infra ticket deferred — Turbo adoption (Part 1) can start with local cache only; remote cache bolts on later without code changes.

4. **`templates/demo` stays workspace-local.** Not published by CI.
   - Add `"@igrp/framework-next-template-new"` to `.changeset/config.json` `"ignore"` so the version PR doesn't bump it.
   - Keep it buildable locally for internal reference, but it never lands in Sonatype.

## Still open

- **Sonatype auth format.** Current `.npmrc` uses base64 in `_password`. Confirm on the first CI run whether `SONATYPE_PASS_B64` should receive the raw password or the base64 form — Sonatype versions differ. Test both with `pnpm publish --dry-run` on the first workflow invocation, then pin the working form in the workflow. No blocker for starting.
