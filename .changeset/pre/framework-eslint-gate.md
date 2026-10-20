---
"@igrp/framework-next-auth": patch
"@igrp/framework-next-ui": patch
---

- Framework packages now have ESLint (`pnpm lint`), and `release` runs it. Internal cleanups from the first run, no behaviour change.
- next-ui: the mode switcher, command search, menus and layout retry no longer call `setState` inside effects (`useSyncExternalStore` for hydration-only values, render-time state adjustment for prop changes), saving a render on mount and on navigation.
