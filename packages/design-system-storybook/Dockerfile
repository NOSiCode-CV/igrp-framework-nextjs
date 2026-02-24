# ---------- Builder ----------
FROM node:22-alpine AS builder

WORKDIR /igrp-framework-nextjs

# Enable pnpm
RUN corepack enable

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Copy workspace package manifests first (better caching)
COPY packages/design-system-storybook/package.json ./packages/design-system-storybook/

# If you depend on shared packages, copy their package.json too:
# COPY packages/design-system/package.json ./packages/design-system/

# Install dependencies (workspace-aware)
RUN pnpm install --frozen-lockfile

# Now copy full source
COPY . .

# Build Storybook from workspace
WORKDIR /igrp-framework-nextjs/packages/design-system-storybook
RUN pnpm build-storybook


# ---------- Production image ----------
FROM node:20-alpine

WORKDIR /app
RUN corepack enable
RUN pnpm add -g serve

COPY --from=builder /igrp-framework-nextjs/packages/design-system-storybook/storybook-static ./storybook-static

EXPOSE 6006

CMD ["serve", "-s", "storybook-static", "-l", "6006"]