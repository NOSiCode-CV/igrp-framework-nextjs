# ---------- base image ----------
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app

# ---------- deps layer ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml* .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  if [ -f pnpm-lock.yaml ]; then \
    echo "Using frozen lockfile" && pnpm install --frozen-lockfile; \
  else \
    echo "No lockfile found, installing dependencies" && pnpm install; \
  fi

# ---------- build layer ----------
FROM base AS build
COPY --from=deps /app .
COPY . .
RUN pnpm build

# ---------- production image ----------
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/.next /app/.next
COPY --from=deps  /app/node_modules /app/node_modules
COPY package.json .npmrc ./
EXPOSE 3000
CMD ["pnpm", "start"]
