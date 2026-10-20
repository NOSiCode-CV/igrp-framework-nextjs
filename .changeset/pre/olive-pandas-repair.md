---
"@igrp/igrp-framework-react-design-system": patch
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
---

Fix the Babel build and a batch of design-system component defects found in review.

**Build pipeline (affects all three React packages)**

- Pin the Babel toolchain back to 7.x. `babel-plugin-react-compiler` is built against
  the Babel 7 AST; under `@babel/core` 8 its HIR lowering fails on every destructured
  parameter carrying a default value, and the compiler swallows those errors per
  function and emits the original code. The build stayed green while memoization
  silently disappeared — 443 bailouts across 71 design-system files, with only 67 of
  184 emitted modules keeping a memo cache. Now 8 bailouts across 6 files (genuine
  per-component limitations) and 110 memoized modules.
- Bump `babel-plugin-react-compiler` to the 1.0.0 stable release.
- Pin `development: false` on `@babel/preset-react`. On 8 the flag follows
  `api.env()`, and the build scripts set no `NODE_ENV`, so every package emitted
  `react/jsx-dev-runtime` imports in place of `react/jsx-runtime`.
- Drop the unused `@babel/preset-env` / `@types/babel__preset-env` dev dependencies;
  the shared config deliberately never used them.
- Add `src/build-pipeline.test.ts`, which asserts on emitted output so neither
  failure can recur unnoticed.

**Packaging**

- Move `shadcn` from `dependencies` to `devDependencies`. It is an authoring-time
  CLI that nothing under `src/` imports, and every consuming app was installing it.
- Pin `cn` and `radix-ui` to exact versions, matching their neighbours.

**i18n**

- Add `formList`, `inputFile` and `copyTo` string groups, plus `chat.errorMessage`
  and four `dataTable` filter placeholders. `IGRPFormList`, `IGRPInputFile`,
  `IGRPCopyTo` and the data-table filters hardcoded Portuguese with no override path.
- Add a `locale` prop to `IGRPI18nProvider` (default `pt-PT`) with a `useIGRPLocale`
  hook and the `IGRP_DEFAULT_LOCALE` constant. `IGRPInputNumber`, the data-table date
  filter and `IGRPPdfViewer` formatted with `Intl`'s runtime-default locale, which
  resolves differently on the server and in the browser and hydrated mismatched.
- Export `igrpFormatMessage` for catalog strings with `{token}` placeholders.

**Components**

- `IGRPFormList`: the first item could not be collapsed — collapsing was
  indistinguishable from "not yet chosen", so it sprang back open. The remove button
  rendered on the last item of a list that refuses to go empty, where clicking it did
  nothing. Standalone mode keyed rows by index, so removing a row re-keyed every row
  after it and lost focus and local state inside `renderItem`. Also drops `forwardRef`
  for React 19 ref-as-prop, removing a cast and a `@ts-expect-error`.
- `IGRPInputNumber`: `className` was applied to the label as well as the root; it now
  reads the existing `labelClassName` prop. `onChange` now fires with `undefined` when
  the field is cleared — clearing was previously unobservable, and the `onChange` type
  widened to `(value: number | undefined) => void` to match. The `Intl.NumberFormat`
  instance is memoized instead of rebuilt every render, and locale separators are
  cached rather than recomputed per keystroke.
- `IGRPInputFile`: remove buttons in the dropzone all shared the accessible name
  "Remover"; they now name their file. File rows are keyed by file identity rather
  than index. `maxSize={0}` / `maxFiles={0}` rendered a literal `0`. The dropzone's
  file list now clears on `form.reset()`.
- `IGRPChat`: a rejected `fetch` escaped as an unhandled rejection and left the
  composer disabled permanently; every exit path now clears the loading state. The
  user avatar icon uses `text-primary-foreground` against its `bg-primary` backdrop.
- `IGRPTextList`: the staggered reveal leaked one `setTimeout` per item, firing after
  unmount and landing stale indices on a changed list.
- `IGRPIcon`: an unknown icon name no longer warns during render, and the fallback
  glyph keeps the caller's `size`, `className` and `id` instead of collapsing layout.
- `IGRPStatsCard`: `{...props}` was spread before the interactive handlers, so a
  caller's `onClick` was silently discarded.
- Data-table date filter: controlled open state instead of remounting the whole
  popover via `key` to close it.
- Add `"use client"` to `primitives/carousel`, `primitives/form`, `primitives/sidebar`
  and `theme-provider`, which upstream shadcn ships with it.

**Lint**

`pnpm lint` was failing on two upstream shadcn files. The rules they don't satisfy are
now scoped off in `eslint.config.js` rather than the files being edited, which would
create permanent drift on every shadcn release.
