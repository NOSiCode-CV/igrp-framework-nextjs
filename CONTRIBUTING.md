# Contributing

This guide takes a change from a fresh clone to a merged merge request (MR). Read [README.md](README.md) first for the workspace layout and what each package does.

## 1. Set up your machine

You need:

- **Node.js** 24.22.2 or later (the `engines` field in `package.json`).
- **pnpm** 12.3.4. Run `corepack enable` once and the `packageManager` field picks the right version.
- Credentials for the NOSi Sonatype registry, which hosts the `@igrp/*` packages.

Then:

1. Clone the repository and check out `development`, the default branch:

   ```bash
   git clone <repository-url>
   cd igrp-framework-nextjs
   git checkout development
   ```

2. Set up the registry credentials, following `.env.npmrc.example`:
   - Put `NPM_REGISTRY_USERNAME` and `NPM_REGISTRY_PASSWORD` (base64-encoded) in a root `.env` file. Don't commit it.
   - Add the auth lines to your **user** npmrc (`~/.npmrc`, or `%USERPROFILE%\.npmrc` on Windows), not to the repository's `.npmrc`.

3. Install and build:

   ```bash
   pnpm install:deps      # pnpm install with the .env credentials
   pnpm build:framework   # builds every framework package in dependency order
   ```

4. Check that the demo app runs:

   ```bash
   cp templates/demo-v1/.env.example templates/demo-v1/.env
   pnpm dev:demo          # http://localhost:3000
   ```

   Set `IGRP_PREVIEW_MODE=true` in `templates/demo-v1/.env` to run without auth or a backend, using mock data.

## 2. Create a branch

Branch from an up-to-date `development`:

```bash
git checkout development
git pull
git checkout -b fix/sidebar-collapse
```

Use one of two prefixes, followed by a short kebab-case description:

- `fix/` for a bug fix, e.g. `fix/sidebar-collapse`.
- `feature/` for anything else: a new feature, a refactor, tests, docs or tooling, e.g. `feature/session-timeout-setting`.

## 3. Make the change

Before you edit a package, read its `README.md` and, if it has one, its `KNOWN-ISSUES.md`.

Rules that apply everywhere:

- **Edit `src/`, never `dist/`.** `dist/` is build output.
- **Import from documented entry points only**, such as `@igrp/framework-next-auth/server`. Never import from `dist/...` paths.
- **Respect the dependency order:**

  ```
  framework-next-auth → framework-next-types → design-system → framework-next-ui → framework-next
  ```

  A package may only import from packages to its left. After changing a package's public API, run `pnpm build:framework` so the packages downstream see it.
- **Keep auth-aware code working with preview mode on and off.** Check the preview flag through `isAuthBypass()` (template) or `isIgrpAuthBypass()` (framework), never by reading the env directly.
- **Don't hardcode UI strings** in the design system, `next-ui` or `next`. `pnpm lint:i18n:framework` checks this (run `pnpm build:i18n-tools` first). Mark a literal that isn't UI text with an `igrp-i18n-ignore` comment.
- **Don't import the design system's `styles.css`** in a template. Import `@igrp/igrp-framework-react-design-system/tokens` and let the app compile Tailwind.

### Changes to `templates/demo-v1`

Apps created from the template zip get template changes automatically. Existing apps only get them through a migration in `@igrp/template-migrator`. So every change to `templates/demo-v1` needs a migration:

1. Write the migration as described in [Adding a new migration](packages/framework/template-migrator/README.md#adding-a-new-migration).
2. Regenerate the template lock:

   ```bash
   pnpm --filter @igrp/template-migrator sync:template-lock
   ```

3. Check that the template and the migrations agree:

   ```bash
   pnpm --filter @igrp/template-migrator check:drift
   ```

The `check_template_drift` CI job runs the same check on every MR that touches the template or the migrator.

## 4. Test it

Each package has its own Vitest suite. There is no root `test` script.

```bash
pnpm --filter <package-name> test
```

To run one test:

```bash
pnpm --filter <package-name> exec vitest run path/to/file.test.ts -t "test name"
```

Add or update tests for the behaviour you changed. If you touched a component, check it in Storybook (`pnpm storybook`, port 6006) and add or update its story.

## 5. Lint and format

The tools differ by package:

- Framework packages and the design system use **ESLint + Prettier**.
- `templates/demo-v1` uses **Biome**.

`pnpm lint` and `pnpm format` run the right tool in each workspace. Don't add a Prettier config to the template, or Biome to a framework package.

## 6. Add a changeset

A change that users of a published package can see (a fix, a feature, a new prop, changed behaviour) needs a changeset:

```bash
pnpm changeset
```

1. Select every package the change touches.
2. **Always choose `patch`.** The repository is in pre-release mode (`0.2.0-beta.*`). In this mode, `minor` or `major` bump the real version number (for example `0.2.0-beta.16` to `1.0.0-beta.17`) and break the version line.
3. Write the summary for the people who use the package: what changed and what they need to do, if anything. It goes into the package's `CHANGELOG.md`.

Commit the generated `.changeset/*.md` file with your change. Internal-only work (tests, CI, refactors with no visible effect, docs) doesn't need a changeset.

## 7. Run the CI checks locally

```bash
pnpm ci:local
```

This runs the same verify-stage jobs as `.gitlab-ci.yml`: `drift`, `skills`, `i18n`, `verify`, `e2e` and `storybook`. To run only some of them:

```bash
pnpm ci:local -- --only=verify,e2e
pnpm ci:local -- --skip=storybook
```

The Storybook job needs Playwright's Chromium (`pnpm --filter @igrp/e2e exec playwright install chromium`). Without it, the e2e job falls back to an installed Edge or Chrome.

## 8. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/), with the package as the scope:

```
fix(design-system): keep the combobox open after selecting with the keyboard
feat(template-migrator): migration 99 adds the session timeout setting
test(next): cover the access client retry path
```

Common types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `ci`, `chore`. Common scopes: `design-system`, `next-auth`, `next-types`, `next-ui`, `next`, `next-i18n`, `template`, `template-migrator`, `storybook`, `ci`.

Commits are authored by the person committing. Don't add `Co-Authored-By` trailers that name an AI model or its email.

## 9. Open a merge request

1. Push your branch and open an MR against `development`.
2. In the description, say what changed and why, how you tested it, and whether it includes a changeset or a template migration.
3. Wait for the pipeline to pass and get a review from another team member.
4. Merge when it's approved.

## 10. Releases

Only maintainers publish. A release turns the pending changesets into new versions and publishes them to `https://sonatype.nosi.cv/repository/igrp/` with `--tag latest`. The full procedure is in [README.md](README.md#publishing). In short:

- Publish with each package's own `release` script. Never use `changeset publish` or `pnpm release:publish`: in pre-release mode they publish under the `beta` tag.
- Publish every package that `pnpm version:changesets` bumped.
- Before and after, check what the registry actually holds:

  ```bash
  pnpm view <package-name> version --registry=https://sonatype.nosi.cv/repository/igrp/
  ```

## Reporting a problem

If you find a defect you won't fix right away, write it up in `KNOWN-ISSUES.md`: the root one for repository-wide issues, or one in the package's directory for a package-specific one. Delete the entry when the fix lands.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
