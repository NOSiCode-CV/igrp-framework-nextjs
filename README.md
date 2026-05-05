# igrp-framework-nextjs

pnpm workspace monorepo for the IGRP Framework — a set of React/Next.js packages that power IGRP applications — plus reference templates. Published to the NOSi Sonatype registry.

## Requirements

- **Node.js** ≥ 22.x
- **pnpm**

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
  template-migrator/          → @igrp/template-migrator
templates/
  demo-legacy/                → older reference template (maintenance mode)
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

Registry credentials go in a root `.env` (see `.env.npmrc.example`):

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
cp templates/demo/.env.example templates/demo/.env.local

pnpm dev:demo       # Next.js 15 + Turbopack on http://localhost:3000
```

Set `IGRP_PREVIEW_MODE=true` in `.env.local` to skip auth and use mock data.

---

## Dependency order

Packages must be built in this order — `pnpm build:framework` handles it automatically:

```
framework-next-auth → framework-next-types → design-system → framework-next-ui → framework-next
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
pnpm lint               # ESLint (framework packages)
pnpm format             # Prettier (framework packages)
# templates/demo uses Biome — run from that directory
```

### Storybook

```bash
pnpm storybook                      # port 6006
pnpm test:storybook                 # Playwright snapshots (Storybook must be running)
```

### Releases

```bash
pnpm changeset                      # record a change (always use patch type — see below)
pnpm version:changesets             # apply versions + regenerate CHANGELOGs
```

### Cleanup

```bash
pnpm clean                          # remove all dist/ folders
pnpm clean-all                      # remove dist/ + node_modules
```

---

## Versioning

All packages are in pre-release mode (`beta` tag). The version pattern is `0.1.0-beta.*`.

**Always use `patch` changesets** — never `major` or `minor`. In changeset pre-release mode, `major`/`minor` bump the actual semver major/minor (e.g. `major` on `0.1.0-beta.116` → `1.0.0-beta.117`), breaking the `0.1.0-beta.*` pattern.

---

## Publishing

Target: NOSi internal Sonatype registry (`https://sonatype.nosi.cv/repository/igrp/`) with `--tag latest`.

---

## Package-specific docs

Each package has its own README with setup, usage, and build details:

- [packages/framework/next-auth/README.md](packages/framework/next-auth/README.md)
- [packages/framework/next-types/README.md](packages/framework/next-types/README.md)
- [packages/design-system/README.md](packages/design-system/README.md)
- [packages/framework/next-ui/README.md](packages/framework/next-ui/README.md)
- [packages/framework/next/README.md](packages/framework/next/README.md)
- [packages/template-migrator/README.md](packages/template-migrator/README.md)
- [packages/design-system-storybook/README.md](packages/design-system-storybook/README.md)
- [templates/demo/README.md](templates/demo/README.md)
- [templates/demo-legacy/README.md](templates/demo-legacy/README.md)

---

## License

MIT © IGRP Labs / NOSi E.P.E
