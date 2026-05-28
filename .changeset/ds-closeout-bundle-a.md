---
"@igrp/igrp-framework-react-design-system": patch
---

chore(design-system): close-out Bundle A — finish /styles removal, catalogue deltas, add IGRPMenubar, harden drift script

- Remove the deprecated `/styles` export entirely: dropped from `publishConfig.exports`, the `tailwind:build` script and its build-chain invocation are gone, the generated `src/styles.css` is deleted, `@tailwindcss/cli` dropped from devDependencies. Templates import `/tokens` only and compile Tailwind in the app. README and CLAUDE.md updated to reflect the removal.
- Catalogue the four remaining IGRP-custom primitive deltas in `COMPONENTS.md` (Accordion, Form, Popover, RadioGroup) alongside the existing Button entry. Combined with Button, this is the complete intentional-divergence baseline the drift detector compares against.
- Drift detector hardening: spawn options now use `shell: process.platform === "win32"` so `npx`/`npm` shims resolve on Windows; removed the `#!/usr/bin/env node` shebang from the `.mjs` so vitest 4.1.x can import it without a parser error.
- `drift-baseline-2026-05.md`: first end-to-end run captured. The run revealed two further structural defects in the script (non-interactive `init` blocks on a prompt → no `components.json`; `hasDrift` swallows non-zero CLI exits as `ok`). No actionable baseline this cycle; the next baseline will be the first real one after those fixes land in a follow-up.
- Add `IGRPMenubar` Horizon wrapper — pure re-export of all 16 primitive `Menubar*` sub-components under `IGRP*` aliases, mirroring the `IGRPDropdownMenu` pattern. Closes the Horizon-layer Menubar gap.
