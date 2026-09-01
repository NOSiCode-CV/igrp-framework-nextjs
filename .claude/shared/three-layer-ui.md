# Three-layer UI model (design system)

| Layer | Prefix | When to use |
| --- | --- | --- |
| **Horizon** | `IGRP*` | Default for all app UI. Opinionated — built-in labels, icons, loading, `IGRPForm` integration. |
| **Primitives** | unprefixed shadcn-style (`Button`, `Card`, `Input`) | Custom composition / full control. Thin Radix + CVA wrappers, no IGRP conventions. |
| **Custom** | `IGRP*` (e.g. `IGRPStatsCard`, `IGRPUserAvatar`) | Domain-specific, built on Horizon. |

- **Horizon is always first choice.** Drop to Primitives only when Horizon is too opinionated. Don't mix layers in one component without a reason.
- Everything from `@igrp/igrp-framework-react-design-system` is **client-side** — any file importing from it needs `'use client'`.
