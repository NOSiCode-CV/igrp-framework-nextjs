FROM node:24-alpine

WORKDIR /app

COPY . .

RUN corepack enable && if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi

EXPOSE 6006

CMD ["pnpm", "storybook"]

FROM node:24-alpine AS builder

WORKDIR /app
COPY . .

RUN corepack enable
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi
RUN pnpm run build-storybook

# Optional runtime image (if you want to run storybook-static in a container)
FROM nginx:alpine AS runtime
COPY --from=builder /app/storybook-static /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]