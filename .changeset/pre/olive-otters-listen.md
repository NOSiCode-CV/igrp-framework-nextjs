---
"@igrp/igrp-framework-react-design-system": patch
---

Rework the `Carousel` primitive's can-scroll state as an external store subscription instead of an effect.

The previous shape (inherited from upstream shadcn) kept `canScrollPrev` / `canScrollNext` in `useState` and seeded them by calling the `select` handler synchronously inside the subscribing effect. That trips React's `set-state-in-effect` rule — a synchronous `setState` in an effect body forces a second render pass on every mount and on every embla re-init. Its cleanup also only detached `select`, leaving a stale `reInit` handler attached each time the effect re-ran.

Both values now come from `useSyncExternalStore`, subscribed to embla's `reInit` and `select` events, reading `api.canScrollPrev()` / `api.canScrollNext()` as the snapshot and `false` as the server snapshot. The initial value is read during render rather than patched in afterwards, there is no cascading render, and both events are detached on unsubscribe.

This deviates from upstream shadcn, which still has the effect-based version — `pnpm drift:shadcn` will report `carousel` as changed on the next sync. Keep the local version.
