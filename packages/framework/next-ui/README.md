# @igrp/framework-next-ui

Client-side UI shell for the IGRP Framework — the header, sidebar, navigation, auth carousel, providers, and other chrome that wraps every IGRP application.

## Requirements

- **Node.js** ≥ 20.x
- **Next.js** ^15.5.15
- **React** ^19.2.5 + **react-dom** ^19.2.5
- **next-auth** ^4.24.14

---

## Installation

```bash
pnpm add @igrp/framework-next-ui
```

---

## What's included

### Providers

| Export                | Purpose                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| `IGRPRootProviders`   | Top-level provider tree (theme, session, toast, tooltip, command) — goes in root layout |
| `IGRPSessionProvider` | NextAuth `SessionProvider` wrapper                                                      |
| `NestedProviders`     | Inner providers for the IGRP route group layout                                         |
| `ActiveThemeProvider` | Syncs the active CSS theme class with next-themes                                       |

### Template chrome

| Export              | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `IGRPHeader`        | Application header (logo, nav, user menu, notifications) |
| `IGRPSidebar`       | Collapsible application sidebar                          |
| `IGRPMenus`         | Menu tree renderer                                       |
| `IGRPNavUser`       | User avatar + dropdown in nav                            |
| `IGRPBreadcrumbs`   | Route-aware breadcrumb trail                             |
| `IGRPCommandSearch` | `⌘K` command palette                                     |
| `IGRPThemeSelector` | Light/dark/system theme switcher                         |
| `IGRPModeToggle`    | Compact light/dark toggle                                |

### Auth components

| Export             | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `IGRPAuthCarousel` | Full-screen auth carousel (login page wrapper) |
| `IGRPAuthForm`     | Login form with OAuth2 provider support        |

### Error boundaries

| Export             | Purpose                                |
| ------------------ | -------------------------------------- |
| `IGRPGlobalError`  | Root-level error boundary component    |
| `IGRPSegmentError` | Route-segment error boundary component |

---

## Usage

### Root layout

```tsx
// src/app/layout.tsx
import { IGRPRootProviders } from '@igrp/framework-next-ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <IGRPRootProviders>{children}</IGRPRootProviders>
      </body>
    </html>
  );
}
```

### IGRP route group layout

```tsx
// src/app/(igrp)/layout.tsx
'use client';
import { IGRPHeader, IGRPSidebar, NestedProviders } from '@igrp/framework-next-ui';

export default function IGRPLayout({ children }: { children: React.ReactNode }) {
  return (
    <NestedProviders>
      <IGRPSidebar />
      <div>
        <IGRPHeader />
        <main>{children}</main>
      </div>
    </NestedProviders>
  );
}
```

All files importing from this package need `'use client'` — every export is a client component.

---

## Build

```bash
# From repo root
pnpm build:next-ui

# From package directory
pnpm build
```

Built with **SWC + Babel** (React Compiler pass) + a Tailwind CSS prebuild step. Escape hatch when the React Compiler misbehaves: `pnpm build:without_reactcompiler`.

---

## CSS

This package ships its own compiled CSS. Consumers should import **tokens only**:

```css
@import '@igrp/framework-next-ui/tokens';
```

Do not import `@igrp/framework-next-ui/styles` in templates that compile Tailwind themselves — it causes cascade conflicts.

---

## License

MIT © IGRP Labs
