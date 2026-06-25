---
"@igrp/framework-next-ui": patch
---

refactor(next-ui): extract a shared MenuItemLink for the sidebar menu surfaces

The identical `isAnchor ? <a> : <Link>` branch in `leaf-menu-item`, `sub-leaf-link`, and `search-results` is now a single internal `MenuItemLink` (forwardRef, single root element) so it still composes with the Radix `asChild` Slots (SidebarMenuButton / SidebarMenuSubButton / DropdownMenuItem). Pure dedup with no behavior change: external links still open in a new tab with `rel="noopener noreferrer"`, `aria-current="page"` and each call site's `aria-label`/`className` are preserved exactly, and active highlighting is unchanged. Internal component only — not added to the public export surface.
