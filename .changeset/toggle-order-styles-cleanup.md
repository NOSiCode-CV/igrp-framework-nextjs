---
"@igrp/framework-next-ui": patch
---

- Reorder sidebar header: `SidebarTrigger` is now first in DOM; in collapsed mode it leads before the app switcher, in expanded mode it stays right-aligned via CSS flex order
- Remove prebuilt Tailwind CSS bundle (`styles.css`, `./styles` export, `tailwind:build` script, `@tailwindcss/cli` dep) — Tailwind is compiled once in the consuming app
- Build pipeline: replace `move` with `move-cli`, drop `tailwind:build` step, bump required Node to ≥22
