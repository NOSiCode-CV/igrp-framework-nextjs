# @igrp/framework-next

Server-side entry point for the IGRP Framework — root and route-group layouts, the config builder, and the access-management API client.

## Requirements

- **Node.js** ≥ 20.x
- **Next.js** ^15.5.15
- **React** ^19.2.5 + **react-dom** ^19.2.5

---

## Installation

```bash
pnpm add @igrp/framework-next
```

---

## What's exported

### Layouts

| Export              | Entry | Purpose                                                                             |
| ------------------- | ----- | ----------------------------------------------------------------------------------- |
| `IGRPRootLayout`    | `.`   | Root-level server layout. Wraps `<html>` with theme + global providers.             |
| `IGRPLayout`        | `.`   | Route-group server layout. Renders header + sidebar chrome around protected routes. |
| `IGRPGlobalLoading` | `.`   | Full-page loading indicator for `loading.tsx` files.                                |

### Config builder

| Export            | Entry | Purpose                                                                                           |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------- |
| `igrpBuildConfig` | `.`   | Assembles the full IGRP config: layout, API client, toaster, session. Honors `IGRP_PREVIEW_MODE`. |

### Access-management API client

| Export                      | Entry | Purpose                                                                           |
| --------------------------- | ----- | --------------------------------------------------------------------------------- |
| `igrpGetAccessClient`       | `.`   | Returns a pre-configured typed API client for the IGRP Access Management service. |
| `igrpGetAccessClientConfig` | `.`   | Returns the raw config object used to construct the client.                       |
| `igrpBuildQueryString`      | `.`   | Type-safe query-string builder for access-management requests.                    |

### Auth helpers

| Export                  | Entry | Purpose                                    |
| ----------------------- | ----- | ------------------------------------------ |
| `igrpDeleteAuthCookies` | `.`   | Clears NextAuth session cookies on logout. |

### Typed errors

| Export                                               | Entry      | Purpose                                                |
| ---------------------------------------------------- | ---------- | ------------------------------------------------------ |
| `IGRPError`, `IGRPAuthError`, `IGRPNotFoundError`, … | `./errors` | Typed error hierarchy for App Router error boundaries. |

---

## Usage

### Root layout

```tsx
// src/app/layout.tsx
import { IGRPRootLayout } from '@igrp/framework-next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <IGRPRootLayout>{children}</IGRPRootLayout>;
}
```

### IGRP layout

```tsx
// src/app/(igrp)/layout.tsx
import { IGRPLayout } from '@igrp/framework-next';
import { getConfig } from '@/igrp.template.config';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const config = await getConfig();
  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
```

### Config builder

```ts
// src/igrp.template.config.ts
import { igrpBuildConfig } from '@igrp/framework-next';
import { cache } from 'react';

export const getConfig = cache(async () => {
  return igrpBuildConfig({
    appCode: process.env.IGRP_APP_CODE!,
    previewMode: process.env.IGRP_PREVIEW_MODE === 'true',
    // layoutMockData, apiManagementConfig, toasterConfig, sessionArgs ...
  });
});
```

When `previewMode` is `true`, `igrpBuildConfig` swaps in mock layout data and disables session refetch — no auth or API backend needed.

### Typed errors

```ts
// src/app/(igrp)/error.tsx
import { IGRPAuthError } from '@igrp/framework-next/errors';

export function onError(error: unknown) {
  if (error instanceof IGRPAuthError) {
    // redirect to login
  }
}
```

---

## Preview mode

Set `IGRP_PREVIEW_MODE=true` to run the template without authentication or an API backend. Mock data replaces live API calls; no redirects to `/login`.

See [`IGRP_PREVIEW_MODE` docs](../../../.claude/shared/preview-mode.md) in the monorepo.

---

## Build

```bash
# From repo root
pnpm build:next

# From package directory
pnpm build
```

Built with **SWC + Babel** (React Compiler pass). Escape hatch: `pnpm build:without_reactcompiler`.

---

## Position in the framework

This is the **top** of the dependency chain — it depends on all other framework packages but no other framework package depends on it:

```
framework-next-auth → framework-next-types → design-system → framework-next-ui → framework-next
```

Changes here affect only templates and apps, not other framework packages.

---

## License

MIT © IGRP Labs
