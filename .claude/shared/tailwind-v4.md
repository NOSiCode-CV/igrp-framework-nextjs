# Tailwind v4 + design tokens

Templates compile Tailwind **once in the app**, not in the framework packages. Two things must be correct:

1. `@source` in the app's `globals.css` must point at both the app source and the compiled `dist/` of the IGRP packages, so Tailwind generates utilities used inside the DS.
2. Import **tokens only** from the design system — never the prebuilt `styles.css`:
   ```css
   @import "@igrp/igrp-framework-react-design-system/tokens";
   ```
   `@igrp/*/styles.css` causes cascade conflicts and missing utilities. The DS `package.json` still exposes `/styles` for legacy consumers, but templates in this repo must not use it.

- Dark mode is the `.dark` class on a parent, driven by `next-themes`.
- Theme variants (`theme-blue`, etc.) override tokens in `src/styles/themes.css`, which must be imported **after** the tokens import.
