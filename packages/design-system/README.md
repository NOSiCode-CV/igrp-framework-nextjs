# @igrp/igrp-framework-react-design-system

IGRP Design System — React components built on Radix UI, Tailwind CSS v4, and Lucide icons for Next.js applications.

## Requirements

- **Node.js** ≥ 22.x
- **React** ^19.0.0
- **Next.js** ^15.0.0
- **Tailwind CSS** v4

---

## Usage

### Installation

```bash
pnpm add @igrp/igrp-framework-react-design-system
```

Install the peer dependencies too (ranges from `peerDependencies`):

```bash
pnpm add react@^19 react-dom@^19 next@^15 react-hook-form@^7 zod@^4 date-fns@^4 \
  @tanstack/react-table@^8 recharts@^3 lucide-react@^0.577.0
```

The CSS setup below also imports `tailwindcss` (v4) and `tw-animate-css`, so the app needs those as well.

### CSS Setup

The design system uses Tailwind v4 and CSS variables (tokens). Configure your app to:

1. **Import tokens only** — do not import prebuilt `styles.css` from the package.
2. **Use `@source`** so Tailwind scans the design system and generates utilities.

In your main CSS file (e.g. `src/styles/globals.css`):

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* Scan your app and the design system dist */
@source "../**/*.{ts,tsx,js,jsx}";
@source "../../node_modules/@igrp/igrp-framework-react-design-system/dist/**/*.{js,jsx,ts,tsx,mjs,cjs}";

/* Import tokens (CSS variables) */
@import "@igrp/igrp-framework-react-design-system/tokens";

/* Optional: your theme overrides */
@import "./themes.css";
```

### Importing Components

```tsx
import {
  IGRPButton,
  IGRPCard,
  IGRPInputText,
  IGRPToaster,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system"
```

### Package Exports

| Export                                               | Description                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@igrp/igrp-framework-react-design-system`           | Main entry — components, hooks, utilities                                                         |
| `@igrp/igrp-framework-react-design-system/cn`        | Server-safe `cn` — a single module, loads nothing else from the package; use it in server code    |
| `@igrp/igrp-framework-react-design-system/rich-text` | `IGRPRichTextEditor`, `IGRPRichTextView` (+ types) — kept out of the main entry so TipTap is only bundled when imported |
| `@igrp/igrp-framework-react-design-system/tokens`    | CSS variables (theme tokens)                                                                      |

### Component Categories

- **Horizon** — High-level components (`IGRPButton`, `IGRPCard`, `IGRPForm`, etc.)
- **Primitives** — Low-level building blocks (`Button`, `Dialog`, etc.)
- **Custom** — Domain-specific components (`IGRPStatusBanner`, `IGRPUserAvatar`, etc.)

### Primitives vs Horizon

| Aspect               | Primitives (unprefixed: `Button`, `Input`, …)                                | Horizon                                                                              |
| -------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Purpose**          | Low-level building blocks; minimal styling, maximum flexibility              | High-level, opinionated components for common IGRP patterns                          |
| **Built on**         | Radix UI primitives, CVA variants                                            | Primitives (they wrap primitives)                                                    |
| **Props**            | Standard HTML/React props + variant props (`variant`, `size`, `asChild`)     | IGRP-specific props (`label`, `helperText`, `showIcon`, `iconName`, `loading`, etc.) |
| **Form integration** | Manual — shadcn-style `Form`/`FormField`/`FormControl` wiring you compose     | Integrates with `IGRPFormField` and `react-hook-form`                                |
| **Use when**         | You need full control, custom composition, or are building your own patterns | You want ready-made forms, buttons with icons/loading, labeled inputs, etc.          |

**Primitives** are thin wrappers: they handle accessibility (Radix), apply base styles via Tailwind, and expose variants. Use them when you want to compose your own UI or need behavior without IGRP conventions.

**Horizon** components add IGRP conventions: labels, helper text, icons, loading states, form binding, and `name`/`id` handling. They are the default choice for standard app UI.

**Example — Button:**

```tsx
// Primitive: just a styled button, you control everything
<Button variant="outline" size="sm">Click</Button>

// Horizon: adds icons, loading state, IGRP attributes
<IGRPButton showIcon iconName="ArrowRight" loading={isSubmitting} loadingText="Saving...">
  Save
</IGRPButton>
```

**Example — Input:**

```tsx
// Primitive: raw input, no label or form wiring
<Input placeholder="Enter value" />

// Horizon: label, helper text, icon, form integration, error display
<IGRPInputText
  name="email"
  label="Email"
  helperText="We'll never share your email"
  showIcon
  iconName="Mail"
/>
```

---

## Theming

The design system uses CSS custom properties for theming. Tokens are defined in `:root` and `.dark`.

### Core Tokens

| Token                                     | Purpose                     |
| ----------------------------------------- | --------------------------- |
| `--background`, `--foreground`            | Page background and text    |
| `--primary`, `--primary-foreground`       | Primary actions and text    |
| `--secondary`, `--secondary-foreground`   | Secondary elements          |
| `--muted`, `--muted-foreground`           | Muted backgrounds and text  |
| `--accent`, `--accent-foreground`         | Accent/hover states         |
| `--destructive`                           | Destructive actions         |
| `--border`, `--input`, `--ring`           | Borders, inputs, focus ring |
| `--radius`                                | Base border radius          |
| `--sidebar-*`                             | Sidebar-specific tokens     |
| `--chart-1` … `--chart-8`                 | Chart colors                |
| `--process-completed`, `--process-active` | Stepper/process states      |

### Dark Mode

Dark mode is controlled by the `.dark` class on a parent element (e.g. `<html>`). Use `next-themes` for automatic switching:

```tsx
import { ThemeProvider } from "next-themes"
;<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

### Custom Themes

Override tokens in your own CSS (e.g. `themes.css`), loaded **after** the tokens import:

```css
/* Custom primary color */
:root {
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
}

.dark {
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
}

/* Theme variants (e.g. blue, green) */
.theme-blue {
  --primary: var(--color-blue-600);
  --primary-foreground: var(--color-blue-50);
}

.theme-blue.dark {
  --primary: var(--color-blue-400);
  --primary-foreground: var(--color-blue-50);
}
```

### Meta Theme Color

For browser chrome (e.g. mobile address bar), use the provided hook:

```tsx
"use client"

import { useEffect } from "react"
import { useIGRPMetaColor } from "@igrp/igrp-framework-react-design-system"

// In a client component under ThemeProvider
const { metaColor, setMetaColor } = useIGRPMetaColor() // metaColor follows the resolved theme
useEffect(() => {
  setMetaColor(metaColor) // writes <meta name="theme-color">
}, [metaColor, setMetaColor])
```

The hook does not touch the DOM on its own — call `setMetaColor`. `IGRP_META_THEME_COLORS` (`{ light, dark }`) is also exported for server-side use, e.g. Next.js `viewport.themeColor`.

---

## Migration Notes

### Tailwind v4 & Token-Only Imports

If you previously imported prebuilt styles:

**Before:**

```css
@import "@igrp/igrp-framework-react-design-system/styles.css";
```

**After:**

1. Add `@source` entries so your app compiles Tailwind and scans the design system:

   ```css
   @source "../../node_modules/@igrp/igrp-framework-react-design-system/dist/**/*.{js,jsx,ts,tsx,mjs,cjs}";
   ```

2. Import tokens only:

   ```css
   @import "@igrp/igrp-framework-react-design-system/tokens";
   ```

3. Remove imports of `@igrp/*/styles.css` to avoid cascade conflicts and missing utilities.

### Removed Components

| Removed        | Migration                                                                |
| -------------- | ------------------------------------------------------------------------ |
| `IGRPCalendar` | Use `IGRPCalendarSingle`, `IGRPCalendarRange`, or `IGRPCalendarMultiple` |

`IGRPDatePicker` is **not** deprecated: it is a wrapper that renders `IGRPDatePickerSingle` or `IGRPDatePickerRange` based on `mode="single" | "range"`. For multiple dates use `IGRPDatePickerMultiple` directly.

---

## Visual & Regression Testing

Visual and regression tests live in `@igrp/igrp-framework-react-design-system-storybook`:

- **Storybook** — Component documentation and isolated development
- **Snapshot tests** — HTML snapshots via `@storybook/test-runner` (Playwright)
- **Vitest** — Interaction tests and a11y checks
- **Chromatic** — Optional cloud-based pixel-perfect visual regression

From the monorepo root:

```bash
cd packages/design-system-storybook
pnpm storybook          # Start Storybook
pnpm test-storybook     # Run snapshot regression tests (Storybook must be running)
pnpm test:vitest        # Run interaction tests
pnpm chromatic          # Chromatic visual regression (requires CHROMATIC_PROJECT_TOKEN)
```

See [packages/design-system-storybook/README.md](../design-system-storybook/README.md) for full testing documentation.

---

## Development

```bash
# Build (Babel + React Compiler, then tsc declarations)
pnpm build

# Watch mode — plain `tsc --watch`; output skips the Babel/React Compiler pass, so run `pnpm build` before shipping
pnpm dev

# Build without the React Compiler (escape hatch when the compiler misbehaves)
pnpm build:without_reactcompiler

# Unit tests
pnpm test

# Type-check, lint, format
pnpm typecheck
pnpm lint            # pnpm lint:fix to autofix
pnpm format          # pnpm format:check to verify only

# Release: format → lint → typecheck → test → build → publish (Sonatype, --tag latest)
pnpm release

# Check primitives for drift from upstream shadcn (periodic maintenance, hits network)
pnpm drift:shadcn
pnpm drift:shadcn:update   # accept current upstream as the new baseline, after review
```

### Build pipeline

There is no bundler. `build:js` runs Babel once over `src/` (strips TypeScript, transforms JSX, applies the React Compiler) and writes untouched ESM, one file per module, with `"use client"` directives preserved. `src/*.css` (`tokens.css`) is copied to `dist/` verbatim. `build:types` then emits declarations with `tsc --emitDeclarationOnly`, and `check:dist` validates the output. Consumers use `dist/` directly, which keeps client boundaries, `optimizePackageImports` and Tailwind `@source` scanning working.

### Shadcn drift checker

`scripts/check-shadcn-drift.mjs` reports drift between local primitives in `src/components/primitives/` and upstream shadcn. It is intended for periodic (~quarterly) maintenance — it hits the network, is slow, and is **not** wired into CI. Each primitive may carry a `// shadcn: YYYY-MM-DD` first-line stamp recording the last upstream sync. Exit code 1 if any primitive has drifted.

---

## License

MIT © IGRP Labs
