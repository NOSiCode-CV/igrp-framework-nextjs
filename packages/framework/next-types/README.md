# @igrp/framework-next-types

Shared TypeScript types for the IGRP Framework — no runtime code, no bundle cost.

## Requirements

- **Node.js** ≥ 20.x
- **next-auth** ^4.24.14 (peer)

---

## Installation

```bash
pnpm add @igrp/framework-next-types
```

---

## What's exported

| Category              | Types                                                              |
| --------------------- | ------------------------------------------------------------------ |
| **Access management** | Permission, resource, and role types used by `igrpGetAccessClient` |
| **Globals**           | Shared IGRP config types                                           |
| **Header**            | `IGRPHeaderConfig`, nav-user and notification shapes               |
| **IGRP config**       | `IGRPConfig`, layout config input/output shapes                    |
| **Sidebar**           | `IGRPSidebarConfig`, menu item trees                               |

Session and JWT types are re-exported from `@igrp/framework-next-auth/types`.

---

## Usage

```ts
import type { IGRPConfig, IGRPSidebarConfig } from '@igrp/framework-next-types';
```

---

## Build

```bash
# From repo root
pnpm build:next-types

# From package directory
pnpm build
```

Built with plain **`tsc -b`** — no SWC, no Babel, no tsup. Emits only `.d.ts` declaration files; there is no runtime JS to import.

---

## Dependency note

This package depends on `@igrp/framework-next-auth` for session and JWT types. It sits in the middle of the framework dependency chain:

```
framework-next-auth → framework-next-types → design-system → framework-next-ui → framework-next
```

A type change here can break every downstream package. Prefer **additive** changes; keep old type aliases for at least one release before removing them.

After any type change, run `pnpm build:framework` to catch downstream breakage.

---

## License

MIT © IGRP Labs
