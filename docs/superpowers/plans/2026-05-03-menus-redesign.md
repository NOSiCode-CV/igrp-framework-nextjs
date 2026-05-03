# Menus Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `packages/framework/next-ui/src/components/templates/menus.tsx` from scratch using a two-pass tree builder + type-dispatch renderer with shadcn sidebar primitives.

**Architecture:** Pass 1 filters ACTIVE items, sorts by `position`, and builds a typed `Section[]` tree (GROUP → labeled section, FOLDER → FolderNode with children, everything else → LeafNode). Pass 2 renders sections by dispatching to focused components: `LeafMenuItem` (MENU_PAGE / EXTERNAL_PAGE / SYSTEM_PAGE), `FolderMenuItem` (FOLDER — dropdown in collapsed sidebar, Collapsible in expanded), and `SubLeafLink` (shared child link inside folders). Pure helper functions `resolveHref` and `resolveAnchorTag` centralize the link-type decision.

**Tech Stack:** React 19 (`'use client'`, `useMemo`, `usePathname`), Next.js 15 (`Link`), `@igrp/framework-next-types` (`IGRPMenuItemArgs`), `@igrp/igrp-framework-react-design-system` (sidebar primitives, `Collapsible`, `DropdownMenu`, `IGRPIcon`, `Alert`, `cn`, `igrpNormalizeUrl`, `igrpIsExternalUrl`)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Full rewrite | `packages/framework/next-ui/src/components/templates/menus.tsx` | Single file — all types, helpers, and components |

No other files change.

---

### Task 1: Skeleton — imports, private types, and pure helper functions

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/menus.tsx`

- [ ] **Step 1: Replace the entire file with the skeleton below**

```tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPIcon,
  Alert,
  AlertDescription,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  igrpIsExternalUrl,
  igrpNormalizeUrl,
} from '@igrp/igrp-framework-react-design-system';

// ─── Private tree types ───────────────────────────────────────────────────────

type LeafNode   = { kind: 'leaf';   item: IGRPMenuItemArgs }
type FolderNode = { kind: 'folder'; item: IGRPMenuItemArgs; children: LeafNode[] }
type TreeNode   = LeafNode | FolderNode
type Section    = { key: string; label?: string; nodes: TreeNode[] }

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function resolveHref(item: IGRPMenuItemArgs): string {
  if (item.pageSlug) {
    return item.pageSlug.startsWith('/') ? item.pageSlug : `/${item.pageSlug}`;
  }
  if (item.url) return igrpNormalizeUrl(item.url);
  return '#';
}

function resolveAnchorTag(item: IGRPMenuItemArgs): boolean {
  const isExternal = !item.pageSlug && !!item.url && igrpIsExternalUrl(item.url);
  return isExternal || item.target === '_blank';
}

// ─── Stub (replaced in later tasks) ──────────────────────────────────────────

type IGRPTemplateMenuArgs = { menus?: IGRPMenuItemArgs[] };

export function IGRPTemplateMenus(_props: IGRPTemplateMenuArgs) {
  return null;
}

export type { IGRPTemplateMenuArgs };
```

- [ ] **Step 2: Verify TypeScript — zero errors expected**

```bash
cd packages/framework/next-ui && npx tsc --noEmit
```

Expected: no errors. If `igrpIsExternalUrl` or `igrpNormalizeUrl` are not found, check that they are exported from `@igrp/igrp-framework-react-design-system` — search `packages/design-system/src/index.ts` for those names.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/menus.tsx
git commit -m "refactor(next-ui): skeleton + types + pure helpers for menus rewrite"
```

---

### Task 2: Tree builder — `buildMenuSections`

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/menus.tsx`

- [ ] **Step 1: Replace the stub comment block with the full tree builder**

Remove the `// ─── Stub ───` block (and the exported stub `IGRPTemplateMenus`) and insert the following between the pure helpers and the eventual root component. Keep the imports and types from Task 1 unchanged.

```tsx
// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildMenuSections(menus: IGRPMenuItemArgs[]): Section[] {
  const byPosition = (a: IGRPMenuItemArgs, b: IGRPMenuItemArgs) =>
    (a.position ?? 0) - (b.position ?? 0);

  const active = menus.filter((m) => m.status === 'ACTIVE').sort(byPosition);
  if (active.length === 0) return [];

  const codeSet = new Set(active.map((m) => m.code).filter(Boolean));
  const topLevel: IGRPMenuItemArgs[] = [];
  const childrenMap = new Map<string, IGRPMenuItemArgs[]>();

  for (const item of active) {
    const isTopLevel =
      !item.parentCode ||
      item.parentCode === item.code ||
      !codeSet.has(item.parentCode);

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

Also add back a minimal exported stub below it so the file compiles:

```tsx
type IGRPTemplateMenuArgs = { menus?: IGRPMenuItemArgs[] };

export function IGRPTemplateMenus(_props: IGRPTemplateMenuArgs) {
  return null;
}

export type { IGRPTemplateMenuArgs };
```

- [ ] **Step 2: Verify TypeScript — zero errors expected**

```bash
cd packages/framework/next-ui && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/menus.tsx
git commit -m "refactor(next-ui): implement buildMenuSections tree builder"
```

---

### Task 3: `LeafMenuItem` component

Handles `MENU_PAGE`, `EXTERNAL_PAGE`, and `SYSTEM_PAGE` items — a simple sidebar nav link.

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/menus.tsx`

- [ ] **Step 1: Insert `LeafMenuItem` between `buildMenuSections` and the temporary stub**

```tsx
// ─── LeafMenuItem ─────────────────────────────────────────────────────────────

interface LeafMenuItemProps {
  node: LeafNode;
  pathname: string;
}

function LeafMenuItem({ node, pathname }: LeafMenuItemProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);
  const isActive =
    !isAnchor &&
    href !== '#' &&
    (pathname === href || pathname.startsWith(href + '/'));

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

- [ ] **Step 2: Verify TypeScript — zero errors expected**

```bash
cd packages/framework/next-ui && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/menus.tsx
git commit -m "refactor(next-ui): add LeafMenuItem component"
```

---

### Task 4: `SubLeafLink` component

Shared child-link renderer used by `FolderMenuItem` for both dropdown (collapsed sidebar) and collapsible (expanded sidebar) variants.

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/menus.tsx`

- [ ] **Step 1: Insert `SubLeafLink` after `LeafMenuItem` and before the temporary stub**

```tsx
// ─── SubLeafLink ──────────────────────────────────────────────────────────────

interface SubLeafLinkProps {
  node: LeafNode;
  variant: 'dropdown' | 'collapsible';
}

function SubLeafLink({ node, variant }: SubLeafLinkProps) {
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
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('h-4 w-4 shrink-0')} />}
      <span className={cn('truncate')}>{item.name}</span>
    </a>
  ) : (
    <Link
      href={href}
      aria-label={item.name}
      className={cn('flex items-center gap-2 w-full min-w-0')}
    >
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('h-4 w-4 shrink-0')} />}
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

- [ ] **Step 2: Verify TypeScript — zero errors expected**

```bash
cd packages/framework/next-ui && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/menus.tsx
git commit -m "refactor(next-ui): add SubLeafLink shared child-link component"
```

---

### Task 5: `FolderMenuItem` component

Renders a `FOLDER` item with two modes: `DropdownMenu` in collapsed (icon-only) sidebar, `Collapsible` in expanded sidebar.

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/menus.tsx`

- [ ] **Step 1: Insert `FolderMenuItem` after `SubLeafLink` and before the temporary stub**

```tsx
// ─── FolderMenuItem ───────────────────────────────────────────────────────────

interface FolderMenuItemProps {
  node: FolderNode;
}

function FolderMenuItem({ node }: FolderMenuItemProps) {
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
                  'ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90',
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

- [ ] **Step 2: Verify TypeScript — zero errors expected**

```bash
cd packages/framework/next-ui && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/menus.tsx
git commit -m "refactor(next-ui): add FolderMenuItem with dropdown + collapsible modes"
```

---

### Task 6: `SectionGroup` + `IGRPTemplateMenus` root — wire everything up

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/menus.tsx`

- [ ] **Step 1: Replace the temporary stub with `SectionGroup` and the real `IGRPTemplateMenus`**

Remove the temporary stub block (`type IGRPTemplateMenuArgs ... export type { IGRPTemplateMenuArgs }`) and replace with:

```tsx
// ─── SectionGroup ─────────────────────────────────────────────────────────────

interface SectionGroupProps {
  section: Section;
  pathname: string;
}

function SectionGroup({ section, pathname }: SectionGroupProps) {
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

// ─── IGRPTemplateMenus (public) ───────────────────────────────────────────────

type IGRPTemplateMenuArgs = { menus?: IGRPMenuItemArgs[] };

export function IGRPTemplateMenus({ menus = [] }: IGRPTemplateMenuArgs) {
  const pathname = usePathname();
  const sections = useMemo(() => buildMenuSections(menus), [menus]);

  if (sections.length === 0) {
    return (
      <Alert variant="destructive">
        <IGRPIcon iconName="CircleAlert" />
        <AlertDescription>Aplicação sem menus.</AlertDescription>
      </Alert>
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

export type { IGRPTemplateMenuArgs };
```

- [ ] **Step 2: Verify TypeScript — zero errors expected**

```bash
cd packages/framework/next-ui && npx tsc --noEmit
```

- [ ] **Step 3: Run full package build — must succeed with no errors**

```bash
pnpm build:next-ui
```

Expected: build completes, `packages/framework/next-ui/dist/` updated. If the React Compiler step fails, run `pnpm --filter @igrp/framework-next-ui build:without_reactcompiler` as a fallback and note the regression.

- [ ] **Step 4: Start the demo app and verify visually**

```bash
pnpm dev:demo
```

Open `http://localhost:3000` (or whatever port the demo runs on). Verify:

1. **GROUP** items render as labeled `SidebarGroupLabel` headers — no clickable element, no icon.
2. **FOLDER** items render as collapsible rows with ChevronRight that rotates 90° on open.
3. **FOLDER children** (`MENU_PAGE` / `EXTERNAL_PAGE`) appear inside `SidebarMenuSub` when expanded.
4. **Collapse the sidebar to icon-only mode** — FOLDER items should show a `DropdownMenu` on hover/click with the children listed.
5. **MENU_PAGE** items without a parent folder render as simple nav links.
6. **EXTERNAL_PAGE** items open in a new tab (`target="_blank"`).
7. **Active state** — navigate to a page and confirm the corresponding menu item is highlighted; no adjacent items are falsely highlighted.
8. **Inactive items** — if your mock data includes `INACTIVE` or `DELETED` items, confirm they do not appear.

- [ ] **Step 5: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/menus.tsx
git commit -m "refactor(next-ui): complete menus rewrite — tree builder + type-dispatch renderer"
```

---

## Self-Review Checklist

- [x] **Spec coverage**
  - Filter ACTIVE only → Task 2 (`buildMenuSections` filters `status === 'ACTIVE'`)
  - Sort by position → Task 2 (`byPosition` comparator)
  - GROUP → labeled Section → Task 2 + Task 6 (`SectionGroup` renders `SidebarGroupLabel`)
  - FOLDER → FolderNode → dual dropdown/collapsible → Task 2 + Task 5
  - MENU_PAGE / EXTERNAL_PAGE / SYSTEM_PAGE → LeafNode → LeafMenuItem → Task 2 + Task 3
  - SubLeafLink for folder children → Task 4
  - resolveHref / resolveAnchorTag → Task 1
  - isActive fix (`+ '/'`) → Task 3
  - Icons on FOLDER / MENU_PAGE / EXTERNAL_PAGE / SYSTEM_PAGE → Tasks 3, 4, 5
  - Empty state Alert → Task 6
  - Dropdown in collapsed sidebar mode → Task 5
  - Collapsible in expanded mode → Task 5
  - SYSTEM_PAGE treated as MENU_PAGE → Task 3 (`LeafMenuItem` handles all non-FOLDER types)

- [x] **No placeholders** — all steps contain complete code

- [x] **Type consistency**
  - `LeafNode`, `FolderNode`, `TreeNode`, `Section` defined in Task 1, used consistently in Tasks 2–6
  - `resolveHref(item: IGRPMenuItemArgs): string` — defined Task 1, called in Tasks 3 and 4
  - `resolveAnchorTag(item: IGRPMenuItemArgs): boolean` — defined Task 1, called in Tasks 3 and 4
  - `buildMenuSections(menus: IGRPMenuItemArgs[]): Section[]` — defined Task 2, called in Task 6
  - `LeafMenuItemProps.node: LeafNode` — matches `LeafNode` from Task 1
  - `FolderMenuItemProps.node: FolderNode` — matches `FolderNode` from Task 1
  - `SubLeafLinkProps.node: LeafNode` — matches `LeafNode` from Task 1
  - `SectionGroupProps.section: Section` — matches `Section` from Task 1
