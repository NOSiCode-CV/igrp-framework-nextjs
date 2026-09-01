# Runtime base — kept deliberately thin: no pnpm, no build tooling.
# `runner` inherits from here so none of that reaches the final image.
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat
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

# `next build` directly, not `pnpm build` — the latter is `biome check --write &&
# next build`, and an image build must not rewrite sources or fail on lint.
# Run `pnpm lint` in CI / locally instead.
RUN pnpm exec next build --turbopack

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

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
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}${HEALTHCHECK_PATH}" || exit 1

CMD ["node", "server.js"]
