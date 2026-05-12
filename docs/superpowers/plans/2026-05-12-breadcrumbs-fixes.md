# IGRPTemplateBreadcrumbs — Bug Fixes & formatLabel Prop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three known bugs in `IGRPTemplateBreadcrumbs` and add a `formatLabel` callback prop for dynamic route segments.

**Architecture:** All changes are confined to one source file (`packages/framework/next-ui/src/components/templates/breadcrumbs.tsx`) plus the package's public type export. The `formatLabel` prop is additive and fully backward-compatible — no consumer changes required. After changes, the package must be rebuilt with `pnpm build:next-ui` before the template can consume it.

**Tech Stack:** React 19, TypeScript, Next.js 15, `@igrp/framework-next-ui`, pnpm workspace monorepo.

---

## File map

| File | Action |
|------|--------|
| `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx` | Modify — all three fixes + new prop |

---

## Bug reference

| # | Bug | Location |
|---|-----|----------|
| B1 | Key collision in flat render — key is `item.href`, should include index | `breadcrumbItems.map(…)` call in render |
| B2 | `isMobile` missing from `useEffect` deps — stale collapse state after mobile ↔ desktop resize | `useEffect` dep array |
| B3 | No way to format dynamic segment labels (IDs, UUIDs) — needs `formatLabel` callback prop | `useMemo` label resolution + props interface |

---

## Task 1: Fix key collision (B1) and missing `isMobile` dep (B2)

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx`

- [ ] **Step 1: Open the file and locate the two lines to change**

File: `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx`

**B1 — Key collision fix:** Find the flat render path (around line 212). Current:
```tsx
breadcrumbItems.map((item, index) => {
  const isLast = index === breadcrumbItems.length - 1;
  return renderBreadcrumbItem(item, isLast, item.href);
})
```

Change the key argument from `item.href` to include the index:
```tsx
breadcrumbItems.map((item, index) => {
  const isLast = index === breadcrumbItems.length - 1;
  return renderBreadcrumbItem(item, isLast, `${item.href}-${index}`);
})
```

**B2 — Missing dep fix:** Find the `useEffect` dep array (around line 135). Current:
```ts
}, [breadcrumbItems, shouldCheckOverflow]);
```

Add `isMobile`:
```ts
}, [breadcrumbItems, shouldCheckOverflow, isMobile]);
```

- [ ] **Step 2: Verify the file type-checks**

```powershell
cd D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs
pnpm exec tsc -p packages/framework/next-ui/tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build the package**

```powershell
pnpm build:next-ui
```

Expected: build completes with no errors. Last line should be something like `Done in Xs`.

- [ ] **Step 4: Commit**

```powershell
git add packages/framework/next-ui/src/components/templates/breadcrumbs.tsx
git commit -m "fix(next-ui): fix breadcrumb key collision and missing isMobile effect dep"
```

---

## Task 2: Add `formatLabel` callback prop (B3)

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx`

This task adds an optional `formatLabel?: (segment: string, href: string) => string | undefined` prop. It slots into the label resolution chain *before* `customLabels` and `formatSegmentLabel`, giving consumers full control over dynamic segments (IDs, UUIDs, slugs) without having to know all possible values upfront.

Label resolution order after this change:
1. `formatLabel(segment, href)` — if defined and returns a string, use it
2. `customLabels[segment]` — static segment override
3. `customLabels[href]` — full-path override
4. `formatSegmentLabel(segment)` — auto-format fallback

- [ ] **Step 1: Add `formatLabel` to the props interface**

Find `IGRPTemplateBreadcrumbsProps` (around line 28). Add the new prop after `itemsAfterCollapse`:

```typescript
interface IGRPTemplateBreadcrumbsProps {
  className?: string;
  /**
   * Custom labels for specific path segments.
   * Key should be the path segment (e.g., 'users' or '/users/123')
   */
  customLabels?: Record<string, string>;
  /**
   * Custom home label. Defaults to 'Home'
   */
  homeLabel?: string;
  /**
   * Custom home href. Defaults to '/'
   */
  homeHref?: string;
  /**
   * Maximum number of items to show before collapsing. Defaults to 4
   */
  maxItems?: number;
  /**
   * Number of items to show at the end when collapsed. Defaults to 1
   */
  itemsAfterCollapse?: number;
  /**
   * Custom label formatter called for every path segment before falling back
   * to customLabels or auto-formatting.
   *
   * @param segment - raw path segment, e.g. 'a1b2c3-f4e5'
   * @param href    - accumulated href for this segment, e.g. '/users/a1b2c3-f4e5'
   * @returns a display string, or undefined to fall through to the next resolver
   *
   * @example
   * // Fetch label from a cache populated by your data layer
   * formatLabel={(segment, href) => userCache.get(href)?.name}
   */
  formatLabel?: (segment: string, href: string) => string | undefined;
}
```

- [ ] **Step 2: Destructure `formatLabel` in the function signature**

Find the function signature (around line 62):
```typescript
function IGRPTemplateBreadcrumbs({
  className,
  customLabels = {},
  homeLabel = 'Home',
  homeHref = '/',
  maxItems = 4,
  itemsAfterCollapse = 1,
}: IGRPTemplateBreadcrumbsProps) {
```

Add `formatLabel` (no default needed — `undefined` is the correct default):
```typescript
function IGRPTemplateBreadcrumbs({
  className,
  customLabels = {},
  homeLabel = 'Home',
  homeHref = '/',
  maxItems = 4,
  itemsAfterCollapse = 1,
  formatLabel,
}: IGRPTemplateBreadcrumbsProps) {
```

- [ ] **Step 3: Use `formatLabel` in the `useMemo` label resolution**

Find the `useMemo` block (around line 75). Current label line:
```typescript
const label = customLabels[segment] ?? customLabels[href] ?? formatSegmentLabel(segment);
```

Replace with:
```typescript
const label =
  formatLabel?.(segment, href) ??
  customLabels[segment] ??
  customLabels[href] ??
  formatSegmentLabel(segment);
```

Also add `formatLabel` to the `useMemo` dependency array. Current:
```typescript
}, [pathname, homeHref, customLabels]);
```

Replace with:
```typescript
}, [pathname, homeHref, customLabels, formatLabel]);
```

- [ ] **Step 4: Verify the file type-checks**

```powershell
cd D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs
pnpm exec tsc -p packages/framework/next-ui/tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 5: Build the package**

```powershell
pnpm build:next-ui
```

Expected: build completes with no errors.

- [ ] **Step 6: Smoke-test in the demo template**

```powershell
pnpm dev:demo
```

Navigate to any nested route (e.g. `/settings/applications`). Verify:
- Breadcrumbs still render correctly without passing `formatLabel`
- No console errors or hydration warnings

Then add a temporary `formatLabel` to the breadcrumbs usage in the demo template to verify it works:
```tsx
<IGRPTemplateBreadcrumbs
  formatLabel={(segment, href) => {
    if (href === '/settings/applications') return 'My Applications';
    return undefined; // fall through for everything else
  }}
/>
```

Expected: the `/settings/applications` breadcrumb segment shows "My Applications" instead of the auto-formatted label. Revert the temporary change after verifying.

- [ ] **Step 7: Commit**

```powershell
git add packages/framework/next-ui/src/components/templates/breadcrumbs.tsx
git commit -m "feat(next-ui): add formatLabel prop to IGRPTemplateBreadcrumbs for dynamic segments"
```

---

## After both tasks: create changeset and rebuild

- [ ] **Step 1: Create a changeset**

```powershell
cd D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs
pnpm changeset
```

When prompted:
- Select `@igrp/framework-next-ui` (space to select, enter to confirm)
- Choose `patch` (NEVER major or minor — hard rule)
- Summary: `fix(breadcrumbs): fix key collision and isMobile dep; add formatLabel prop for dynamic segments`

- [ ] **Step 2: Commit the changeset**

```powershell
git add .changeset/
git commit -m "chore: changeset for breadcrumbs fixes"
```
