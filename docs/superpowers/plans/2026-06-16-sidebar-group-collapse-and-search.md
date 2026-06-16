# Sidebar GROUP Collapse + Menu Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add collapsible GROUP sections and an inline flat-search input to the sidebar menu tree in `@igrp/framework-next-ui`.

**Architecture:** Two self-contained changes to `packages/framework/next-ui/src/components/templates/menus/`. `section-group.tsx` gains a `Collapsible` wrap around labeled sections. `menus.tsx` adds a search `useState` + `Input`; a new `search-results.tsx` sibling renders a flat list of matching leaf items. Public API is unchanged.

**Tech Stack:** React 19, Next.js 15, `@igrp/igrp-framework-react-design-system` (Radix primitives — `Collapsible`, `Input`), Tailwind v4 semantic tokens, pnpm monorepo.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `menus/section-group.tsx` | Modify | Wraps labeled sections in `Collapsible`; label row becomes collapse trigger |
| `menus/search-results.tsx` | Create | Flat results list component for non-empty search query |
| `menus/menus.tsx` | Modify | Owns search `useState`, renders `Input` + conditionally switches tree↔results |
| `menus/utils.ts` | No change | — |
| `menus/folder-menu-item.tsx` | No change | — |
| `menus/leaf-menu-item.tsx` | No change | — |
| `menus/sub-leaf-link.tsx` | No change | — |
| `menus/index.ts` | No change | — |

---

## Task 1: Collapsible GROUP sections

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/menus/section-group.tsx`

- [ ] **Step 1: Replace `section-group.tsx` with the collapsible version**

```tsx
'use client';

import {
  cn,
  IGRPIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupContent,
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
  const menuContent = (
    <SidebarGroupContent>
      <SidebarMenu role="navigation">
        {section.nodes.map((node) =>
          node.kind === 'folder' ? (
            <FolderMenuItem key={`folder-${node.item.id}`} node={node} pathname={pathname} />
          ) : (
            <LeafMenuItem key={`leaf-${node.item.id}`} node={node} pathname={pathname} />
          ),
        )}
      </SidebarMenu>
    </SidebarGroupContent>
  );

  if (section.label) {
    return (
      <SidebarGroup>
        <Collapsible defaultOpen className={cn('group/collapsible-group')}>
          <CollapsibleTrigger
            className={cn(
              'flex h-8 w-full cursor-pointer items-center rounded-md px-2',
              'text-xs font-medium text-sidebar-foreground/70',
              'transition-colors hover:text-sidebar-foreground',
              'group-data-[collapsible=icon]:hidden',
            )}
          >
            {section.label}
            <IGRPIcon
              iconName="ChevronRight"
              className={cn(
                'ml-auto size-3.5 shrink-0 transition-transform duration-200',
                'group-data-[state=open]/collapsible-group:rotate-90',
              )}
              strokeWidth={2}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>{menuContent}</CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  }

  return <SidebarGroup>{menuContent}</SidebarGroup>;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
pnpm build:next-ui
```

Expected: build completes with no TypeScript errors. If you see `Cannot find name 'Collapsible'` or similar, confirm that `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` are exported from `@igrp/igrp-framework-react-design-system`. They are used in `folder-menu-item.tsx` in the same directory — check that file's imports as a reference.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/menus/section-group.tsx
git commit -m "feat(next-ui): collapsible GROUP sections in sidebar"
```

---

## Task 2: SearchResults flat-list component

**Files:**
- Create: `packages/framework/next-ui/src/components/templates/menus/search-results.tsx`

- [ ] **Step 1: Create `search-results.tsx`**

```tsx
'use client';

import Link from 'next/link';
import {
  cn,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@igrp/igrp-framework-react-design-system';

import type { Section } from './utils';
import { resolveHref, resolveAnchorTag, isItemActive, ACTIVE_MENU_ITEM_CLASS } from './utils';

interface SearchResult {
  id: string | number;
  name: string;
  /** Label parts shown as "Grupo A › Documentos" — does NOT include the item name itself. */
  breadcrumb: string[];
  href: string;
  isAnchor: boolean;
  target?: string;
  isActive: boolean;
}

function buildResults(sections: Section[], query: string, pathname: string): SearchResult[] {
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const section of sections) {
    const sectionCrumb = section.label ? [section.label] : [];

    for (const node of section.nodes) {
      if (node.kind === 'leaf') {
        if (node.item.name.toLowerCase().includes(q)) {
          results.push({
            id: node.item.id,
            name: node.item.name,
            breadcrumb: sectionCrumb,
            href: resolveHref(node.item),
            isAnchor: resolveAnchorTag(node.item),
            target: node.item.target,
            isActive: isItemActive(node.item, pathname),
          });
        }
      } else {
        for (const child of node.children) {
          if (child.item.name.toLowerCase().includes(q)) {
            results.push({
              id: child.item.id,
              name: child.item.name,
              breadcrumb: [...sectionCrumb, node.item.name],
              href: resolveHref(child.item),
              isAnchor: resolveAnchorTag(child.item),
              target: child.item.target,
              isActive: isItemActive(child.item, pathname),
            });
          }
        }
      }
    }
  }

  return results;
}

interface SearchResultsProps {
  sections: Section[];
  query: string;
  pathname: string;
}

export function SearchResults({ sections, query, pathname }: SearchResultsProps) {
  const results = buildResults(sections, query, pathname);

  if (results.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <p className={cn('px-2 py-3 text-xs text-muted-foreground')}>Sem resultados.</p>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu role="navigation">
          {results.map((result) => {
            const inner = result.isAnchor ? (
              <a
                href={result.href}
                target={result.target ?? '_blank'}
                rel="noopener noreferrer"
                aria-label={
                  result.target === '_blank'
                    ? `${result.name} (opens in new tab)`
                    : result.name
                }
                className={cn('flex flex-col items-start gap-0.5')}
              >
                <span className={cn('truncate')}>{result.name}</span>
                {result.breadcrumb.length > 0 && (
                  <span className={cn('truncate text-xs text-muted-foreground')}>
                    {result.breadcrumb.join(' › ')}
                  </span>
                )}
              </a>
            ) : (
              <Link
                href={result.href}
                aria-label={result.name}
                className={cn('flex flex-col items-start gap-0.5')}
              >
                <span className={cn('truncate')}>{result.name}</span>
                {result.breadcrumb.length > 0 && (
                  <span className={cn('truncate text-xs text-muted-foreground')}>
                    {result.breadcrumb.join(' › ')}
                  </span>
                )}
              </Link>
            );

            return (
              <SidebarMenuItem key={String(result.id)}>
                <SidebarMenuButton
                  asChild
                  isActive={result.isActive}
                  className={ACTIVE_MENU_ITEM_CLASS}
                >
                  {inner}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
pnpm build:next-ui
```

Expected: build completes with no errors. The `id` field on `IGRPMenuItemArgs` — if TypeScript complains that `id` may be `undefined`, update the key fallback: `key={result.id != null ? String(result.id) : result.name}`.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/menus/search-results.tsx
git commit -m "feat(next-ui): add SearchResults flat-list component for sidebar search"
```

---

## Task 3: Wire search input into IGRPTemplateMenus

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/menus/menus.tsx`

- [ ] **Step 1: Replace `menus.tsx` with the version that owns search state**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPIcon,
  Input,
  SidebarGroup,
  SidebarGroupContent,
} from '@igrp/igrp-framework-react-design-system';

import { buildMenuSections } from './utils';
import { SectionGroup } from './section-group';
import { SearchResults } from './search-results';

export type IGRPTemplateMenuArgs = { menus?: IGRPMenuItemArgs[] };

export function IGRPTemplateMenus({ menus = [] }: IGRPTemplateMenuArgs) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
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
      <SidebarGroup className={cn('group-data-[collapsible=icon]:hidden')}>
        <SidebarGroupContent>
          <div className={cn('relative')}>
            <IGRPIcon
              iconName="Search"
              className={cn(
                'absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground',
              )}
            />
            <Input
              type="search"
              placeholder="Pesquisar menus..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn('h-8 pl-8 text-xs')}
            />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>

      {query.trim() ? (
        <SearchResults sections={sections} query={query.trim()} pathname={pathname} />
      ) : (
        sections.map((section) => (
          <SectionGroup key={`grp-${section.key}`} section={section} pathname={pathname} />
        ))
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
pnpm build:next-ui
```

Expected: build completes with no errors. If `Input` is not found in the DS barrel, check the DS exports — it is listed as a primitive. If it's exported differently (e.g. `TextInput`), adjust the import name accordingly.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/menus/menus.tsx
git commit -m "feat(next-ui): add sidebar menu search input"
```

---

## Task 4: Smoke test + changeset

**Files:** None changed

- [ ] **Step 1: Run the demo template**

```powershell
pnpm dev:demo
```

Open `http://localhost:3000` in a browser.

- [ ] **Step 2: Verify GROUP collapse**

In the sidebar (expanded mode), click a GROUP section label. The chevron should rotate and the section's children should collapse. Click again to expand. Confirm all groups start expanded on load.

- [ ] **Step 3: Verify search — matching results**

Type a partial menu name in the search box (e.g. first 3 letters of a known menu item). Confirm:
- The grouped tree is replaced by a flat list
- Each result shows the item name on line 1 and the breadcrumb path (`Grupo › Folder`) on line 2
- Clicking a result navigates to the correct page

- [ ] **Step 4: Verify search — no results**

Type a string that matches nothing. Confirm `"Sem resultados."` appears.

- [ ] **Step 5: Verify search — clear**

Clear the input. Confirm the grouped tree reappears with groups in their default expanded state.

- [ ] **Step 6: Verify icon-collapsed mode**

Click the sidebar rail to collapse to icon mode. Confirm:
- Search input is hidden
- GROUP section labels/triggers are hidden
- Individual leaf and folder items still show their icons

- [ ] **Step 7: Create changeset**

```powershell
pnpm changeset
```

When prompted:
- Select `@igrp/framework-next-ui`
- Choose `patch`
- Summary: `feat: collapsible GROUP sections and inline menu search in sidebar`

- [ ] **Step 8: Commit the changeset**

```bash
git add .changeset/
git commit -m "chore: changeset for sidebar GROUP collapse + search"
```
