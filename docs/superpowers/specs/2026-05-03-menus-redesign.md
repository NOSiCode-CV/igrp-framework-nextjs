# Menus Redesign — `IGRPTemplateMenus`

**Date:** 2026-05-03  
**File:** `packages/framework/next-ui/src/components/templates/menus.tsx`  
**Status:** Approved, ready for implementation

---

## Problem

The current `menus.tsx` has structural issues:
- Rendering two separate `SidebarMenuItem`s per FOLDER (dropdown + collapsible) is entangled in the same component with no clear separation
- `isActive` uses `pathname.startsWith(normalizedHref)` which causes false positives (e.g. `/dashboard` matches `/dashboardX`)
- Link-type logic (anchor vs Next.js Link) is duplicated across `MenuItemWithSubmenus` and `SubMenuItem`
- No filtering of inactive items

---

## Goal

Rewrite `menus.tsx` from scratch using the two-pass **tree builder + type-dispatch renderer** approach (Approach B). The component receives `IGRPMenuItemArgs[]` and renders a sidebar navigation tree using shadcn sidebar primitives from `@igrp/igrp-framework-react-design-system`.

---

## Constraints

- Max tree depth: 2 levels (`GROUP → FOLDER → MENU_PAGE/EXTERNAL_PAGE`)
- Only `status === 'ACTIVE'` items are rendered
- `SYSTEM_PAGE` renders identically to `MENU_PAGE`
- FOLDER items must show a `DropdownMenu` in collapsed sidebar mode and a `Collapsible` in expanded mode (existing UX preserved)
- All sidebar primitives come from the DS — no new UI dependencies
- File stays `'use client'`

---

## Data Types

```ts
// IGRPMenuItemArgs (from @igrp/framework-next-types)
// type: 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE' | 'GROUP' | 'SYSTEM_PAGE'
// status: 'ACTIVE' | 'INACTIVE' | 'DELETED'
// target: '_self' | '_blank' | undefined

// File-private tree types
type LeafNode   = { kind: 'leaf';   item: IGRPMenuItemArgs }
type FolderNode = { kind: 'folder'; item: IGRPMenuItemArgs; children: LeafNode[] }
type TreeNode   = LeafNode | FolderNode
type Section    = { key: string; label?: string; nodes: TreeNode[] }
```

---

## Data Layer — Tree Builder

All data work happens inside a single `useMemo([menus])` in `IGRPTemplateMenus`. No other component touches the raw array.

**Steps:**

1. **Filter** — keep only `item.status === 'ACTIVE'`
2. **Sort** — ascending by `item.position`
3. **Partition** — top-level vs children:
   - Top-level: `parentCode` is null/empty/self, OR `parentCode` does not exist in the active set
   - Children: everything else
4. **childrenMap** — `Map<parentCode, LeafNode[]>` from the children partition
5. **Section assembly** — walk top-level items in order:
   - `GROUP` → new labeled `Section`; its `nodes` are the items in `childrenMap.get(item.code)`, each shaped into a `FolderNode` (if type is `FOLDER`, with its own children from the map) or `LeafNode`
   - Non-GROUP items → batched consecutively into a single unlabeled `Section`
6. **Output** — `Section[]`

---

## Rendering Layer — Components

### `IGRPTemplateMenus` (exported)
- Runs tree builder via `useMemo`
- Gets `pathname` via `usePathname()`
- Empty/no-active-menus → `Alert` with "Aplicação sem menus"
- Maps `Section[]` → `<SectionGroup>` elements

### `SectionGroup` (private)
- `SidebarGroup` wrapper
- Conditional `SidebarGroupLabel` when `section.label` exists
- `SidebarGroupContent > SidebarMenu` containing mapped `TreeNode`s
- Dispatches to `<LeafMenuItem>` or `<FolderMenuItem>` by `node.kind`

### `LeafMenuItem` (private)
- Handles: `MENU_PAGE`, `EXTERNAL_PAGE`, `SYSTEM_PAGE`
- `SidebarMenuItem > SidebarMenuButton asChild`
- Renders `IGRPIcon` when `item.icon` is truthy
- Uses `resolveHref` + `resolveAnchorTag` helpers to pick href and element type
- `isActive` passed to `SidebarMenuButton`

### `FolderMenuItem` (private)
- Handles: `FOLDER`
- Two sibling `SidebarMenuItem`s:
  1. **Collapsed mode** — `DropdownMenu` trigger, visible only via `group-data-[collapsible=icon]:flex`; children as `DropdownMenuItem`s wrapping links
  2. **Expanded mode** — `Collapsible` (shadcn pattern), hidden via `group-data-[collapsible=icon]:hidden`; children in `SidebarMenuSub > SidebarMenuSubItem > SidebarMenuSubButton`
- Renders `IGRPIcon` for the folder item when `item.icon` is truthy
- ChevronRight icon rotates 90° on open via `group-data-[state=open]/collapsible:rotate-90`

### `SubLeafLink` (private)
- Shared link renderer for child items inside a folder
- Props: `node: LeafNode`, `variant: 'dropdown' | 'collapsible'`
- Picks `DropdownMenuItem` wrapper or `SidebarMenuSubItem > SidebarMenuSubButton` wrapper by variant
- Uses same `resolveHref` + `resolveAnchorTag` helpers

---

## Link/URL Logic

### `resolveHref(item)` — pure function
```
if item.pageSlug  → ensure leading "/" → return
else if item.url  → igrpNormalizeUrl(item.url) → return
else              → return "#"
```

### `resolveAnchorTag(item, href)` — pure function
```
isExternal = !item.pageSlug && !!item.url && igrpIsExternalUrl(item.url)
return isExternal || item.target === '_blank'
```

When `useAnchorTag = true`:
- Element: `<a href={href} target={item.target ?? '_blank'} rel="noopener noreferrer" />`

When `useAnchorTag = false`:
- Element: `<Link href={href} />`

### Active State
```
isActive = !useAnchorTag
        && href !== '#'
        && (pathname === href || pathname.startsWith(href + '/'))
```
The `+ '/'` suffix prevents false prefix matches.

---

## Icons

`IGRPIcon iconName={item.icon}` is rendered for `FOLDER`, `MENU_PAGE`, `EXTERNAL_PAGE`, and `SYSTEM_PAGE` when `item.icon` is truthy. `GROUP` items never get an icon.

---

## Empty / Error State

When `menus` is empty or no items pass the `ACTIVE` filter:
```tsx
<Alert variant="destructive">
  <IGRPIcon iconName="CircleAlert" />
  <AlertDescription>Aplicação sem menus.</AlertDescription>
</Alert>
```

---

## What Changes vs Current File

| Concern | Current | New |
|---|---|---|
| Inactive items | Rendered | Filtered out |
| `isActive` false positives | `startsWith(href)` | `startsWith(href + '/')` |
| Link-type logic | Duplicated in 2 components | `resolveHref` + `resolveAnchorTag` helpers |
| Tree shape | Implicit via `childrenMap` passed to renderers | Explicit `Section[] / TreeNode` types |
| Component count | 3 (MenuItemWithSubmenus, SubMenuItem + root) | 5 focused components |
| SYSTEM_PAGE | Not handled | Renders as MENU_PAGE |

---

## Out of Scope

- Nested FOLDERs (confirmed max depth = 2)
- Animated transitions beyond ChevronRight rotation
- Role/department-based filtering (handled upstream by the API)
