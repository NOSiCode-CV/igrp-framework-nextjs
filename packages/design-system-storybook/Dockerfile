# Build stage
FROM node:22-alpine AS builder

WORKDIR /repo

# Enable pnpm and install Alpine deps for native modules
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/design-system/package.json packages/design-system/package.json
COPY packages/design-system-storybook/package.json packages/design-system-storybook/package.json

# Install Storybook package and its workspace dependencies
RUN pnpm install --frozen-lockfile --filter @igrp/igrp-framework-react-design-system-storybook...

# Copy source code
COPY packages/design-system packages/design-system
COPY packages/design-system-storybook packages/design-system-storybook

# Build design-system (use build:mac for Linux - uses mv/cp instead of move)
RUN pnpm --filter @igrp/igrp-framework-react-design-system run build:mac

# Build Storybook static output
RUN pnpm --filter @igrp/igrp-framework-react-design-system-storybook run build-storybook

# Runtime stage - serve static files with nginx
FROM nginx:alpine AS runtime
COPY --from=builder /repo/packages/design-system-storybook/storybook-static /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]