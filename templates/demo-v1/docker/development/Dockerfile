# Targets a STANDALONE app scaffolded from this template — published @igrp/*
# versions plus a local pnpm-lock.yaml in the app root.
#
# It does NOT build from the monorepo checkout of templates/demo-v1: the COPY
# below needs pnpm-lock.yaml / pnpm-workspace.yaml in the build context (they
# live at the monorepo root, not here), and package.json pins @igrp/* as
# `workspace:*`, which no registry can resolve. Use `pnpm dev:demo` from the
# monorepo root for in-repo work. Full walkthrough: docs/DOCKER-RUN.md.
#
# Runtime base — kept deliberately thin: no pnpm, no build tooling.
# `runner` inherits from here so none of that reaches the final image.
FROM node:26.13.0-slim AS base

WORKDIR /app

# Build-time base — adds the package manager on top of `base`.
FROM base AS toolchain

RUN npm install -g pnpm@11.1.1

FROM toolchain AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# --frozen-lockfile (not --prefer-*) so lockfile drift fails the build loudly
# instead of silently re-resolving to different versions than the local install.
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM toolchain AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY ./docker/development/.env.development .env.production

ENV NEXT_TELEMETRY_DISABLED=1

# `next build` directly, not `pnpm build` — the latter is `pnpm lint &&
# pnpm lint:i18n && next build` (Biome `check --write`, then the i18n checks),
# and an image build must not rewrite sources or fail on lint. Run `pnpm lint`
# and `pnpm lint:i18n` in CI / locally instead.
RUN pnpm exec next build --turbopack

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Override when NEXT_PUBLIC_BASE_PATH is set — route handlers live under basePath.
ENV HEALTHCHECK_PATH=/api/health

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+process.env.HEALTHCHECK_PATH).then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "server.js"]
