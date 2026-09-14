---
"@igrp/igrp-framework-react-design-system": patch
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
---

Build with a single Babel pass over `src/`, and fix the React Compiler gate.

**The bug.** The React Compiler step gated on a literal `'use client'`
(single-quoted) substring. `design-system` formats with Prettier
`singleQuote: false`, so its output emits `"use client"` and the gate matched
nothing — the compiler was a silent no-op across the entire package while the
build still exited 0. The check is now quote-agnostic.

**The cause.** The compiler ran as a second Babel pass over `dist/`, so it was
analysing generated output rather than the code as written — which is both why
the bug was invisible and why coverage was poor even where the gate did match.
SWC, `.swcrc`, `dist_optimized` and `swap-dist.mjs` are gone; `build:js` now
runs Babel once over `src/` (TypeScript strip, JSX, React Compiler) and
`build:types` emits declarations. Output is unchanged in shape — file-per-module
ESM at esnext, no bundling, no minification, no `@babel/preset-env` — because
`templates/demo-v1` consumes `dist/` directly.

Verified identical across all three packages: same emitted file list, same
`use client` / `use server` boundaries (zero lost). Memoized modules rose from
22 to 69 in `design-system` and 11 to 24 in `framework-next-ui`.

**Also.** The compiler's skip rule tested substrings (`context`, `provider`,
`index`, ...) against the whole file *path*, excluding every barrel and
everything under a `providers/` directory regardless of content; it now tests
the contents for `createContext`. `"use no memo"` remains the per-file opt-out.
Compiled tests and their `.d.ts` no longer ship in the published tarballs.
