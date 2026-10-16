# igrp-framework-nextjs

pnpm workspace monorepo for the IGRP Framework — a set of React/Next.js packages that power IGRP applications — plus reference templates. Published to the NOSi Sonatype registry.

## Requirements

- **Node.js** ≥ 22.x
- **pnpm** 12.3.4 (pinned via `packageManager` in `package.json`; `corepack enable` picks it up)

---

## Workspace layout

```
packages/
  design-system/              → @igrp/igrp-framework-react-design-system
  design-system-storybook/    → Storybook + visual/regression tests
  framework/
    next-auth/                → @igrp/framework-next-auth
    next-types/               → @igrp/framework-next-types
    next-ui/                  → @igrp/framework-next-ui
    next/                     → @igrp/framework-next
    next-i18n/                → @igrp/framework-next-i18n (dev-only i18n CLI)
    template-migrator/        → @igrp/template-migrator
templates/
  demo-v1/                    → reference template (the only one)
```

### What each package does

| Package | Description |
| ------- | ----------- |
| `@igrp/framework-next-auth` | NextAuth.js wrappers, OIDC providers (Keycloak, Autentika), JWT/session helpers, edge-safe middleware |
| `@igrp/framework-next-types` | Shared TypeScript types — no runtime code |
| `@igrp/igrp-framework-react-design-system` | React component library: Horizon IGRP components, Primitives (Radix + CVA), Custom domain components |
| `@igrp/framework-next-ui` | Client-side template chrome: header, sidebar, nav, auth carousel, providers |
| `@igrp/framework-next` | Server-side layouts (`IGRPRootLayout`, `IGRPLayout`), config builder (`igrpBuildConfig`), access-management API client |
| `@igrp/template-migrator` | CLI (`igrp-migrate`) that automates template upgrades via migration guides |

---

## Quick start

### 1. Install

Registry credentials take two steps (template: `.env.npmrc.example`):

1. Put `NPM_REGISTRY_USERNAME` and `NPM_REGISTRY_PASSWORD` (base64-encoded) in a root **`.env`** — `install:deps` reads `.env`, not `.env.local`.
2. Add the auth lines to your **user** npmrc (`~/.npmrc`, or `%USERPROFILE%\.npmrc` on Windows) — not the repo `.npmrc`:

   ```ini
   //sonatype.nosi.cv/repository/igrp/:username=${NPM_REGISTRY_USERNAME}
   //sonatype.nosi.cv/repository/igrp/:_password=${NPM_REGISTRY_PASSWORD}
   ```

```bash
pnpm install:deps   # uses dotenv-cli to inject registry credentials
```

### 2. Build framework packages

Must run once before the dev server can start:

```bash
pnpm build:framework
```

### 3. Start the demo template

```bash
# Copy and fill in the template env file
cp templates/demo-v1/.env.example templates/demo-v1/.env

pnpm dev:demo       # Next.js 15 + Turbopack on http://localhost:3000
```

Set `IGRP_PREVIEW_MODE=true` in `templates/demo-v1/.env` to skip auth and use mock data.

---

## Dependency order

Packages must be built in this order — `pnpm build:framework` handles it automatically:

```
framework-next-auth → framework-next-types → design-system → framework-next-ui → framework-next → framework-next-i18n
```

After any public-API change to a framework package, rebuild before consuming downstream.

---

## Common commands

### Framework builds

```bash
pnpm build:framework    # full ordered build (run this after any framework change)
pnpm build:auth         # @igrp/framework-next-auth only
pnpm build:next-types   # @igrp/framework-next-types only
pnpm build:ds           # design-system only
pnpm build:next-ui      # @igrp/framework-next-ui only
pnpm build:next         # @igrp/framework-next only
pnpm build              # all packages with a build script
```

### Dev

```bash
pnpm dev:demo           # demo template (needs build:framework first)
```

### Lint / format

```bash
pnpm lint               # every workspace: ESLint in framework packages and design-system, `biome check --write` in demo-v1
pnpm format             # every workspace: Prettier in framework packages, `biome format --write` in demo-v1
```

### Storybook

```bash
pnpm storybook                      # port 6006
pnpm test:storybook                 # Playwright snapshots (Storybook must be running)
```

### Tests

Vitest, per package (no root `test` script):

```bash
pnpm --filter <package-name> test   # design-system, next-auth, next-ui, next, next-i18n, template-migrator
pnpm --filter @igrp/igrp-framework-react-design-system-storybook test:vitest   # Storybook component tests
```

### Releases

```bash
pnpm changeset                      # record a change (always use patch type — see below)
pnpm version:changesets             # apply versions + regenerate CHANGELOGs
```

### Cleanup

```bash
pnpm clean                          # remove dist/ (design-system, next-ui, next also remove node_modules)
pnpm clean-all                      # remove dist/ + node_modules
```

---

## Versioning

All packages are in pre-release mode (`beta` tag). The version pattern is `0.2.0-beta.*` (the `0.1.0-beta.*` line ended at the start of the `version/0.2.0-beta` branch).

**Always use `patch` changesets** — never `major` or `minor`. In changeset pre-release mode, `major`/`minor` bump the actual semver major/minor (e.g. `major` on `0.2.0-beta.16` → `1.0.0-beta.17`), breaking the `0.2.0-beta.*` pattern.

---

## Publishing

Target: NOSi internal Sonatype registry (`https://sonatype.nosi.cv/repository/igrp/`) with `--tag latest`.

Publish with each package's own `release` script (`pnpm --filter <package-name> release`), which builds, checks and publishes with `--tag latest`. **Never use `changeset publish` or `pnpm release:publish`** — in pre-release mode they publish under `--tag beta`. Publish every package that `pnpm version:changesets` bumped.

Check what is actually published before and after:

```bash
pnpm view <package-name> version --registry=https://sonatype.nosi.cv/repository/igrp/
```

---

## Package-specific docs

Each package has its own README with setup, usage, and build details:

- [packages/framework/next-auth/README.md](packages/framework/next-auth/README.md)
- [packages/framework/next-types/README.md](packages/framework/next-types/README.md)
- [packages/design-system/README.md](packages/design-system/README.md)
- [packages/framework/next-ui/README.md](packages/framework/next-ui/README.md)
- [packages/framework/next/README.md](packages/framework/next/README.md)
- [packages/framework/next-i18n/README.md](packages/framework/next-i18n/README.md)
- [packages/framework/template-migrator/README.md](packages/framework/template-migrator/README.md)
- [packages/design-system-storybook/README.md](packages/design-system-storybook/README.md)
- [templates/demo-v1/README.md](templates/demo-v1/README.md)

---

## License

MIT © IGRP Labs / NOSi E.P.E
