# IGRPTemplateBreadcrumbs Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `IGRPTemplateBreadcrumbs` with controlled-first architecture — accept server-resolved `items` directly, replace `usePathname()` with `useSelectedLayoutSegments()`, and thread the new props through the header and layout chain.

**Architecture:** Changes flow bottom-up through the dependency order: `framework-next-ui` first (breadcrumbs + header + index export), then `framework-next` (HeaderDataProvider + IGRPLayout prop pass-through). No changes to `framework-next-types` — new breadcrumb props go on `IGRPLayoutArgs` (a local type in `igrp-layout.tsx`), not on the config type, keeping the consuming pattern clean. Build and verify after each package.

**Tech Stack:** React 19, Next.js 15, TypeScript, `@igrp/framework-next-ui`, `@igrp/framework-next`, pnpm workspace monorepo, ESLint + Prettier (not Biome).

---

## File map

| File | Package | Action |
|------|---------|--------|
| `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx` | `framework-next-ui` | Rewrite — new props, `useSelectedLayoutSegments`, export `BreadcrumbItem` |
| `packages/framework/next-ui/src/components/templates/header.tsx` | `framework-next-ui` | Add `breadcrumbs` + `breadcrumbRouteLabels` props, forward to breadcrumb |
| `packages/framework/next-ui/src/index.ts` | `framework-next-ui` | Export `BreadcrumbItem` type |
| `packages/framework/next/src/layouts/providers/header-data-provider.tsx` | `framework-next` | Accept + forward breadcrumb props to `IGRPTemplateHeader` |
| `packages/framework/next/src/layouts/igrp-layout.tsx` | `framework-next` | Add `breadcrumbs` + `breadcrumbRouteLabels` to `IGRPLayoutArgs`, pass to `HeaderDataProvider` |

---

## Task 1: Rebuild `breadcrumbs.tsx`

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx`

This task rewrites the component internals. The DS import `BreadcrumbItem` (the component) is renamed to `BreadcrumbListItem` to avoid a type-namespace collision with the new exported `BreadcrumbItem` interface. All collapse/overflow/dropdown rendering logic is preserved verbatim.

- [ ] **Step 1: Replace the entire file with the new implementation**

```tsx
'use client';

import { Fragment, useMemo, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import {
  IGRPIcon,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem as BreadcrumbListItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  useIsMobile,
  cn,
} from '@igrp/igrp-framework-react-design-system';

/**
 * A single breadcrumb segment. Exported so server layouts can type their
 * item arrays without importing from deep paths.
 */
export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface IGRPTemplateBreadcrumbsProps {
  className?: string;
  /**
   * Pre-resolved breadcrumb items. When provided, all URL logic is skipped.
   * Pass from a server component that has access to route params and can fetch
   * data. The home item is always rendered by the component — do not include it.
   */
  items?: BreadcrumbItem[];
  /**
   * App-level route → label map. Keys are full hrefs.
   * Define once in a shared config and import the same object in generateMetadata
   * for a single source of truth between page titles and breadcrumb labels.
   *
   * @example
   * const ROUTE_LABELS = {
   *   '/settings': 'Settings',
   *   '/settings/users': 'User Management',
   * }
   */
  routeLabels?: Record<string, string>;
  /**
   * Per-instance escape hatch for segments not covered by routeLabels.
   * Return undefined to fall through to auto-formatting.
   * Wrap in useCallback to avoid triggering a recompute on every parent render.
   */
  formatLabel?: (segment: string, href: string) => string | undefined;
  /** Screen-reader label for the home icon. Defaults to 'Home' */
  homeLabel?: string;
  /** Home link destination. Defaults to '/' */
  homeHref?: string;
  /** Collapse threshold (item count). Defaults to 4 */
  maxItems?: number;
  /** Items visible after the ellipsis when collapsed. Defaults to 1 */
  itemsAfterCollapse?: number;
}

function formatSegmentLabel(segment: string): string {
  return segment
    .split(/[-_]/)
    .flatMap((part) => part.split(/(?=[A-Z])/))
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function IGRPTemplateBreadcrumbs({
  className,
  items,
  routeLabels = {},
  formatLabel,
  homeLabel = 'Home',
  homeHref = '/',
  maxItems = 4,
  itemsAfterCollapse = 1,
}: IGRPTemplateBreadcrumbsProps) {
  // Always call — hooks cannot be conditional. Ignored when items is provided.
  const segments = useSelectedLayoutSegments();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLOListElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    // Controlled mode: items provided — skip all URL logic
    if (items !== undefined) {
      return items;
    }

    // Auto-derive mode: use useSelectedLayoutSegments()
    // Filter route groups like (igrp) and parallel route slots like @slot
    const filteredSegments = segments.filter(
      (segment) => !/^\(.*\)$/.test(segment) && !segment.startsWith('@'),
    );

    if (filteredSegments.length === 0) {
      return [];
    }

    return filteredSegments.map((segment, index) => {
      const href = `/${filteredSegments.slice(0, index + 1).join('/')}`;
      const label =
        routeLabels[href] ??
        formatLabel?.(segment, href) ??
        formatSegmentLabel(segment);

      return { label, href };
    });
  }, [items, segments, routeLabels, formatLabel]);

  // Determine if we should check for overflow (only when not already collapsed)
  const shouldCheckOverflow = breadcrumbItems.length <= maxItems && !isMobile;

  // Check for overflow
  useEffect(() => {
    if (!shouldCheckOverflow) {
      setIsOverflowing(false);
      return;
    }

    const checkOverflow = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      // Add a small threshold to account for rounding differences
      const isOverflow = container.scrollWidth > container.clientWidth + 1;
      setIsOverflowing(isOverflow);
    };

    // Use requestAnimationFrame to ensure DOM is rendered
    const timeoutId = setTimeout(() => {
      checkOverflow();
    }, 0);

    // Use ResizeObserver to detect size changes
    const resizeObserver = new ResizeObserver(() => {
      if (shouldCheckOverflow) {
        checkOverflow();
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [breadcrumbItems, shouldCheckOverflow, isMobile]);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  const shouldCollapse = breadcrumbItems.length > maxItems || isMobile || isOverflowing;
  const lastItems = breadcrumbItems.slice(-itemsAfterCollapse);
  const middleItems = shouldCollapse ? breadcrumbItems.slice(0, -itemsAfterCollapse) : [];

  const renderBreadcrumbItem = (item: BreadcrumbItem, isLast: boolean, key: string) => (
    <Fragment key={key}>
      <BreadcrumbSeparator>
        <IGRPIcon iconName="ChevronRight" className={cn('h-3 w-3')} strokeWidth={2} />
      </BreadcrumbSeparator>
      <BreadcrumbListItem>
        {isLast ? (
          <BreadcrumbPage className={cn('text-xs')}>{item.label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink asChild>
            <Link href={item.href} className={cn('text-xs')}>
              {item.label}
            </Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbListItem>
    </Fragment>
  );

  return (
    <Breadcrumb className={cn('text-xs min-w-0', className)}>
      <BreadcrumbList
        ref={containerRef}
        className={cn('gap-0.5 sm:gap-0.5 text-xs overflow-hidden')}
      >
        <BreadcrumbListItem>
          <BreadcrumbLink asChild>
            <Link
              href={homeHref}
              className={cn(
                'text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors',
              )}
            >
              <IGRPIcon iconName="House" className={cn('h-3 w-3')} strokeWidth={2} />
              <span className={cn('sr-only')}>{homeLabel}</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbListItem>

        {shouldCollapse && middleItems.length > 0 ? (
          <>
            <BreadcrumbSeparator>
              <IGRPIcon iconName="ChevronRight" className={cn('h-3 w-3')} strokeWidth={2} />
            </BreadcrumbSeparator>
            <BreadcrumbListItem>
              <DropdownMenu>
                <DropdownMenuTrigger className={cn('flex items-center gap-1 focus:outline-none')}>
                  <BreadcrumbEllipsis />
                  <span className={cn('sr-only')}>Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {middleItems.map((item, index) => (
                    <DropdownMenuItem key={`${item.href}-${index}`} asChild>
                      <Link href={item.href} className={cn('flex items-center gap-2')}>
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbListItem>
            {lastItems.map((item, index) => {
              const isLast = index === lastItems.length - 1;
              return renderBreadcrumbItem(item, isLast, `collapsed-${item.href}-${index}`);
            })}
          </>
        ) : (
          breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return renderBreadcrumbItem(item, isLast, `${item.href}-${index}`);
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { IGRPTemplateBreadcrumbs, type IGRPTemplateBreadcrumbsProps };
```

- [ ] **Step 2: Verify it type-checks**

```powershell
cd D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs
pnpm exec tsc -p packages/framework/next-ui/tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add packages/framework/next-ui/src/components/templates/breadcrumbs.tsx
git commit -m "feat(next-ui): rebuild IGRPTemplateBreadcrumbs with controlled-first architecture"
```

---

## Task 2: Update `header.tsx` and `index.ts`

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/header.tsx`
- Modify: `packages/framework/next-ui/src/index.ts`

- [ ] **Step 1: Update `header.tsx`**

Open `packages/framework/next-ui/src/components/templates/header.tsx`.

**Change 1** — Import `BreadcrumbItem` from the breadcrumbs file (add to the existing import):

```tsx
import { BreadcrumbItem, IGRPTemplateBreadcrumbs } from './breadcrumbs';
```

**Change 2** — Add two props to `IGRPTemplateHeaderProps` (after `className`):

```typescript
interface IGRPTemplateHeaderProps {
  data: IGRPHeaderDataArgs;
  className?: string;
  /** Pre-resolved breadcrumb items. Forwarded to IGRPTemplateBreadcrumbs. */
  breadcrumbs?: BreadcrumbItem[];
  /** App-level route → label map. Forwarded to IGRPTemplateBreadcrumbs. */
  breadcrumbRouteLabels?: Record<string, string>;
}
```

**Change 3** — Destructure the two new props in the function signature:

```tsx
function IGRPTemplateHeader({ data, className, breadcrumbs, breadcrumbRouteLabels }: IGRPTemplateHeaderProps) {
```

**Change 4** — Replace the bare `<IGRPTemplateBreadcrumbs />` call (inside the `showBreadcrumb` block) with:

```tsx
<IGRPTemplateBreadcrumbs
  items={breadcrumbs}
  routeLabels={breadcrumbRouteLabels}
/>
```

- [ ] **Step 2: Update `index.ts`**

Open `packages/framework/next-ui/src/index.ts`. Find the breadcrumbs export block:

```ts
export {
  IGRPTemplateBreadcrumbs,
  type IGRPTemplateBreadcrumbsProps,
} from './components/templates/breadcrumbs';
```

Add `BreadcrumbItem` to it:

```ts
export {
  IGRPTemplateBreadcrumbs,
  type IGRPTemplateBreadcrumbsProps,
  type BreadcrumbItem,
} from './components/templates/breadcrumbs';
```

- [ ] **Step 3: Verify it type-checks**

```powershell
cd D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs
pnpm exec tsc -p packages/framework/next-ui/tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add packages/framework/next-ui/src/components/templates/header.tsx
git add packages/framework/next-ui/src/index.ts
git commit -m "feat(next-ui): thread breadcrumbs props through IGRPTemplateHeader; export BreadcrumbItem"
```

---

## Task 3: Build `framework-next-ui` and verify

**Files:** none — build only.

- [ ] **Step 1: Build the package**

```powershell
cd D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs
pnpm build:next-ui
```

Expected: build completes with no errors. The pipeline runs: `tailwind:build` → `build:swc` → `build:babel` (React Compiler) → `build:types`. All 29+ files compile.

If the build fails due to the React Compiler rejecting something, run the escape hatch:
```powershell
pnpm --filter @igrp/framework-next-ui build:without_reactcompiler
```
Then diagnose what the React Compiler rejected before proceeding.

---

## Task 4: Thread props through `framework-next`

**Files:**
- Modify: `packages/framework/next/src/layouts/providers/header-data-provider.tsx`
- Modify: `packages/framework/next/src/layouts/igrp-layout.tsx`

Both files are in `framework-next` which imports the now-built `framework-next-ui`. The `BreadcrumbItem` type is imported from `@igrp/framework-next-ui`.

- [ ] **Step 1: Update `header-data-provider.tsx`**

Full new file content (replace entirely):

```tsx
// packages/framework/next/src/layouts/providers/header-data-provider.tsx
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import type { BreadcrumbItem } from '@igrp/framework-next-ui';
import { IGRPTemplateHeader } from '@igrp/framework-next-ui';

import { fetchCurrentUser } from '../../hooks/use-user';

type HeaderDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'layoutMockData' | 'previewMode'>;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbRouteLabels?: Record<string, string>;
};

export async function HeaderDataProvider({
  config,
  breadcrumbs,
  breadcrumbRouteLabels,
}: HeaderDataProviderProps) {
  const { previewMode, layoutMockData } = config;
  const headerData = await layoutMockData.getHeaderData();

  if (previewMode) {
    return (
      <IGRPTemplateHeader
        data={headerData}
        breadcrumbs={breadcrumbs}
        breadcrumbRouteLabels={breadcrumbRouteLabels}
      />
    );
  }

  const user = await fetchCurrentUser();

  return (
    <IGRPTemplateHeader
      data={{
        ...headerData,
        ...(user !== null && { user }),
      }}
      breadcrumbs={breadcrumbs}
      breadcrumbRouteLabels={breadcrumbRouteLabels}
    />
  );
}
```

- [ ] **Step 2: Update `igrp-layout.tsx`**

Full new file content (replace entirely):

```tsx
// packages/framework/next/src/layouts/igrp-layout.tsx
import { Suspense } from 'react';
import {
  IGRPRootProviders,
  IGRPLayoutErrorBoundary,
  IGRPHeaderSkeleton,
  IGRPSidebarSkeleton,
  IGRPHeaderError,
  IGRPSidebarError,
} from '@igrp/framework-next-ui';
import type { BreadcrumbItem } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { igrpSetAccessClientConfig } from '../lib/api-config';
import { HeaderDataProvider } from './providers/header-data-provider';
import { SidebarDataProvider } from './providers/sidebar-data-provider';

export type IGRPLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
  /**
   * Pre-resolved breadcrumb items built server-side. Pass from a nested layout
   * that has access to route params and can fetch data (user name, app name, etc.).
   * When provided, the breadcrumb skips all URL-parsing logic.
   */
  readonly breadcrumbs?: BreadcrumbItem[];
  /**
   * App-level route → label map. Keys are full hrefs.
   * Pass once from the root IGRP layout. Define the same object in generateMetadata
   * for a single source of truth between page titles and breadcrumb labels.
   *
   * @example
   * <IGRPLayout config={config} breadcrumbRouteLabels={{
   *   '/settings': 'Settings',
   *   '/settings/users': 'User Management',
   * }}>
   */
  readonly breadcrumbRouteLabels?: Record<string, string>;
};

export async function IGRPLayout({
  children,
  config,
  breadcrumbs,
  breadcrumbRouteLabels,
}: IGRPLayoutArgs) {
  const { previewMode, showSidebar, showHeader, layout, apiManagementConfig, toasterConfig } =
    config;

  const { session } = layout;

  if (!previewMode && apiManagementConfig?.baseUrl) {
    igrpSetAccessClientConfig({
      token: session?.accessToken || '',
      baseUrl: apiManagementConfig.baseUrl,
    });
  }

  // Only create slots when the section is enabled — avoids executing the async
  // server component when showSidebar/showHeader is false.
  const sidebarSlot = showSidebar ? (
    <IGRPLayoutErrorBoundary fallback={<IGRPSidebarError />}>
      <Suspense fallback={<IGRPSidebarSkeleton />}>
        <SidebarDataProvider config={config} />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  ) : null;

  const headerSlot = showHeader ? (
    <IGRPLayoutErrorBoundary fallback={<IGRPHeaderError />}>
      <Suspense fallback={<IGRPHeaderSkeleton />}>
        <HeaderDataProvider
          config={config}
          breadcrumbs={breadcrumbs}
          breadcrumbRouteLabels={breadcrumbRouteLabels}
        />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  ) : null;

  return (
    <IGRPRootProviders
      defaultOpen={true}
      showSidebar={showSidebar}
      showHeader={showHeader}
      toasterConfig={toasterConfig}
      sidebar={sidebarSlot}
      header={headerSlot}
    >
      {children}
    </IGRPRootProviders>
  );
}
```

- [ ] **Step 3: Verify it type-checks**

```powershell
cd D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs
pnpm exec tsc -p packages/framework/next/tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add packages/framework/next/src/layouts/providers/header-data-provider.tsx
git add packages/framework/next/src/layouts/igrp-layout.tsx
git commit -m "feat(next): thread breadcrumbs and breadcrumbRouteLabels through IGRPLayout"
```

---

## Task 5: Build `framework-next` and verify full chain

**Files:** none — build only.

- [ ] **Step 1: Build `framework-next`**

```powershell
cd D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs
pnpm build:next
```

Expected: build completes with no errors.

- [ ] **Step 2: Verify the full framework chain builds clean**

```powershell
pnpm build:framework
```

This rebuilds all packages in dependency order (`next-auth → next-types → design-system → next-ui → next`). Expected: all packages build without errors. This catches any type leak or import issue across the chain.

---

## Task 6: Create changeset

**Files:** none — changeset only.

Both `framework-next-ui` and `framework-next` changed their public APIs. One changeset covers both packages.

- [ ] **Step 1: Create the changeset file**

Run from the repo root:

```powershell
cd D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs
pnpm changeset
```

When the interactive prompt appears:
1. **Select packages** — space to select both `@igrp/framework-next-ui` and `@igrp/framework-next`, then Enter
2. **Choose bump type** — always `patch` (hard rule — this repo is in pre-release mode; `major`/`minor` breaks the `0.1.0-beta.*` pattern)
3. **Summary** — type:
   ```
   feat(breadcrumbs): controlled-first rebuild — items prop, useSelectedLayoutSegments, routeLabels; breaking: customLabels removed
   ```

- [ ] **Step 2: Commit the changeset**

```powershell
git add .changeset/
git commit -m "chore: changeset for breadcrumbs rebuild"
```
