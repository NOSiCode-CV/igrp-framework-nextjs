# Hard rules (repo-wide)

- **pnpm only.** `engines.node >= 22`. Workspaces rely on the `workspace:*` protocol — internal deps are linked, not downloaded.
- **Don't edit `dist/`.** Every package builds into its own `dist/` and that is what ships; source is always under `src/`.
- **Don't import package internals** (e.g. `@igrp/framework-next-auth/dist/...`). Use the documented subpath export entry points.
- **Changeset per user-visible change** to a publishable package (`pnpm changeset`).
- **Changesets must always use `patch` type** — never `major` or `minor`. This repo is in pre-release mode (`beta` tag) and the version pattern is `0.1.0-beta.*`. In changeset pre-release mode, `major`/`minor` DO bump the actual semver major/minor (e.g. `major` on `0.1.0-beta.116` → `1.0.0-beta.117`), breaking the `0.1.0-beta.*` pattern. Always use `patch` to increment only the beta counter.
- Publish target is the internal Sonatype registry (`https://sonatype.nosi.cv/repository/igrp/`) with `--tag latest`. Don't switch registries or tags.
- Lint/format toolchain is **package-specific**. Framework packages: **ESLint + Prettier**. `templates/demo`: **Biome**. Don't cross-apply.
- `.env.npmrc.example` documents registry/auth setup; `pnpm install:deps` runs install via `dotenv-cli` so a root `.env` can inject private-registry credentials.
