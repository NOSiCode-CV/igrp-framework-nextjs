# Sidebar GROUP Collapse + Menu Search

**Package:** `@igrp/framework-next-ui`  
**Date:** 2026-06-16  
**Status:** Approved

## Overview

Two enhancements to the sidebar menu tree in `packages/framework/next-ui/src/components/templates/menus/`:

1. **Collapsible GROUP sections** — `GROUP`-type menu items (which become labeled `SidebarGroup` sections) gain a collapse/expand toggle.
2. **Sidebar menu search** — an inline search input above the menus filters items and shows a flat results list.

---

## Feature 1: Collapsible GROUP Sections

### Scope

`GROUP` items are currently rendered as permanent labeled `SidebarGroup` sections via `SectionGroup`. This feature makes those sections collapsible.

Sections without a label (the unlabeled root bucket for items that have no `GROUP` parent) are **not** collapsible — they render exactly as today.

### Behavior

- Default state: **all expanded** (`defaultOpen={true}`).
- State is uncontrolled (Radix manages open/closed internally — no `localStorage`, no controlled `useState`).
- The GROUP label row becomes a clickable trigger. A chevron icon sits at the end of the label row: points right when collapsed, rotates 90° when expanded.
- In icon-collapsed sidebar mode (`data-[collapsible=icon]`), the trigger row is hidden via `group-data-[collapsible=icon]:hidden` — same pattern used by `FolderMenuItem`.

### File Changed

**`section-group.tsx`**

When `section.label` is present, wrap the section content in a `Collapsible`. The label becomes a `CollapsibleTrigger` rendered as a `<button>` styled to match the existing `SidebarGroupLabel` appearance. `CollapsibleContent` wraps the `SidebarGroupContent` + `SidebarMenu`.

```
Collapsible (defaultOpen)
  CollapsibleTrigger (button, hidden in icon mode)
    [label text]
    IGRPIcon ChevronRight (rotates on open)
  CollapsibleContent
    SidebarGroupContent
      SidebarMenu
        [nodes as before]
```

**New DS imports:** `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`, `IGRPIcon`.

---

## Feature 2: Sidebar Menu Search

### Placement

Search input renders at the **top of `SidebarContent`**, directly above the menu sections (inside `IGRPTemplateMenus`). Hidden in icon-collapsed mode via `group-data-[collapsible=icon]:hidden`.

### Search Behavior

- Empty query → render the normal `SectionGroup` tree as today. No change to existing behavior.
- Non-empty query → replace the tree with a **flat results list** (`SearchResults` component).
- Match: **case-insensitive substring** on `item.name`.
- **Search scope:** navigable leaf items only. Folder names and GROUP names are excluded (they have no destination URL). This covers both top-level leaf nodes and children of folder nodes.
- Each result shows:
  - Item name (line 1)
  - Breadcrumb path in `text-muted-foreground text-xs` (line 2): e.g. `Grupo A › Documentos` — omits undefined labels, omits the item name itself.
- Zero matches → shows `"Sem resultados."` in muted text.
- Clicking a result navigates exactly as a `LeafMenuItem` would (same `resolveHref` / `resolveAnchorTag` / `ACTIVE_MENU_ITEM_CLASS` logic from `utils.ts`).

### Files Changed / Added

**`menus.tsx`** (modified)
- Add `useState<string>('')` for `query`.
- Render a search input at the top (DS `Input` primitive) with a `Search` icon prefix, hidden in icon mode.
- When `query.trim()` is empty: render `SectionGroup` list as before.
- When non-empty: render `<SearchResults sections={sections} query={query} pathname={pathname} />`.
- `IGRPTemplateMenus` prop signature is **unchanged** — `{ menus?: IGRPMenuItemArgs[] }`.

**`search-results.tsx`** (new)
- Props: `sections: Section[]`, `query: string`, `pathname: string`.
- Computes flat matches by iterating sections → nodes → leaves.
  - Top-level leaf node: breadcrumb = `[section.label]`
  - Child of folder node: breadcrumb = `[section.label, folder.item.name]`
  - Breadcrumb parts that are `undefined` are filtered out.
- Renders: `SidebarGroup` → `SidebarMenu` of `SidebarMenuItem` entries.
- Each entry: `SidebarMenuButton asChild` wrapping a `Link` or `<a>` (same anchor/external logic as `LeafMenuItem`), with item name + breadcrumb subtitle.
- Empty state: `"Sem resultados."` in muted text.
- File is not exported from the package index — it is a private sibling component inside `menus/`.

---

## Files Summary

| File | Action |
|---|---|
| `menus/section-group.tsx` | Modify — add `Collapsible` wrap for labeled sections |
| `menus/menus.tsx` | Modify — add search `useState`, input, conditional render |
| `menus/search-results.tsx` | New — flat results list component |
| `menus/utils.ts` | No change |
| `menus/folder-menu-item.tsx` | No change |
| `menus/leaf-menu-item.tsx` | No change |
| `menus/sub-leaf-link.tsx` | No change |
| `menus/index.ts` | No change |
| `sidebar.tsx` | No change |

## Public API Impact

None. `IGRPTemplateMenus` and `IGRPTemplateSidebar` props are unchanged. `search-results.tsx` is not exported. A changeset (`patch`) is required for `@igrp/framework-next-ui`.
