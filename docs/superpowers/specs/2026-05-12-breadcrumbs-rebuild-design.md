# IGRPTemplateBreadcrumbs Rebuild — Design Spec

**Date:** 2026-05-12
**Audience:** Fidel (internal reference)
**Scope:** Rebuild `IGRPTemplateBreadcrumbs` with controlled-first architecture, replace `usePathname()` with `useSelectedLayoutSegments()`, wire server-resolved items through the header and layout

---

## Problem statement

The current `IGRPTemplateBreadcrumbs` derives labels exclusively from `usePathname()` — a URL string. URL segments are technical identifiers, not human-readable labels. The component compensates with `customLabels` and `formatLabel` escape hatches bolted on at the usage site, but these require the consumer to know all possible segment values upfront — impossible for dynamic routes (user IDs, app slugs, department names).

The root fix is architectural: make the component a **renderer** that accepts pre-resolved items from a server component, with URL-parsing as a zero-config fallback — not the primary mechanism.

---

## Approach chosen: Controlled-first, `useSelectedLayoutSegments()` fallback

Two modes in one component:

1. **Controlled mode** — caller passes `items: BreadcrumbItem[]` resolved server-side. No URL logic runs. Dynamic labels (user names, app names) work correctly because the server component has params and can fetch data.

2. **Auto-derive mode** — when `items` is not provided, uses `useSelectedLayoutSegments()` + `routeLabels` config. Better than `usePathname()` because it is route-context aware and handles edge cases (parallel routes, route groups) correctly.

`generateMetadata` and `routeLabels` share the same source of truth for static route labels. Dynamic route labels come from server-fetched data, deduplicated by React `cache()`.

---

## Component API

### `BreadcrumbItem` (exported)

```typescript
export interface BreadcrumbItem {
  label: string;
  href: string;
}
```

Exported from `@igrp/framework-next-ui` so server layouts can type their item arrays.

### `IGRPTemplateBreadcrumbsProps`

```typescript
interface IGRPTemplateBreadcrumbsProps {
  // ── Controlled mode ──────────────────────────────────────────────────────
  /**
   * Pre-resolved breadcrumb items. When provided, all URL logic is skipped.
   * Pass from a server component that has access to route params and can fetch
   * data. Home item is always rendered by the component — do not include it.
   */
  items?: BreadcrumbItem[];

  // ── Auto-derive mode (used when items is not provided) ────────────────────
  /**
   * App-level route → label map. Keys are full hrefs.
   * Define once in a shared config; import the same object in generateMetadata
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
   * Wrap in useCallback to avoid triggering recompute on every parent render.
   */
  formatLabel?: (segment: string, href: string) => string | undefined;

  // ── Presentation (unchanged) ──────────────────────────────────────────────
  className?: string;
  /** Screen-reader label for the home icon. Defaults to 'Home' */
  homeLabel?: string;
  /** Home link destination. Defaults to '/' */
  homeHref?: string;
  /** Collapse threshold (item count). Defaults to 4 */
  maxItems?: number;
  /** Items visible after the ellipsis when collapsed. Defaults to 1 */
  itemsAfterCollapse?: number;
}
```

**Removed:** `customLabels` — replaced by `routeLabels` (full-path keys only) + `formatLabel` (segment escape hatch). Any consumer using `customLabels` migrates to these two props.

---

## Data flow

```
items prop provided?
  YES → render directly — skip all URL logic
  NO  → auto-derive via useSelectedLayoutSegments():
          1. Filter route-group segments (/^\(.*\)$/)
          2. Accumulate href per segment (/a, /a/b, /a/b/c)
          3. Resolve label per segment:
               a. routeLabels[href]           — app config, exact path
               b. formatLabel(segment, href)  — callback escape hatch
               c. formatSegmentLabel(segment) — auto-format fallback
```

The `BreadcrumbItem[]` that reaches the renderer is identical in shape regardless of which path produced it. All collapse/overflow/dropdown rendering logic is untouched.

### Why `useSelectedLayoutSegments()` instead of `usePathname()`

`useSelectedLayoutSegments()` is the semantically correct tool:
- Returns `string[]` — no manual split needed
- Filters parallel route segments (`@slot`) automatically
- Is route-context aware — relative to the layout where it is called
- Handles route groups correctly (though route groups do not appear in URLs anyway, so the practical difference is small for IGRP apps)

---

## Header wiring

`IGRPTemplateHeader` adds two new props and forwards them to `IGRPTemplateBreadcrumbs`:

```typescript
interface IGRPTemplateHeaderProps {
  // ... all existing props unchanged ...
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbRouteLabels?: Record<string, string>;
}
```

Inside the header, the breadcrumb render changes from:
```tsx
<IGRPTemplateBreadcrumbs />
```
to:
```tsx
<IGRPTemplateBreadcrumbs
  items={breadcrumbs}
  routeLabels={breadcrumbRouteLabels}
/>
```

`IGRPLayout` (from `@igrp/framework-next`) accepts the same two props and passes them through to the header. `IGRPLayoutConfigArgs` (from `@igrp/framework-next-types`) is extended accordingly. No logic change — pure prop pass-through.

---

## Consuming patterns

### Static routes — `routeLabels` once at the root layout

```ts
// src/route-labels.ts — shared config
export const ROUTE_LABELS = {
  '/settings': 'Settings',
  '/settings/users': 'User Management',
  '/settings/departments': 'Departments',
}
```

```tsx
// src/app/(igrp)/layout.tsx — server component
import { ROUTE_LABELS } from '@/route-labels'

export default async function IGRPRootLayout({ children }) {
  const config = await configLayout();
  return (
    <IGRPLayout {...config} breadcrumbRouteLabels={ROUTE_LABELS}>
      {children}
    </IGRPLayout>
  );
}
```

```tsx
// src/app/(igrp)/settings/users/page.tsx
import { ROUTE_LABELS } from '@/route-labels'

export const metadata = { title: ROUTE_LABELS['/settings/users'] }
// Same label, zero duplication
```

### Dynamic routes — `items` from a nested server layout

```tsx
// src/app/(igrp)/users/[id]/layout.tsx — server component
export default async function UserLayout({ children, params }) {
  const user = await getUser(params.id); // React cache() deduplicates with generateMetadata
  return (
    <IGRPLayout
      breadcrumbs={[
        { label: 'Users', href: '/users' },
        { label: user.name, href: `/users/${params.id}` },
      ]}
    >
      {children}
    </IGRPLayout>
  );
}

export async function generateMetadata({ params }) {
  const user = await getUser(params.id); // cache hit — no second fetch
  return { title: user.name };
}
```

### Zero config — existing behavior preserved

```tsx
// No props — auto-derive from useSelectedLayoutSegments() with auto-formatting
<IGRPTemplateBreadcrumbs />
```

---

## Files changed

| File | Package | Change |
|------|---------|--------|
| `src/components/templates/breadcrumbs.tsx` | `framework-next-ui` | `items`, `routeLabels`, `useSelectedLayoutSegments()`, export `BreadcrumbItem`, remove `customLabels` |
| `src/components/templates/header.tsx` | `framework-next-ui` | Add `breadcrumbs` + `breadcrumbRouteLabels` props, forward to breadcrumb |
| `src/index.ts` | `framework-next-ui` | Export `BreadcrumbItem` type |
| `src/igrp-layout.tsx` | `framework-next` | Pass-through `breadcrumbs` + `breadcrumbRouteLabels` to header |
| `src/types/igrp.ts` | `framework-next-types` | Add `breadcrumbs?` + `breadcrumbRouteLabels?` to `IGRPLayoutConfigArgs` |

Build order: `next-types` → `next` → `next-ui` (`pnpm build:framework`, skipping `next-auth` and `design-system`).

---

## Backward compatibility

| | Status |
|---|---|
| `<IGRPTemplateBreadcrumbs />` no props | ✅ Unchanged — auto-derive mode |
| `formatLabel` prop | ✅ Kept, works in auto mode |
| `homeLabel`, `homeHref`, `maxItems`, `itemsAfterCollapse`, `className` | ✅ Unchanged |
| Collapse / overflow / dropdown logic | ✅ Untouched |
| `customLabels` prop | ❌ Removed — migrate to `routeLabels` + `formatLabel` |

`customLabels` removal is the only breaking change. Consumers using it migrate by moving full-href keys to `routeLabels` and segment-level overrides to `formatLabel`.
