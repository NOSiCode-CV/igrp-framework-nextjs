# ---------- Builder ----------
FROM node:26.13.0-slim AS builder

WORKDIR /igrp-framework-nextjs

# Node 25+ no longer bundles corepack; pin pnpm to the root packageManager version
RUN npm install -g pnpm@12.3.4

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Copy workspace package manifests first (better caching)
COPY packages/design-system/package.json ./packages/design-system/
COPY packages/design-system-storybook/package.json ./packages/design-system-storybook/

# Install dependencies (workspace-aware)
RUN pnpm install --frozen-lockfile

# Now copy full source (.dockerignore excludes node_modules so we keep container's install)
COPY . .

# Re-run install so workspace packages get correct node_modules layout
RUN pnpm install --frozen-lockfile

# Build the design system first — storybook resolves it via package "exports",
# which point at dist/, and dist/ is gitignored (not present on a clean checkout)
RUN pnpm --filter @igrp/igrp-framework-react-design-system build

# Build Storybook from workspace
WORKDIR /igrp-framework-nextjs/packages/design-system-storybook
RUN pnpm exec storybook build --output-dir storybook-static --stats-json


# ---------- Production image ----------
FROM node:26.13.0-slim

WORKDIR /app
RUN npm install -g serve

COPY --from=builder /igrp-framework-nextjs/packages/design-system-storybook/storybook-static ./storybook-static

EXPOSE 6006

CMD ["serve", "-s", "storybook-static", "-l", "6006"]