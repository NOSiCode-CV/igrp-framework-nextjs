# ---------- Builder ----------
FROM node:22-alpine AS builder

WORKDIR /igrp-framework-nextjs

# Enable pnpm
RUN corepack enable

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

# Build Storybook from workspace
WORKDIR /igrp-framework-nextjs/packages/design-system-storybook
RUN pnpm exec storybook build --output-dir storybook-static --stats-json


# ---------- Production image ----------
FROM node:22-alpine

WORKDIR /app
RUN npm install -g serve

COPY --from=builder /igrp-framework-nextjs/packages/design-system-storybook/storybook-static ./storybook-static

EXPOSE 6006

CMD ["serve", "-s", "storybook-static", "-l", "6006"]