---
'@igrp/framework-next-ui': patch
---

fix(session-watcher): don't push to /login when already on the auth UI

`IGRPSessionWatcher` is mounted globally via `IGRPNestedProviders`, so it runs on every route — including `/login` and `/logout`. Previously, an unauthenticated state on `/login` triggered `router.push('/login?callbackUrl=<window.location.href>')`, which:

- created a self-referential URL (`/login?callbackUrl=/apps/template/login`),
- overwrote any legitimate `callbackUrl` set by middleware (e.g. `/dashboard`) with `/login`, so post-sign-in always landed on `/` regardless of intended target.

The watcher now strips the configured `NEXT_PUBLIC_BASE_PATH` from `window.location.pathname` and skips the push when the path matches the auth chrome routes (`/login*`, `/logout*`). Genuine session-expiry on protected routes still triggers the push as before.
