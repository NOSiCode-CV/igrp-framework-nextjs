---
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
---

feat(breadcrumbs): controlled-first architecture with useSelectedLayoutSegments fallback

IGRPTemplateBreadcrumbs now accepts `items?: BreadcrumbItem[]` for server-resolved labels (dynamic routes, user names, etc.) and `routeLabels?: Record<string, string>` as a shared config for static routes. When `items` is not provided, auto-derive mode uses `useSelectedLayoutSegments()` instead of `usePathname()` — route-context aware and handles parallel routes and route groups correctly.

IGRPTemplateHeader gains `breadcrumbs` and `breadcrumbRouteLabels` props that forward to the breadcrumb component. IGRPLayout (framework-next) accepts and threads the same props through HeaderDataProvider to the header, enabling server layouts to inject pre-resolved items at any nesting level.

`BreadcrumbItem` is now exported from `@igrp/framework-next-ui` for server component type annotations.

Breaking: `customLabels` prop removed — migrate to `routeLabels` (full-href keys) and `formatLabel` (segment escape hatch).
