---
'@igrp/template-migrator': patch
---

Add migration 40 — `40-review-hardening`, plus the dependency resync the drift
gate was failing on (9 pins had moved in the workspace with no migration
capturing them).

From a full review of `templates/demo-v1`. Nine files change; the only runtime
behaviour that moves is the `X-XSS-Protection` value and the number of times the
config is built per request.

- **`.env.example`** — `IGRP_SESSION_REFETCH_INTERVAL` removed. Migration 19
  already removed it; migration 35 brought it back with a doc block asserting a
  hard 60s ceiling. **Nothing reads it.** `get-session-args.ts` returns a
  hardcoded 600s backstop, and the only reader anywhere is a warn-only check in
  `@igrp/framework-next-auth`. So the guard inspected the documented `45`,
  passed, and stayed silent while the value that actually reached
  `SessionProvider` was `600` — ten times past the ceiling it existed to
  enforce. A replacement note records that the absence of the knob is
  deliberate. The 600s backstop itself is correct: `IGRPSessionWatcher` drives
  the real refresh from `session.expiresAt`.
- **`src/lib/config/get-routes.ts`** — the silent-empty path is now loud. A
  failed read or a failed regex parse of `.next/types/routes.d.ts` used to yield
  `appRoutes: []`, which meant Access Management's resource/route sync silently
  registered nothing. Read failure and parse failure now report separately and
  name the consequence; a match that extracts zero routes is treated as a
  failure rather than as "no routes"; and the miss is cached, so a broken parse
  logs once instead of re-reading the file on every render.
- **`src/igrp.template.config.ts`** — `createConfig` is wrapped in `cache()`.
  Both the root layout and the `(igrp)` layout call it, so `igrpBuildConfig`,
  `getRoutes()` (a synchronous file read), `getPermissions()` and
  `getSessionArgs()` all ran twice per request and produced two distinct config
  objects for one render.
- **`src/middleware.ts`** — `X-XSS-Protection: 0` (the legacy auditor is gone
  from current browsers and has itself been an XSS vector; explicit disable is
  current guidance). The dotted-path branch in `isPublicPath` gains a comment
  noting it is dead under the stock matcher and is **not** the auth boundary for
  dotted page routes — `(igrp)/layout.tsx`'s `verifySession()` is.
- **`tsconfig.json`** — `noEmit: true`, `composite` dropped. The old pair meant a
  bare `tsc -p .` scattered compiled `.js` through `src/`.
- **`src/app/(igrp)/page.tsx`** — states its permission decision, as
  `.agents/rules/permissions.md` requires. (The other pages that gained the same
  comment are demo scaffolding outside migration management and reach consumers
  through the zip only.)
- **`src/app/(auth)/login/page.tsx`** — drops a duplicated `hidden` and a
  redundant `lg:block`; rendering is unchanged.
- **`src/lib/header-search.ts`** — reformatted to Biome's width. It and
  `igrp.template.config.ts` were the template's only two CRLF files, so
  `biome check --write` (part of `pnpm build`) rewrote them on every build. A
  repo-root `.gitattributes` now pins the tree to LF.
- **`cn` now comes from the design system** — the template's own `cn`
  dependency (at `^0.3.0`, the only caret range in the manifest) is removed.
  `src/lib/fonts.ts` drops `cn` entirely: it joins four `next/font` CSS-variable
  class names, opaque generated identifiers with no Tailwind utility among them,
  so there is nothing for tailwind-merge to resolve. `login/page.tsx` genuinely
  needs merging and takes the design system's new server-safe
  `…/cn` subpath. Both call sites are server-side, and importing `cn` from the DS
  **root** there fails the build — the root is a `"use client"` boundary. The
  failure is invisible to `tsc` and to Biome; only a real `next build` shows it,
  during page-data collection, blamed on an unrelated route.

## New step types: `deps.remove` and `deps.restore`

Dropping the `cn` dependency exposed a gap: the migrator could add and update
dependency ranges but **never remove one**. A removal therefore reached
scaffolded apps through the zip and never reached upgraded ones — the two
channels diverging, which is precisely what `check:drift` exists to catch, and it
did.

- `deps.remove` takes `manifest` + `deps`, and captures each dependency's field
  (`dependencies` vs `devDependencies`) alongside its range.
- `deps.restore` is the generated inverse. `deps.bump` could not serve as one: it
  only updates a dependency that is already declared and will not re-add a
  removed one. Carrying the original field matters — restoring a devDependency
  into `dependencies` would change what a production install pulls down.
- A dep that is already absent warns rather than throwing, so a catch-up
  migration re-applied over an already-current tree does not abort.
- `check:drift` now treats a later `deps.remove` as retiring an earlier
  `deps.bump`, the same collapse-to-final-state rule its file checks already use.

Verified end to end against a scratch copy reverted to the pre-40 state: all 9
writes plus `deps.bump` and `deps.remove` reproduce the live template exactly and
drop `cn` while leaving its neighbours intact; `rollback` then restores
`cn: ^0.3.0` to `dependencies`, the field and range it came from.
