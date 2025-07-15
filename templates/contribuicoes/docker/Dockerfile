# # ---------- base image ----------
# FROM node:22-alpine AS base
# RUN apk add --no-cache libc6-compat && corepack enable
# ENV PNPM_HOME=/pnpm
# ENV PATH="$PNPM_HOME:$PATH"
# WORKDIR /app

# # ---------- deps layer ----------
# FROM base AS deps
# COPY package.json pnpm-lock.yaml .npmrc ./
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
#   pnpm install --frozen-lockfile

# # ---------- build layer ----------
# FROM base AS build
# COPY --from=deps /app .
# COPY . .
# RUN pnpm build

# # ---------- production image ----------
# FROM base AS production
# ENV NODE_ENV=production
# COPY --from=build /app/.next /app/.next
# COPY --from=deps  /app/node_modules /app/node_modules
# COPY package.json .npmrc ./
# EXPOSE 3000
# CMD ["pnpm", "start"]


FROM node:22-alpine AS base
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc ./

RUN \
  if [ -f yarn.lock ]; then yarn; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi


FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]