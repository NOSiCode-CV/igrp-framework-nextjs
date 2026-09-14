---
"@igrp/igrp-framework-react-design-system": patch
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
---

Fix the React Compiler build pass and stop shipping test files in `dist`.

The Babel/React Compiler step gated on a literal `'use client'` (single-quoted)
substring. `design-system` formats with Prettier `singleQuote: false`, so its SWC
output emits `"use client"` and the gate matched nothing — the compiler was a
silent no-op across the entire package while the build still exited 0. The check
is now quote-agnostic, and 20 design-system modules are memoized again.

The companion skip rule tested substrings (`context`, `provider`, `index`, ...)
against the whole file *path*, excluding every `index.js` barrel and every file
under a `providers/` directory regardless of content. It now tests the file
contents for `createContext`, matching the original intent; `"use no memo"`
remains the per-file opt-out.

Also: `build:swc` and the declaration build now exclude `__tests__` and
`*.test.*`, so compiled tests and their `.d.ts` no longer ship in the published
tarballs.
