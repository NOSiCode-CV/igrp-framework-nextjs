# @igrp/igrp-framework-react-design-system

IGRP Design System — React components built on Radix UI, Tailwind CSS v4, and Lucide icons for Next.js applications.

## Requirements

- **Node.js** ≥ 20.x
- **React** ^19.2.4
- **Next.js** ^15.5.12
- **Tailwind CSS** v4

---

## Usage

### Installation

```bash
pnpm add @igrp/igrp-framework-react-design-system
```

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

| Export | Description |
| ------ | ----------- |

| `@igrp/igrp-framework-react-design-system` | Main entry — components, hooks, utilities |
| `@igrp/igrp-framework-react-design-system/tokens` | CSS variables (theme tokens) |
| `@igrp/igrp-framework-react-design-system/styles` | Full styles (Tailwind + base) — use only when not compiling Tailwind in your app |

### Component Categories

- **Horizon** — High-level components (`IGRPButton`, `IGRPCard`, `IGRPForm`, etc.)
- **Primitives** — Low-level building blocks (`IGRPButtonPrimitive`, `IGRPDialogPrimitive`, etc.)
- **Custom** — Domain-specific components (`IGRPStatusBanner`, `IGRPUserAvatar`, etc.)

### Primitives vs Horizon

| Aspect | Primitives (`*Primitive`) | Horizon |
| ------ | ------------------------- | ------- |

| **Purpose** | Low-level building blocks; minimal styling, maximum flexibility | High-level, opinionated components for common IGRP patterns |
| **Built on** | Radix UI primitives, CVA variants | Primitives (they wrap primitives) |
| **Props** | Standard HTML/React props + variant props (`variant`, `size`, `asChild`) | IGRP-specific props (`label`, `helperText`, `showIcon`, `iconName`, `loading`, etc.) |
| **Form integration** | None | Integrates with `IGRPFormField` and `react-hook-form` |
| **Use when** | You need full control, custom composition, or are building your own patterns | You want ready-made forms, buttons with icons/loading, labeled inputs, etc. |

**Primitives** are thin wrappers: they handle accessibility (Radix), apply base styles via Tailwind, and expose variants. Use them when you want to compose your own UI or need behavior without IGRP conventions.

**Horizon** components add IGRP conventions: labels, helper text, icons, loading states, form binding, and `name`/`id` handling. They are the default choice for standard app UI.

**Example — Button:**

```tsx
// Primitive: just a styled button, you control everything
<IGRPButtonPrimitive variant="outline" size="sm">Click</IGRPButtonPrimitive>

// Horizon: adds icons, loading state, IGRP attributes
<IGRPButton showIcon iconName="ArrowRight" loading={isSubmitting} loadingText="Saving...">
  Save
</IGRPButton>
```

**Example — Input:**

```tsx
// Primitive: raw input, no label or form wiring
<IGRPInputPrimitive placeholder="Enter value" />

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

| Token | Purpose |
| ----- | ------- |

| `--background`, `--foreground` | Page background and text |
| `--primary`, `--primary-foreground` | Primary actions and text |
| `--secondary`, `--secondary-foreground` | Secondary elements |
| `--muted`, `--muted-foreground` | Muted backgrounds and text |
| `--accent`, `--accent-foreground` | Accent/hover states |
| `--destructive` | Destructive actions |
| `--border`, `--input`, `--ring` | Borders, inputs, focus ring |
| `--radius` | Base border radius |
| `--sidebar-*` | Sidebar-specific tokens |
| `--chart-1` … `--chart-5` | Chart colors |
| `--process-completed`, `--process-active` | Stepper/process states |

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
import { IGRP_META_THEME_COLORS, useIGRPMetaColor } from "@igrp/igrp-framework-react-design-system"

// In layout or root component
useIGRPMetaColor() // Syncs theme-color meta tag with current theme
```

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

### Deprecated Components

| Deprecated       | Migration                                                                      |
| ---------------- | ------------------------------------------------------------------------------ |
| `IGRPCalendar`   | Use `IGRPCalendarSingle`, `IGRPCalendarRange`, or `IGRPCalendarMultiple`       |
| `IGRPDatePicker` | Use `IGRPDatePickerSingle`, `IGRPDatePickerRange`, or `IGRPDatePickerMultiple` |

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
# Build
pnpm build

# Watch mode
pnpm dev
```

---

## License

MIT © IGRP Labs
