FROM node:24-alpine

WORKDIR /app

COPY . .

RUN corepack enable && if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi

EXPOSE 6006

CMD ["pnpm", "storybook"]