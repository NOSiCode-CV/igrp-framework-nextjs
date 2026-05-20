# Phase 2 — Shell Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the boolean-prop-based layout API (`showSidebar`, `showHeader`) with two explicit variant components — `IGRPLayoutFull` and `IGRPLayoutBlank` — across `framework-next-types`, `framework/next-ui`, `framework/next`, and `templates/demo-legacy`. Also split `menus.tsx`, extract the breadcrumb overflow hook, fix semantic colors in `IGRPGlobalError`, stabilize `useLayoutData`, and apply minor quality fixes.

**Architecture:** Changes flow in strict dependency order: `framework-next-types` → `framework/next-ui` → `framework/next` → `demo-legacy`. Each package is built and verified before moving to the next. Old components (`IGRPLayout`, `IGRPRootProviders`) are kept as deprecated re-exports for one release cycle.

**Tech Stack:** React 19, Next.js 15 App Router, TypeScript, Tailwind v4, shadcn/ui primitives.

---

## File Map

### Created
- `packages/framework/next-ui/src/components/providers/root-full.tsx` — `IGRPRootProvidersFull`
- `packages/framework/next-ui/src/components/providers/root-blank.tsx` — `IGRPRootProvidersBlank`
- `packages/framework/next-ui/src/components/templates/menus/index.ts` — re-export barrel
- `packages/framework/next-ui/src/components/templates/menus/menus.tsx` — public `IGRPTemplateMenus`
- `packages/framework/next-ui/src/components/templates/menus/utils.ts` — pure helpers + tree types
- `packages/framework/next-ui/src/components/templates/menus/leaf-menu-item.tsx`
- `packages/framework/next-ui/src/components/templates/menus/sub-leaf-link.tsx`
- `packages/framework/next-ui/src/components/templates/menus/folder-menu-item.tsx`
- `packages/framework/next-ui/src/components/templates/menus/section-group.tsx`
- `packages/framework/next-ui/src/hooks/use-breadcrumb-overflow.ts`
- `packages/framework/next/src/layouts/igrp-layout-full.tsx` — `IGRPLayoutFull`
- `packages/framework/next/src/layouts/igrp-layout-blank.tsx` — `IGRPLayoutBlank`

### Modified
- `packages/framework/next-types/src/types/igrp.ts` — remove `showSidebar`, `showHeader`
- `packages/framework/next-ui/src/components/providers/nested.tsx` — remove `themeArgs` prop
- `packages/framework/next-ui/src/components/providers/root.tsx` — deprecated re-export
- `packages/framework/next-ui/src/components/templates/menus.tsx` — deprecated re-export pointing to new directory
- `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx` — use `useBreadcrumbOverflow`
- `packages/framework/next-ui/src/components/errors/global.tsx` — semantic color tokens
- `packages/framework/next-ui/src/index.ts` — add new exports
- `packages/framework/next/src/layouts/igrp-layout.tsx` — deprecated re-export
- `packages/framework/next/src/layouts/igrp-root-layout.tsx` — remove `themeArgs={undefined}`
- `packages/framework/next/src/client/use-layout-data.ts` — useCallback + useTransition
- `packages/framework/next/src/index.ts` — add new exports
- `templates/demo-legacy/src/app/(igrp)/layout.tsx` — use `IGRPLayoutFull`
- `templates/demo-legacy/src/igrp.template.config.ts` — remove `showSidebar`, `showHeader`
- `templates/demo-legacy/src/config/error-messages.ts` — fix ellipsis typography
- `templates/demo-legacy/src/app/(auth)/logout/page.tsx` — add visible loading feedback

---

## Task 1: Remove `showSidebar`/`showHeader` from `IGRPConfigArgs`

**Files:**
- Modify: `packages/framework/next-types/src/types/igrp.ts`

- [ ] **Step 1: Remove the two fields**

Open `packages/framework/next-types/src/types/igrp.ts`. In the `IGRPConfigArgs` type, delete these two lines:

```ts
  showSidebar?: boolean;
  showHeader?: boolean;
```

The type after removal (relevant section):

```ts
export type IGRPConfigArgs = {
  appCode: string;
  previewMode: boolean;
  syncAccess: boolean;
  appInformation: IGRPPackageJson;
  layoutMockData: {
    getHeaderData: () => Promise<IGRPHeaderDataArgs>;
    getSidebarData: () => Promise<IGRPSidebarDataArgs>;
  };
  font?: string;
  showLanguageSelector?: boolean;
  layout: IGRPLayoutConfigArgs;
  apiManagementConfig?: {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
    m2mServiceId: string;
    m2mToken: string;
    syncOnCodeMenus: boolean;
    appRoutes?: string[];
    paramMapBody?: string;
  };
  toasterConfig: {
    showToaster: boolean;
    position?: IGRPToasterPosition;
    theme?: 'light' | 'dark' | 'system';
    richColors?: boolean;
    expand?: boolean;
    duration?: number;
    closeButton?: boolean;
  };
  loginUrl?: string;
  logoutUrl?: string;
  showSettings?: boolean;
  sessionArgs?: Partial<SessionProviderProps>;
};
```

- [ ] **Step 2: Build framework-next-types**

```powershell
pnpm build:next-types
```

Expected: build completes with no errors. Downstream packages may now show TypeScript errors for `showSidebar`/`showHeader` usage — that's expected and will be fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```powershell
git add packages/framework/next-types/src/types/igrp.ts
git commit -m "feat(next-types): remove showSidebar/showHeader from IGRPConfigArgs"
```

---

## Task 2: Remove dead `themeArgs` prop from `IGRPNestedProviders`

**Files:**
- Modify: `packages/framework/next-ui/src/components/providers/nested.tsx`

- [ ] **Step 1: Remove `themeArgs` from the type and component**

Replace `packages/framework/next-ui/src/components/providers/nested.tsx` with:

```tsx
'use client';

import { type Session } from '@igrp/framework-next-auth';
import type { SessionProviderProps } from '@igrp/framework-next-auth/client';
import { TooltipProvider } from '@igrp/igrp-framework-react-design-system';

import { IGRPActiveThemeProvider } from './active-theme';
import { IGRPSessionProvider } from './session';
import { IGRPThemeProvider } from './theme';
import { IGRPSessionWatcher } from '../templates/session-watcher';

export type IGRPNestedProvidersArgs = {
  session?: Session | null;
  activeThemeValue?: string;
  children: React.ReactNode;
  sessionArgs?: Partial<SessionProviderProps>;
  className?: string;
};

export function IGRPNestedProviders({
  session,
  activeThemeValue,
  sessionArgs,
  children,
}: IGRPNestedProvidersArgs) {
  return (
    <IGRPSessionProvider {...sessionArgs} session={session}>
      <TooltipProvider>
        <IGRPThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <IGRPActiveThemeProvider initialTheme={activeThemeValue}>
            <IGRPSessionWatcher>{children}</IGRPSessionWatcher>
          </IGRPActiveThemeProvider>
        </IGRPThemeProvider>
      </TooltipProvider>
    </IGRPSessionProvider>
  );
}
```

- [ ] **Step 2: Remove `themeArgs={undefined}` from root layout**

Open `packages/framework/next/src/layouts/igrp-root-layout.tsx`. Find and remove the `themeArgs={undefined}` prop from the `IGRPNestedProviders` call:

```tsx
        <IGRPNestedProviders
          session={session}
          activeThemeValue={activeThemeValue}
          sessionArgs={sessionArgs}
        >
```

- [ ] **Step 3: Commit**

```powershell
git add packages/framework/next-ui/src/components/providers/nested.tsx
git add packages/framework/next/src/layouts/igrp-root-layout.tsx
git commit -m "feat(next-ui): remove dead themeArgs prop from IGRPNestedProviders"
```

---

## Task 3: Create `IGRPRootProvidersFull` and `IGRPRootProvidersBlank`

**Files:**
- Create: `packages/framework/next-ui/src/components/providers/root-full.tsx`
- Create: `packages/framework/next-ui/src/components/providers/root-blank.tsx`
- Modify: `packages/framework/next-ui/src/components/providers/root.tsx`

- [ ] **Step 1: Create `root-full.tsx`**

Create `packages/framework/next-ui/src/components/providers/root-full.tsx`:

```tsx
'use client';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPToaster,
  SidebarInset,
  SidebarProvider,
} from '@igrp/igrp-framework-react-design-system';

export type IGRPRootProvidersFullProps = {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  defaultOpen?: boolean;
  toasterConfig?: IGRPConfigArgs['toasterConfig'];
  children: React.ReactNode;
  className?: string;
};

export function IGRPRootProvidersFull({
  sidebar,
  header,
  defaultOpen,
  toasterConfig,
  children,
  className,
}: IGRPRootProvidersFullProps) {
  const {
    showToaster = true,
    position = 'bottom-right',
    theme = 'system',
    richColors = true,
    expand = false,
    duration = 5000,
  } = toasterConfig ?? {};

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className={cn('z-45')}>{sidebar}</div>
      <SidebarInset className={cn('min-w-0')}>
        {header}
        <div className={cn('p-4', className)}>{children}</div>
        {showToaster && (
          <IGRPToaster
            position={position}
            theme={theme}
            richColors={richColors}
            expand={expand}
            duration={duration}
            {...toasterConfig}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2: Create `root-blank.tsx`**

Create `packages/framework/next-ui/src/components/providers/root-blank.tsx`:

```tsx
'use client';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { cn, IGRPToaster } from '@igrp/igrp-framework-react-design-system';

export type IGRPRootProvidersBlankProps = {
  toasterConfig?: IGRPConfigArgs['toasterConfig'];
  children: React.ReactNode;
  className?: string;
};

export function IGRPRootProvidersBlank({
  toasterConfig,
  children,
  className,
}: IGRPRootProvidersBlankProps) {
  const {
    showToaster = true,
    position = 'bottom-right',
    theme = 'system',
    richColors = true,
    expand = false,
    duration = 5000,
  } = toasterConfig ?? {};

  return (
    <div className={cn('min-h-screen', className)}>
      {children}
      {showToaster && (
        <IGRPToaster
          position={position}
          theme={theme}
          richColors={richColors}
          expand={expand}
          duration={duration}
          {...toasterConfig}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Deprecate `root.tsx` as a re-export**

Replace `packages/framework/next-ui/src/components/providers/root.tsx` with:

```tsx
'use client';

// @deprecated Use IGRPRootProvidersFull or IGRPRootProvidersBlank instead.
// IGRPRootProviders will be removed in the next release.
export { IGRPRootProvidersFull as IGRPRootProviders } from './root-full';
export type { IGRPRootProvidersFullProps as IGRPRootProvidersArgs } from './root-full';
```

- [ ] **Step 4: Update `index.ts` exports in next-ui**

Open `packages/framework/next-ui/src/index.ts`. Find the providers section and replace:

```ts
export { IGRPRootProviders } from './components/providers/root';
```

With:

```ts
export {
  IGRPRootProvidersFull,
  type IGRPRootProvidersFullProps,
} from './components/providers/root-full';

export {
  IGRPRootProvidersBlank,
  type IGRPRootProvidersBlankProps,
} from './components/providers/root-blank';

// @deprecated Use IGRPRootProvidersFull instead.
export { IGRPRootProviders } from './components/providers/root';
```

Also update the `IGRPNestedProvidersArgs` export since we removed `themeArgs`:

```ts
export { IGRPNestedProviders, type IGRPNestedProvidersArgs } from './components/providers/nested';
```

(This line stays the same — the type now just has one fewer field, which is non-breaking for consumers.)

- [ ] **Step 5: Build next-ui**

```powershell
pnpm build:next-ui
```

Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```powershell
git add packages/framework/next-ui/src/components/providers/root-full.tsx
git add packages/framework/next-ui/src/components/providers/root-blank.tsx
git add packages/framework/next-ui/src/components/providers/root.tsx
git add packages/framework/next-ui/src/index.ts
git commit -m "feat(next-ui): add IGRPRootProvidersFull and IGRPRootProvidersBlank, deprecate IGRPRootProviders"
```

---

## Task 4: Split `menus.tsx` into a directory

**Files:**
- Create directory: `packages/framework/next-ui/src/components/templates/menus/`
- Create 7 new files (see below)
- Modify: `packages/framework/next-ui/src/components/templates/menus.tsx` → deprecated re-export

- [ ] **Step 1: Create `menus/utils.ts`** — tree types and pure helper functions

Create `packages/framework/next-ui/src/components/templates/menus/utils.ts`:

```ts
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { igrpIsExternalUrl, igrpNormalizeUrl } from '@igrp/igrp-framework-react-design-system';

export type LeafNode = { kind: 'leaf'; item: IGRPMenuItemArgs };
export type FolderNode = { kind: 'folder'; item: IGRPMenuItemArgs; children: LeafNode[] };
export type TreeNode = LeafNode | FolderNode;
export type Section = { key: string; label?: string; nodes: TreeNode[] };

export function resolveHref(item: IGRPMenuItemArgs): string {
  if (item.pageSlug) {
    return item.pageSlug.startsWith('/') ? item.pageSlug : `/${item.pageSlug}`;
  }
  if (item.url) return igrpNormalizeUrl(item.url);
  return '#';
}

export function resolveAnchorTag(item: IGRPMenuItemArgs): boolean {
  const isExternal = !item.pageSlug && !!item.url && igrpIsExternalUrl(item.url);
  return isExternal || item.target === '_blank';
}

export function buildMenuSections(menus: IGRPMenuItemArgs[]): Section[] {
  const byPosition = (a: IGRPMenuItemArgs, b: IGRPMenuItemArgs) =>
    (a.position ?? 0) - (b.position ?? 0);

  const active = menus.filter((m) => m.status === 'ACTIVE').sort(byPosition);
  if (active.length === 0) return [];

  const codeSet = new Set(active.map((m) => m.code).filter(Boolean));
  const topLevel: IGRPMenuItemArgs[] = [];
  const childrenMap = new Map<string, IGRPMenuItemArgs[]>();

  for (const item of active) {
    const isTopLevel =
      !item.parentCode || item.parentCode === item.code || !codeSet.has(item.parentCode);
    if (isTopLevel) {
      topLevel.push(item);
    } else {
      const list = childrenMap.get(item.parentCode!) ?? [];
      list.push(item);
      childrenMap.set(item.parentCode!, list);
    }
  }

  const toNode = (item: IGRPMenuItemArgs): TreeNode => {
    if (item.type === 'FOLDER') {
      const children = (childrenMap.get(item.code) ?? []).map(
        (child): LeafNode => ({ kind: 'leaf', item: child }),
      );
      return { kind: 'folder', item, children };
    }
    return { kind: 'leaf', item };
  };

  const sections: Section[] = [];
  let unlabeled: Section | null = null;

  for (const item of topLevel) {
    if (item.type === 'GROUP') {
      unlabeled = null;
      sections.push({
        key: item.code,
        label: item.name,
        nodes: (childrenMap.get(item.code) ?? []).map(toNode),
      });
    } else {
      if (!unlabeled) {
        unlabeled = { key: `root-${sections.length}`, nodes: [] };
        sections.push(unlabeled);
      }
      unlabeled.nodes.push(toNode(item));
    }
  }

  return sections;
}
```

- [ ] **Step 2: Create `menus/leaf-menu-item.tsx`**

Create `packages/framework/next-ui/src/components/templates/menus/leaf-menu-item.tsx`:

```tsx
'use client';

import Link from 'next/link';
import {
  cn,
  IGRPIcon,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@igrp/igrp-framework-react-design-system';

import type { LeafNode } from './utils';
import { resolveHref, resolveAnchorTag } from './utils';

interface LeafMenuItemProps {
  node: LeafNode;
  pathname: string;
}

export function LeafMenuItem({ node, pathname }: LeafMenuItemProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);
  const isActive =
    !isAnchor && href !== '#' && (pathname === href || pathname.startsWith(href + '/'));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.name} isActive={isActive}>
        {isAnchor ? (
          <a
            href={href}
            target={item.target ?? '_blank'}
            rel="noopener noreferrer"
            aria-label={item.target === '_blank' ? `${item.name} (opens in new tab)` : item.name}
          >
            {item.icon && <IGRPIcon iconName={item.icon} />}
            <span>{item.name}</span>
          </a>
        ) : (
          <Link href={href} aria-label={item.name}>
            {item.icon && <IGRPIcon iconName={item.icon} />}
            <span>{item.name}</span>
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
```

- [ ] **Step 3: Create `menus/sub-leaf-link.tsx`**

Create `packages/framework/next-ui/src/components/templates/menus/sub-leaf-link.tsx`:

```tsx
'use client';

import Link from 'next/link';
import {
  cn,
  IGRPIcon,
  DropdownMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@igrp/igrp-framework-react-design-system';

import type { LeafNode } from './utils';
import { resolveHref, resolveAnchorTag } from './utils';

interface SubLeafLinkProps {
  node: LeafNode;
  variant: 'dropdown' | 'collapsible';
}

export function SubLeafLink({ node, variant }: SubLeafLinkProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);

  const inner = isAnchor ? (
    <a
      href={href}
      target={item.target ?? '_blank'}
      rel="noopener noreferrer"
      aria-label={item.target === '_blank' ? `${item.name} (opens in new tab)` : item.name}
      className={cn('flex items-center gap-2 w-full min-w-0')}
    >
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('size-4 shrink-0')} />}
      <span className={cn('truncate')}>{item.name}</span>
    </a>
  ) : (
    <Link
      href={href}
      aria-label={item.name}
      className={cn('flex items-center gap-2 w-full min-w-0')}
    >
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('size-4 shrink-0')} />}
      <span className={cn('truncate')}>{item.name}</span>
    </Link>
  );

  if (variant === 'dropdown') {
    return (
      <DropdownMenuItem
        asChild
        onSelect={(e) => e.preventDefault()}
        className={cn('cursor-pointer px-2 py-2.5')}
      >
        {inner}
      </DropdownMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>{inner}</SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
```

- [ ] **Step 4: Create `menus/folder-menu-item.tsx`**

Create `packages/framework/next-ui/src/components/templates/menus/folder-menu-item.tsx`:

```tsx
'use client';

import {
  cn,
  IGRPIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@igrp/igrp-framework-react-design-system';

import type { FolderNode } from './utils';
import { SubLeafLink } from './sub-leaf-link';

interface FolderMenuItemProps {
  node: FolderNode;
}

export function FolderMenuItem({ node }: FolderMenuItemProps) {
  const { item, children } = node;

  return (
    <>
      {/* Dropdown — visible only in collapsed (icon) sidebar mode */}
      <SidebarMenuItem className={cn('group')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={item.name}
              className={cn('hidden cursor-pointer group-data-[collapsible=icon]:flex')}
              aria-label={`${item.name} menu`}
            >
              {item.icon && <IGRPIcon iconName={item.icon} />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className={cn('min-w-48')}>
            {children.map((child) => (
              <SubLeafLink key={`dd-${child.item.id}`} node={child} variant="dropdown" />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Collapsible — visible only in expanded sidebar mode */}
      <SidebarMenuItem>
        <Collapsible className={cn('w-full group/collapsible')}>
          <CollapsibleTrigger
            className={cn('flex w-full group-data-[collapsible=icon]:hidden')}
            asChild
          >
            <SidebarMenuButton
              tooltip={item.name}
              className={cn('w-full cursor-pointer')}
              aria-label={`Toggle ${item.name} submenu`}
            >
              {item.icon && <IGRPIcon iconName={item.icon} />}
              <span>{item.name}</span>
              <IGRPIcon
                iconName="ChevronRight"
                className={cn(
                  'ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90',
                )}
                strokeWidth={2}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {children.map((child) => (
                <SubLeafLink key={`col-${child.item.id}`} node={child} variant="collapsible" />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    </>
  );
}
```

- [ ] **Step 5: Create `menus/section-group.tsx`**

Create `packages/framework/next-ui/src/components/templates/menus/section-group.tsx`:

```tsx
'use client';

import {
  cn,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@igrp/igrp-framework-react-design-system';

import type { Section } from './utils';
import { FolderMenuItem } from './folder-menu-item';
import { LeafMenuItem } from './leaf-menu-item';

interface SectionGroupProps {
  section: Section;
  pathname: string;
}

export function SectionGroup({ section, pathname }: SectionGroupProps) {
  return (
    <SidebarGroup>
      {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu role="navigation">
          {section.nodes.map((node) =>
            node.kind === 'folder' ? (
              <FolderMenuItem key={`folder-${node.item.id}`} node={node} />
            ) : (
              <LeafMenuItem key={`leaf-${node.item.id}`} node={node} pathname={pathname} />
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
```

- [ ] **Step 6: Create `menus/menus.tsx`** — the public component (~65 lines)

Create `packages/framework/next-ui/src/components/templates/menus/menus.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPIcon,
  SidebarGroup,
} from '@igrp/igrp-framework-react-design-system';

import { buildMenuSections } from './utils';
import { SectionGroup } from './section-group';

export type IGRPTemplateMenuArgs = { menus?: IGRPMenuItemArgs[] };

export function IGRPTemplateMenus({ menus = [] }: IGRPTemplateMenuArgs) {
  const pathname = usePathname();
  const sections = useMemo(() => buildMenuSections(menus), [menus]);

  if (sections.length === 0) {
    return (
      <SidebarGroup>
        <div
          className={cn(
            'flex items-center gap-3 rounded-md border border-dashed px-3 py-3',
            'text-muted-foreground',
            'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2',
          )}
          title="Aplicação sem menus"
        >
          <IGRPIcon iconName="GlobeX" className={cn('size-4 shrink-0')} />
          <span className={cn('text-xs group-data-[collapsible=icon]:hidden')}>
            Aplicação sem menus.
          </span>
        </div>
      </SidebarGroup>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <SectionGroup key={`grp-${section.key}`} section={section} pathname={pathname} />
      ))}
    </>
  );
}
```

- [ ] **Step 7: Create `menus/index.ts`** — re-export barrel

Create `packages/framework/next-ui/src/components/templates/menus/index.ts`:

```ts
export { IGRPTemplateMenus, type IGRPTemplateMenuArgs } from './menus';
```

- [ ] **Step 8: Replace `menus.tsx` with a deprecated re-export**

Replace `packages/framework/next-ui/src/components/templates/menus.tsx` with:

```tsx
// @deprecated Import from the menus directory directly if needed.
// This re-export exists to preserve the package's public import path.
export { IGRPTemplateMenus, type IGRPTemplateMenuArgs } from './menus/index';
```

- [ ] **Step 9: Build next-ui**

```powershell
pnpm build:next-ui
```

Expected: build completes with no errors. Verify `IGRPTemplateMenus` is still exported correctly.

- [ ] **Step 10: Commit**

```powershell
git add packages/framework/next-ui/src/components/templates/menus/
git add packages/framework/next-ui/src/components/templates/menus.tsx
git commit -m "refactor(next-ui): split menus.tsx into menus/ directory — isolate tree-builder and sub-components"
```

---

## Task 5: Extract `useBreadcrumbOverflow` hook

**Files:**
- Create: `packages/framework/next-ui/src/hooks/use-breadcrumb-overflow.ts`
- Modify: `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx`

- [ ] **Step 1: Create `use-breadcrumb-overflow.ts`**

Create `packages/framework/next-ui/src/hooks/use-breadcrumb-overflow.ts`:

```ts
'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

export function useBreadcrumbOverflow(containerRef: RefObject<HTMLElement | null>): boolean {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const check = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setIsOverflowing(el.scrollWidth > el.clientWidth);
      });
    };

    const observer = new ResizeObserver(check);
    observer.observe(el);
    check();

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  return isOverflowing;
}
```

- [ ] **Step 2: Update `breadcrumbs.tsx` to use the hook**

Open `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx`. Find the inline ResizeObserver block (roughly lines 120–155 based on the original file) and replace it with a call to `useBreadcrumbOverflow`. Add the import at the top:

```ts
import { useBreadcrumbOverflow } from '../../hooks/use-breadcrumb-overflow';
```

Then find the `useRef` + `useState(false)` + `useEffect` block that sets `isOverflowing` and replace it:

```ts
// Remove these lines:
const containerRef = useRef<HTMLElement>(null);
const [isOverflowing, setIsOverflowing] = useState(false);
useEffect(() => {
  // ... ResizeObserver block ...
}, []);

// Replace with:
const containerRef = useRef<HTMLElement>(null);
const isOverflowing = useBreadcrumbOverflow(containerRef);
```

- [ ] **Step 3: Build next-ui**

```powershell
pnpm build:next-ui
```

Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```powershell
git add packages/framework/next-ui/src/hooks/use-breadcrumb-overflow.ts
git add packages/framework/next-ui/src/components/templates/breadcrumbs.tsx
git commit -m "refactor(next-ui): extract useBreadcrumbOverflow hook — debounce ResizeObserver with rAF"
```

---

## Task 6: Fix semantic colors in `IGRPGlobalError`

**Files:**
- Modify: `packages/framework/next-ui/src/components/errors/global.tsx`

- [ ] **Step 1: Replace hardcoded color classes**

Open `packages/framework/next-ui/src/components/errors/global.tsx`.

Make these replacements:

| Find | Replace |
|---|---|
| `text-gray-900 dark:text-white` | `text-foreground` |
| `text-gray-600 dark:text-gray-300` | `text-muted-foreground` |
| `bg-stone-100 dark:bg-gray-800/50` | `bg-muted` |
| `text-xs text-gray-500` | `text-xs text-muted-foreground` |
| `rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-700` | `rounded bg-muted px-1 py-0.5` |
| `bg-primary-50` | `bg-background` |

The updated JSX block (lines 71–118):

```tsx
  return (
    <div className={cn('flex min-h-[calc(100vh-12rem)] items-center justify-center bg-background')}>
      <div className={cn('w-full max-w-3xl')}>
        <div className={cn('text-center')}>
          <Image
            src="/error-img.webp"
            alt="Error Image"
            width={300}
            height={200}
            className={cn('mx-auto mb-2')}
          />
          <h1 className={cn('text-2xl font-bold tracking-tight text-foreground')}>
            {title}
          </h1>
          <p className={cn('mb-4 text-base text-muted-foreground')}>{description}</p>

          {error.digest && (
            <div
              className={cn(
                'mx-auto max-w-xl transform overflow-hidden rounded-lg p-3 mb-4 backdrop-blur transition-all duration-500 bg-muted shadow-xs',
                errorVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              <p className={cn('text-xs text-muted-foreground')}>
                {errorRefLabel}{' '}
                <code className={cn('rounded bg-muted px-1 py-0.5')}>
                  {error.digest}
                </code>
              </p>
            </div>
          )}

          <div className={cn('flex flex-col items-center justify-center gap-4 sm:flex-row')}>
            <IGRPButton
              onClick={handleReset}
              size="lg"
              className={cn('group min-w-40')}
              disabled={isResetting}
              showIcon
              iconName="RefreshCw"
              iconClassName={cn('mr-2 h-4 w-4 transition-transform', isResetting && 'animate-spin')}
            >
              <span>{isResetting ? retryingLabel : resetLabel}</span>
            </IGRPButton>
          </div>
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 2: Build next-ui**

```powershell
pnpm build:next-ui
```

Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```powershell
git add packages/framework/next-ui/src/components/errors/global.tsx
git commit -m "fix(next-ui): replace hardcoded colors in IGRPGlobalError with semantic tokens"
```

---

## Task 7: Create `IGRPLayoutFull` and `IGRPLayoutBlank`

**Files:**
- Create: `packages/framework/next/src/layouts/igrp-layout-full.tsx`
- Create: `packages/framework/next/src/layouts/igrp-layout-blank.tsx`
- Modify: `packages/framework/next/src/layouts/igrp-layout.tsx` → deprecated re-export
- Modify: `packages/framework/next/src/index.ts`

- [ ] **Step 1: Create `igrp-layout-full.tsx`**

Create `packages/framework/next/src/layouts/igrp-layout-full.tsx`:

```tsx
import { Suspense } from 'react';
import {
  IGRPRootProvidersFull,
  IGRPLayoutErrorBoundary,
  IGRPHeaderSkeleton,
  IGRPSidebarSkeleton,
  IGRPHeaderError,
  IGRPSidebarError,
  type BreadcrumbItem,
} from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { igrpSetAccessClientConfig } from '../lib/api-config';
import { HeaderDataProvider } from './providers/header-data-provider';
import { SidebarDataProvider } from './providers/sidebar-data-provider';

export type IGRPLayoutFullArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
  readonly breadcrumbs?: BreadcrumbItem[];
  readonly breadcrumbRouteLabels?: Record<string, string>;
};

export async function IGRPLayoutFull({
  children,
  config,
  breadcrumbs,
  breadcrumbRouteLabels,
}: IGRPLayoutFullArgs) {
  const { previewMode, layout, apiManagementConfig, toasterConfig } = config;
  const { session } = layout;

  if (!previewMode && apiManagementConfig?.baseUrl) {
    igrpSetAccessClientConfig({
      token: session?.accessToken || '',
      baseUrl: apiManagementConfig.baseUrl,
    });
  }

  const sidebarSlot = (
    <IGRPLayoutErrorBoundary fallback={<IGRPSidebarError />}>
      <Suspense fallback={<IGRPSidebarSkeleton />}>
        <SidebarDataProvider config={config} />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  );

  const headerSlot = (
    <IGRPLayoutErrorBoundary fallback={<IGRPHeaderError />}>
      <Suspense fallback={<IGRPHeaderSkeleton />}>
        <HeaderDataProvider
          config={config}
          breadcrumbs={breadcrumbs}
          breadcrumbRouteLabels={breadcrumbRouteLabels}
        />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  );

  return (
    <IGRPRootProvidersFull
      defaultOpen={true}
      toasterConfig={toasterConfig}
      sidebar={sidebarSlot}
      header={headerSlot}
    >
      {children}
    </IGRPRootProvidersFull>
  );
}
```

- [ ] **Step 2: Create `igrp-layout-blank.tsx`**

Create `packages/framework/next/src/layouts/igrp-layout-blank.tsx`:

```tsx
import { IGRPRootProvidersBlank } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

export type IGRPLayoutBlankArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

export async function IGRPLayoutBlank({ children, config }: IGRPLayoutBlankArgs) {
  const { toasterConfig } = config;

  return (
    <IGRPRootProvidersBlank toasterConfig={toasterConfig}>
      {children}
    </IGRPRootProvidersBlank>
  );
}
```

- [ ] **Step 3: Deprecate `igrp-layout.tsx` as a re-export**

Replace the contents of `packages/framework/next/src/layouts/igrp-layout.tsx` with:

```tsx
// @deprecated Use IGRPLayoutFull or IGRPLayoutBlank instead.
// IGRPLayout will be removed in the next release.
export { IGRPLayoutFull as IGRPLayout, type IGRPLayoutFullArgs as IGRPLayoutArgs } from './igrp-layout-full';
```

- [ ] **Step 4: Update `packages/framework/next/src/index.ts`**

Add the new exports. Replace the `IGRPLayout` export line:

```ts
export { IGRPLayout, type IGRPLayoutArgs } from './layouts/igrp-layout';
```

With:

```ts
export { IGRPLayoutFull, type IGRPLayoutFullArgs } from './layouts/igrp-layout-full';
export { IGRPLayoutBlank, type IGRPLayoutBlankArgs } from './layouts/igrp-layout-blank';
// @deprecated Use IGRPLayoutFull instead.
export { IGRPLayout, type IGRPLayoutArgs } from './layouts/igrp-layout';
```

- [ ] **Step 5: Build framework/next**

```powershell
pnpm build:next
```

Expected: build completes with no errors. The TypeScript error about `showSidebar`/`showHeader` being used in the old `igrp-layout.tsx` is gone since that file is now just a re-export.

- [ ] **Step 6: Commit**

```powershell
git add packages/framework/next/src/layouts/igrp-layout-full.tsx
git add packages/framework/next/src/layouts/igrp-layout-blank.tsx
git add packages/framework/next/src/layouts/igrp-layout.tsx
git add packages/framework/next/src/index.ts
git commit -m "feat(framework-next): add IGRPLayoutFull and IGRPLayoutBlank, deprecate IGRPLayout"
```

---

## Task 8: Stabilize `useLayoutData` with `useCallback` and `useTransition`

**Files:**
- Modify: `packages/framework/next/src/client/use-layout-data.ts`

- [ ] **Step 1: Rewrite the hook**

Replace `packages/framework/next/src/client/use-layout-data.ts` with:

```ts
'use client';

import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { revalidateAppsAction, revalidateMenusAction } from '../actions/index';

export function useLayoutData(appCode: string) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const refreshMenus = useCallback(() => {
    startTransition(async () => {
      await revalidateMenusAction(appCode);
      router.refresh();
    });
  }, [appCode, router, startTransition]);

  const refreshApps = useCallback(() => {
    startTransition(async () => {
      await revalidateAppsAction();
      router.refresh();
    });
  }, [router, startTransition]);

  const refreshUser = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  return { refreshMenus, refreshApps, refreshUser };
}
```

- [ ] **Step 2: Build framework/next**

```powershell
pnpm build:next
```

Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```powershell
git add packages/framework/next/src/client/use-layout-data.ts
git commit -m "fix(framework-next): stabilize useLayoutData with useCallback and useTransition"
```

---

## Task 9: Migrate `demo-legacy` to the new API

**Files:**
- Modify: `templates/demo-legacy/src/app/(igrp)/layout.tsx`
- Modify: `templates/demo-legacy/src/igrp.template.config.ts`

- [ ] **Step 1: Update `(igrp)/layout.tsx` to use `IGRPLayoutFull`**

Replace `templates/demo-legacy/src/app/(igrp)/layout.tsx` with:

```tsx
import { IGRPLayoutFull } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@/igrp.template.config";

import { configLayout } from "@/actions/igrp/layout";
import { verifySession } from "@/lib/dal";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await verifySession();

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  return <IGRPLayoutFull config={config}>{children}</IGRPLayoutFull>;
}
```

- [ ] **Step 2: Remove `showSidebar` and `showHeader` from `igrp.template.config.ts`**

Open `templates/demo-legacy/src/igrp.template.config.ts`. Find and remove these two lines from the `igrpBuildConfig(...)` call:

```ts
    showSidebar: true,
    showHeader: true,
```

- [ ] **Step 3: Verify TypeScript compilation of demo-legacy**

```powershell
pnpm --filter demo-legacy exec tsc --noEmit
```

Expected: no errors. If there are errors about `showSidebar`/`showHeader` elsewhere in demo-legacy, remove those usages too.

- [ ] **Step 4: Start the dev server and smoke-test**

```powershell
pnpm dev:demo
```

Navigate to `http://localhost:3000`. Verify:
- Sidebar renders with menus
- Header renders with breadcrumbs and user nav
- Dark mode toggle works
- Theme selector works
- Preview mode (`IGRP_PREVIEW_MODE=true`) still works

- [ ] **Step 5: Commit**

```powershell
git add templates/demo-legacy/src/app/"(igrp)"/layout.tsx
git add templates/demo-legacy/src/igrp.template.config.ts
git commit -m "feat(demo-legacy): migrate to IGRPLayoutFull, remove showSidebar/showHeader from config"
```

---

## Task 10: Additional quality fixes

**Files:**
- Modify: `templates/demo-legacy/src/config/error-messages.ts`
- Modify: `templates/demo-legacy/src/app/(auth)/logout/page.tsx`

- [ ] **Step 1: Fix ellipsis typography in Portuguese error copy**

Open `templates/demo-legacy/src/config/error-messages.ts`. Find all occurrences of `...` used as ellipsis in user-facing Portuguese strings (not in code) and replace each with `…` (Unicode U+2026).

Search for `"..."` or `'...'` within string values and replace the three dots with the single ellipsis character `…`. Do not change code syntax like `...spread` operators.

- [ ] **Step 2: Add visible loading feedback to `logout/page.tsx`**

Open `templates/demo-legacy/src/app/(auth)/logout/page.tsx`. Find where the component renders during logout (the section that currently renders nothing visible). Add a loading indicator using `IGRPTemplateLoading`:

```tsx
import { IGRPTemplateLoading } from '@igrp/framework-next-ui';
```

In the return JSX, replace any empty/minimal render with:

```tsx
return (
  <IGRPTemplateLoading
    text="A terminar sessão..."
    appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
  />
);
```

Place this as the default render during the logout process (before the redirect completes).

- [ ] **Step 3: Build and verify demo-legacy**

```powershell
pnpm build:demo
```

Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```powershell
git add templates/demo-legacy/src/config/error-messages.ts
git add templates/demo-legacy/src/app/"(auth)"/logout/page.tsx
git commit -m "fix(demo-legacy): ellipsis typography, logout loading state"
```

---

## Task 11: Changesets and coordinated release

- [ ] **Step 1: Create changesets for all three packages**

```powershell
pnpm changeset
```

Run three times, one per package:

**Run 1:** Select `@igrp/framework-next-types` → `patch` → `feat: remove showSidebar/showHeader from IGRPConfigArgs`

**Run 2:** Select `@igrp/framework-next-ui` → `patch` → `feat: add IGRPRootProvidersFull/Blank, split menus, fix global error colors, extract breadcrumb hook, remove themeArgs`

**Run 3:** Select `@igrp/framework-next` → `patch` → `feat: add IGRPLayoutFull/Blank, deprecate IGRPLayout, stabilize useLayoutData`

- [ ] **Step 2: Commit changesets**

```powershell
git add .changeset/
git commit -m "chore: changesets for phase-2 shell refactor"
```

- [ ] **Step 3: Run full framework build to verify dependency order**

```powershell
pnpm build:framework
```

Build order: `next-auth → next-types → design-system → next-ui → next`. Expected: all packages build with no errors.

- [ ] **Step 4: Verify demo-legacy compiles against the built packages**

```powershell
pnpm --filter demo-legacy exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Follow `/release-framework` command to version and publish**

Type `/release-framework` in Claude Code to run the full release workflow. Publish order respects dependency chain.
