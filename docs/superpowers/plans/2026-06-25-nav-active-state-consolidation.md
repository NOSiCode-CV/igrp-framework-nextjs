# Nav Active-State Consolidation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **STATUS: DEFERRED — DO NOT START until the `features/check-permissions` work is merged.** This spec was written 2026-06-25 from a review of `breadcrumbs.tsx` + the sidebar menu surfaces against an external NavLink article. Nothing here is urgent; it is banked follow-up polish for `@igrp/framework-next-ui`.

**Goal:** Tidy the framework's active-link / nav-chrome surfaces in `@igrp/framework-next-ui` — dedupe the duplicated `<a>`/`<Link>` rendering across the three sidebar menu surfaces, fix one real memo nit in breadcrumbs, and document two latent risks (cacheComponents, rewrites) — without changing public behavior.

**Architecture:** All work lives in `packages/framework/next-ui/src`. The matcher (`isItemActive`) is already shared via `menus/utils.ts`; the duplication is purely the anchor-vs-Link JSX in three files. We extract one internal `MenuItemLink` component that renders a **single** root element (so it composes with the Radix `asChild` Slots the sidebar uses) and migrate the three call sites onto it. Breadcrumbs get a stable default-prop fix plus doc comments. No new public API unless Workstream 2B is explicitly green-lit.

**Tech Stack:** React 19 (client), Next.js 15 (`next/link`, `usePathname`, `useSelectedLayoutSegments`, `useLinkStatus`), Radix Slot (`asChild`), Tailwind v4 tokens, `@igrp/igrp-framework-react-design-system` primitives. Build: SWC + Babel (React Compiler). No unit-test runner in this package.

## Global Constraints

- **pnpm only**, Node ≥ 22. Internal deps are `workspace:*`.
- **Edit `src/` only — never `dist/`.** `@igrp/framework-next-ui` builds to `dist/`.
- **Lint/format = ESLint + Prettier** for this package (NOT Biome). Format with `pnpm --filter @igrp/framework-next-ui format`.
- **Changeset per shipped user-visible change**, and the type **MUST be `patch`** (repo is in `beta` pre-release mode; `major`/`minor` break the `0.1.0-beta.*` pattern). `pnpm changeset`.
- **Build after changes:** `pnpm build:next-ui`. This is the primary verification gate (typecheck via `build:types` + SWC + React Compiler). Only run `pnpm build:framework` if a public export is added (Workstream 2B).
- **No release/publish** as part of this plan. Releasing requires separate, explicit per-task authorization from the maintainer.
- **Branch:** create a fresh branch off `dev` (e.g. `features/nav-active-state-polish`). **Do NOT add any of this to `features/check-permissions`.**
- **Verification is build + visual**, not unit tests — this package has no test runner. Each task that changes rendering ends with a `pnpm dev:demo` preview check of the sidebar/breadcrumbs.
- These workstreams touch **`next-ui` only, not the template** — so the template-migrator migration rule does **not** apply here. (If a future task edits `templates/demo-legacy`, that rule re-engages.)

---

## Pre-Flight (run first, when this is picked up)

The codebase will have moved on after the permissions work. Re-confirm the four findings this plan rests on before writing any code. If any has changed, update the affected workstream.

- [ ] **P1 — Test runner still absent.** Confirm there is still no test script and no test files:
  - Run: `Grep` for `*.{test,spec}.{ts,tsx}` under `packages/framework/next-ui/` → expect none.
  - Read `packages/framework/next-ui/package.json` `scripts` → expect no `test`.
  - If a runner now exists, add real unit tests to each task instead of relying solely on build + preview.
- [ ] **P2 — Template still has the loading boundary.** Confirm `templates/demo-legacy/src/app/(igrp)/loading.tsx` exists. If it does, Workstream 3 (pending feedback) stays **optional/low-priority**. If it was removed, re-evaluate.
- [ ] **P3 — Still `basePath`, not `rewrites`.** Read `templates/demo-legacy/next.config.ts`. Expect `basePath` from `NEXT_PUBLIC_BASE_PATH` and **no `rewrites`/proxy**. If rewrites were added, Workstream 4 escalates from doc-only to a real fix (migrate menu matching to `useSelectedLayoutSegments`).
- [ ] **P4 — The three call sites still share `isItemActive`.** Confirm `leaf-menu-item.tsx`, `sub-leaf-link.tsx`, and `search-results.tsx` still import `isItemActive`/`resolveHref`/`resolveAnchorTag` from `./utils` and still branch on `isAnchor` between `<a>` and `<Link>`.

---

## Scope Note

This is one document covering four loosely-related workstreams. Each ships independently and is independently revertable — do them in any order, or drop any of them:

| # | Workstream | Value | Risk | Default call |
|---|---|---|---|---|
| 1 | Breadcrumbs polish (memo fix + doc comments + optional CLS) | Low (1 real perf nit) | Very low | Do 1A; 1B optional; 1C investigate-only |
| 2A | Dedupe menu link rendering → internal `MenuItemLink` | Medium (DRY, one place for a11y/pending later) | Low (mechanical, zero behavior change) | Do it |
| 2B | Expose a **public** `IGRPNavLink` (article's render-prop component) | Low (no current consumer) | Medium (new public API) | **Skip** unless a real consumer need appears (YAGNI) |
| 3 | Per-link `useLinkStatus` pending indicator | Low (loading.tsx already covers transitions) | Low | **Defer** unless per-item affordance is requested |
| 4 | Document rewrite assumption in menu matcher | Low (doc only) | None | Do it (cheap) |

---

## Task 1A: Stabilize the `routeLabels` default in breadcrumbs

The `useMemo` at `breadcrumbs.tsx:93` lists `routeLabels` as a dependency, but the default param `routeLabels = {}` (`:81`) creates a fresh object every render. When a consumer omits the prop (the common case), the memo's dependency identity changes every render and the memo never hits. React Compiler can't fix this — a new `{}` is a new input. Fix: default to a stable module-level constant.

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx` (add a module const near `:69`; change default at `:81`)

**Interfaces:**
- Consumes: nothing new.
- Produces: no API change. `IGRPTemplateBreadcrumbsProps` is unchanged; the default value behind `routeLabels` becomes a shared frozen reference.

- [ ] **Step 1: Add a module-level stable empty map.** Place this just above `function formatSegmentLabel` (around `breadcrumbs.tsx:69`):

```tsx
/** Stable reference so the default does not bust the useMemo dependency every render. */
const EMPTY_ROUTE_LABELS: Record<string, string> = {};
```

- [ ] **Step 2: Use it as the default.** Change the destructured default at `breadcrumbs.tsx:81` from:

```tsx
  routeLabels = {},
```

to:

```tsx
  routeLabels = EMPTY_ROUTE_LABELS,
```

- [ ] **Step 3: Extend the `routeLabels` JSDoc with the inline-object caveat.** In the `routeLabels?` doc block (`breadcrumbs.tsx:43-52`), append a line mirroring the existing `formatLabel` guidance:

```
   * Define this object once at module scope (or memoize it). Passing a fresh
   * object literal on every render re-runs the breadcrumb computation.
```

- [ ] **Step 4: Verify typecheck + build pass.**

Run: `pnpm build:next-ui`
Expected: completes with no TypeScript errors; `dist/` regenerated.

- [ ] **Step 5: Add a patch changeset.**

Run: `pnpm changeset`
- Select `@igrp/framework-next-ui`, type **patch**.
- Summary: `fix(next-ui): stabilize IGRPTemplateBreadcrumbs routeLabels default so the memo is not busted every render`

- [ ] **Step 6: Commit.**

```bash
git add packages/framework/next-ui/src/components/templates/breadcrumbs.tsx .changeset
git commit -m "fix(next-ui): stable routeLabels default in breadcrumbs"
```

---

## Task 1B (optional): cacheComponents readiness comment in breadcrumbs

Doc-only. Under Next's `cacheComponents`/PPR, `useSelectedLayoutSegments()` becomes a dynamic read; rendering it inside a statically-cached shell without a `<Suspense>` boundary above is a runtime error. Today the `(igrp)` shell is dynamically rendered (auth/session), so this does not bite — but a future flag flip would surface it silently. Leave a breadcrumb (pun intended) for the next reader. No behavior change → **no changeset required** (source comment only).

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx` (comment near `:88-89`)

- [ ] **Step 1: Add the note above the `useSelectedLayoutSegments()` call** (`breadcrumbs.tsx:88`):

```tsx
  // Always call — hooks cannot be conditional. Ignored when items is provided.
  // Under Next `cacheComponents`/PPR this becomes a DYNAMIC read: if a consumer
  // enables it and this renders inside a statically-cached shell, wrap the
  // component in <Suspense> (a fallback can reuse controlled mode with items={[]}).
  const segments = useSelectedLayoutSegments();
```

- [ ] **Step 2: Verify build.**

Run: `pnpm build:next-ui`
Expected: passes (comment-only change).

- [ ] **Step 3: Commit (fold into Task 1A's commit if done together).**

```bash
git add packages/framework/next-ui/src/components/templates/breadcrumbs.tsx
git commit -m "docs(next-ui): note cacheComponents Suspense requirement in breadcrumbs"
```

---

## Task 1C (investigate-only): breadcrumb collapse CLS flash

**Do not write a fix blindly.** `shouldCollapse` (`breadcrumbs.tsx:124`) depends on `isOverflowing`, which starts `false` and flips `true` only after `useBreadcrumbOverflow`'s `ResizeObserver` measures post-mount (`use-breadcrumb-overflow.ts:13-17`). On a wide trail in a narrow container this renders **expanded → then snaps to collapsed** — a layout shift. The count-based path (`length > maxItems`) is deterministic at SSR and does **not** flash; only the width-based and `isMobile` paths do.

**Files:**
- Investigate: `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx`, `packages/framework/next-ui/src/hooks/use-breadcrumb-overflow.ts`

- [ ] **Step 1: Reproduce in the preview.** `pnpm dev:demo`, navigate to a deep route, narrow the window, and watch the breadcrumb on load/resize. Confirm whether the flash is actually perceptible. If it is not, **stop here and close this task as won't-fix** (record the decision).
- [ ] **Step 2: If perceptible, choose one approach and spec it as its own task before implementing:**
  - **(a) Accept** — lowest effort; the row has `overflow-hidden` already so it clips rather than reflowing horizontally.
  - **(b) Collapse-first** — when `breadcrumbItems.length > maxItems`, render collapsed immediately (already deterministic); only the pure width-overflow case (count ≤ maxItems but too wide) would still settle after measure. Inverts the flash to the rarer case.
  - **(c) CSS-only** — reserve height / use container queries so JS measurement never changes block height. Most work, best result.
- [ ] **Step 3: If implemented, add a patch changeset** (`fix(next-ui): avoid breadcrumb collapse layout shift on first paint`) and verify with `pnpm build:next-ui` + preview.

---

## Task 2A: Extract internal `MenuItemLink` and migrate the three sidebar surfaces

`leaf-menu-item.tsx`, `sub-leaf-link.tsx`, and `search-results.tsx` each repeat the same `isAnchor ? <a …> : <Link …>` branch (external link with `target`/`rel`/`aria-current` vs internal `next/link` with `aria-current`). Extract it once. **Constraint:** all three render this link as the child of a Radix `asChild` Slot (`SidebarMenuButton`, `SidebarMenuSubButton`, `DropdownMenuItem`), so the extracted component must render a **single root element**, `forwardRef`, and spread all extra props (`className`, `aria-label`, …) onto it. This is a pure mechanical dedup with **zero behavior change** — each call site keeps passing its own `aria-label`, `className`, and inner content.

**Files:**
- Create: `packages/framework/next-ui/src/components/templates/menus/menu-item-link.tsx`
- Modify: `packages/framework/next-ui/src/components/templates/menus/leaf-menu-item.tsx`
- Modify: `packages/framework/next-ui/src/components/templates/menus/sub-leaf-link.tsx`
- Modify: `packages/framework/next-ui/src/components/templates/menus/search-results.tsx`

**Interfaces:**
- Produces: `MenuItemLink` (internal to the `menus/` folder — **not** re-exported from `src/index.ts`):
  ```tsx
  interface MenuItemLinkProps extends React.ComponentPropsWithoutRef<'a'> {
    href: string;
    isAnchor: boolean;
    isActive: boolean;
    target?: string;
    children: React.ReactNode;
  }
  const MenuItemLink: React.ForwardRefExoticComponent<
    MenuItemLinkProps & React.RefAttributes<HTMLAnchorElement>
  >;
  ```
  Behavior: `isAnchor` → `<a target={target ?? '_blank'} rel="noopener noreferrer">`; else `<Link>`. Sets `aria-current="page"` iff `isActive`. Forwards `ref` and all `...rest` (incl. `className`, `aria-label`) onto the single root.

- [ ] **Step 1: Create `MenuItemLink`.**

`packages/framework/next-ui/src/components/templates/menus/menu-item-link.tsx`:

```tsx
'use client';

import { forwardRef } from 'react';
import Link from 'next/link';

interface MenuItemLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  href: string;
  isAnchor: boolean;
  isActive: boolean;
  target?: string;
  children: React.ReactNode;
}

/**
 * Shared anchor/Link renderer for the sidebar menu surfaces (leaf, sub-leaf,
 * search results). Renders a SINGLE root element and forwards ref + all extra
 * props, so it composes with the Radix `asChild` Slots the sidebar uses
 * (SidebarMenuButton / SidebarMenuSubButton / DropdownMenuItem).
 *
 * External/anchor items render a plain <a> (new tab, noopener). Internal items
 * render next/link. `aria-current="page"` is derived from `isActive`. The caller
 * supplies `aria-label`, `className`, and the inner icon/label content.
 */
const MenuItemLink = forwardRef<HTMLAnchorElement, MenuItemLinkProps>(function MenuItemLink(
  { href, isAnchor, isActive, target, children, ...rest },
  ref,
) {
  const ariaCurrent = isActive ? 'page' : undefined;

  if (isAnchor) {
    return (
      <a
        ref={ref}
        href={href}
        target={target ?? '_blank'}
        rel="noopener noreferrer"
        aria-current={ariaCurrent}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link ref={ref} href={href} aria-current={ariaCurrent} {...rest}>
      {children}
    </Link>
  );
});

export { MenuItemLink, type MenuItemLinkProps };
```

- [ ] **Step 2: Migrate `leaf-menu-item.tsx`.** Replace the `isAnchor ? <a>…</a> : <Link>…</Link>` block (`leaf-menu-item.tsx:32-48`) with a single `MenuItemLink`. Add the import and keep the existing `aria-label` expression verbatim so behavior is identical:

```tsx
import { MenuItemLink } from './menu-item-link';
```

```tsx
        <MenuItemLink
          href={href}
          isAnchor={isAnchor}
          isActive={isActive}
          target={item.target}
          aria-label={
            item.target === '_blank' ? `${item.name} (opens in new tab)` : item.name
          }
        >
          {item.icon && <IGRPIcon iconName={item.icon} />}
          <span>{item.name}</span>
        </MenuItemLink>
```

Remove the now-unused `Link` import from `leaf-menu-item.tsx` if nothing else uses it. Keep `resolveHref`/`resolveAnchorTag`/`isItemActive`/`ACTIVE_MENU_ITEM_CLASS` imports.

- [ ] **Step 3: Migrate `sub-leaf-link.tsx`.** The shared `inner` value (`sub-leaf-link.tsx:27-49`) becomes a `MenuItemLink` carrying the existing `className`. Behavior identical:

```tsx
import { MenuItemLink } from './menu-item-link';
```

```tsx
  const inner = (
    <MenuItemLink
      href={href}
      isAnchor={isAnchor}
      isActive={isActive}
      target={item.target}
      aria-label={item.target === '_blank' ? `${item.name} (opens in new tab)` : item.name}
      className={cn('flex items-center gap-2 w-full min-w-0')}
    >
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('size-4 shrink-0')} />}
      <span className={cn('truncate')}>{item.name}</span>
    </MenuItemLink>
  );
```

> Note: the original internal `<Link>` here had no explicit `aria-label`; adding `item.name` is a deliberate a11y improvement and is consistent with the anchor branch. Mention it in the changeset. If you want a strictly zero-change migration instead, omit `aria-label` for the internal case by passing it conditionally — but the improvement is recommended.

Keep the `DropdownMenuItem` / `SidebarMenuSubButton` wrappers (`:51-73`) exactly as they are — `MenuItemLink` is the `asChild` child. Remove the now-unused direct `Link` import if unused.

- [ ] **Step 4: Migrate `search-results.tsx`.** Replace the per-result `inner` block (`search-results.tsx:96-127`) with `MenuItemLink`, preserving the existing per-branch `aria-label` exactly (anchor: conditional; internal: none) to guarantee zero behavior change here:

```tsx
import { MenuItemLink } from './menu-item-link';
```

```tsx
            const inner = (
              <MenuItemLink
                href={result.href}
                isAnchor={result.isAnchor}
                isActive={result.isActive}
                target={result.target}
                aria-label={
                  result.isAnchor && result.target === '_blank'
                    ? `${result.name} (opens in new tab)`
                    : undefined
                }
                className={cn('flex flex-col items-start gap-0.5')}
              >
                <span className={cn('truncate')}>{result.name}</span>
                {result.breadcrumb.length > 0 && (
                  <span className={cn('truncate text-xs text-muted-foreground')}>
                    {result.breadcrumb.join(' › ')}
                  </span>
                )}
              </MenuItemLink>
            );
```

Remove the now-unused direct `Link` import from `search-results.tsx` if unused. Keep `buildResults`, `SidebarMenuButton asChild`, and the key logic untouched.

- [ ] **Step 5: Verify typecheck + build pass.**

Run: `pnpm build:next-ui`
Expected: no TS errors. Pay attention to React Compiler output — `forwardRef` + spread is compiler-safe, but confirm no `"use no memo"` warnings appear. If the compiler chokes, fall back to `pnpm --filter @igrp/framework-next-ui build:without_reactcompiler` to isolate, then report.

- [ ] **Step 6: Verify behavior in the template preview.**

Run: `pnpm dev:demo`
Check: sidebar leaf items, collapsible sub-items, dropdown sub-items, and command-search results all (a) highlight the active route, (b) navigate, (c) open external links in a new tab, (d) show `aria-current="page"` on the active item (inspect the DOM). No console errors/hydration warnings.

- [ ] **Step 7: Add a patch changeset.**

Run: `pnpm changeset`
- `@igrp/framework-next-ui`, type **patch**.
- Summary: `refactor(next-ui): extract shared MenuItemLink for sidebar menu surfaces (+aria-label on sub-leaf internal links)`

- [ ] **Step 8: Commit.**

```bash
git add packages/framework/next-ui/src/components/templates/menus .changeset
git commit -m "refactor(next-ui): dedupe sidebar link rendering into MenuItemLink"
```

---

## Task 2B (skip by default): public `IGRPNavLink`

**Do not implement unless a concrete consumer need exists.** The article's render-prop `NavLink` (exposing `isActive`/`isPending` via `useLinkStatus`, typed `Route<T>` href, `aria-current`) is a reusable public component. The framework currently has **no consumer** for it — the sidebar surfaces are covered by Task 2A, and breadcrumbs are a separate segment-derived concern. Exposing it now is speculative public API (YAGNI). If a real need appears (e.g. app authors hand-rolling nav and asking for it):

- It would be a **new public export** from `packages/framework/next-ui/src/index.ts`, so it requires `pnpm build:framework` (downstream `@igrp/framework-next` rebuild) and a `patch` changeset.
- Brainstorm the API first (superpowers:brainstorming) — render-prop vs `asChild` interplay is the hard part, since the sidebar's Radix Slots want a single forwarded child. Decide whether `IGRPNavLink` even fits the `asChild` surfaces or is only for standalone nav.
- Reference the article's final component (`navlink-nextjs-deep-resume.md`, "Componente Final Completo") and its `cacheComponents` "Opção 2" for the Suspense-inside pattern.

---

## Task 3 (defer by default): per-link `useLinkStatus` pending indicator

The template has `(igrp)/loading.tsx`, so route transitions already show a global fallback — per the article's own caveat (line 159), `isPending` is marginal in the App Router precisely because Suspense/streaming covers transitions. The only thing per-link pending adds is a *which-item-am-I-loading* affordance on the clicked menu item. **Defer unless that affordance is explicitly requested.**

If requested, build it on top of Task 2A (it only works inside the `<Link>` branch, internal links only):

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/menus/menu-item-link.tsx`

- [ ] **Step 1: Add an opt-in pending slot inside the internal `<Link>` branch.** `useLinkStatus()` must be called from a component rendered *inside* `<Link>`:

```tsx
import Link, { useLinkStatus } from 'next/link';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';

function MenuItemPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <IGRPIcon iconName="LoaderCircle" className="ml-auto size-3 shrink-0 animate-spin" />;
}
```

Render `<MenuItemPending />` after `{children}` in the `<Link>` branch, behind a new optional `showPending?: boolean` prop (default `false`, so existing call sites are unaffected). Anchor branch never shows it.

- [ ] **Step 2: Opt in from the call sites that want it** (likely `leaf-menu-item.tsx` / `sub-leaf-link.tsx`) by passing `showPending`.
- [ ] **Step 3: Verify** with `pnpm build:next-ui` + `pnpm dev:demo` (throttle network in devtools to see the spinner). Add a `patch` changeset and commit.

---

## Task 4: Document the menu matcher's rewrite assumption

Doc-only, cheap. The sidebar matches active state with `usePathname()` + `isItemActive` (`menus/utils.ts:22-26`). `usePathname()` returns the **source** path, so an app that adds `next.config` `rewrites`/Proxy (the canonical template does **not** — it uses `basePath`, which Next strips correctly) can see active-state mismatch + hydration flash. Record the assumption and the escape hatch so a future integrator isn't surprised.

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/menus/utils.ts` (JSDoc on `isItemActive`, `:22`)

- [ ] **Step 1: Add JSDoc above `isItemActive` (`utils.ts:22`):**

```tsx
/**
 * Active-state match for a menu item against the current pathname.
 * Uses prefix matching: an item is active on its own route and any child route.
 *
 * NOTE: callers pass the value of next/navigation `usePathname()`, which is the
 * route SOURCE path. `basePath` is handled (Next strips it), but apps that add
 * `next.config` rewrites/Proxy may see a mismatch between this and the browser
 * URL. If that ever applies, migrate the sidebar to `useSelectedLayoutSegments()`
 * (router-state based, rewrite-immune) — the same hook breadcrumbs.tsx already uses.
 */
export function isItemActive(item: IGRPMenuItemArgs, pathname: string): boolean {
```

- [ ] **Step 2: Verify build.**

Run: `pnpm build:next-ui`
Expected: passes (comment-only).

- [ ] **Step 3: Commit** (comment-only; no changeset needed).

```bash
git add packages/framework/next-ui/src/components/templates/menus/utils.ts
git commit -m "docs(next-ui): document rewrite assumption in menu active-state matcher"
```

---

## Done Criteria

- [ ] `pnpm build:next-ui` passes from a clean `dist/` (`pnpm --filter @igrp/framework-next-ui clean:dist` first).
- [ ] `pnpm dev:demo` shows the sidebar (leaf/sub-leaf/dropdown/search) and breadcrumbs behaving exactly as before, with active highlighting + `aria-current` intact and no new console/hydration warnings.
- [ ] One `patch` changeset exists for each shipped behavior/API change (1A, 2A, and 3 if done). Comment-only tasks (1B, 4) need none.
- [ ] No edits to `dist/`, no Biome config touched, nothing on `features/check-permissions`.
- [ ] No publish performed.

## Self-Review (done while writing — recorded for the executor)

- **Spec coverage:** every recommendation from the 2026-06-25 review maps to a task — breadcrumbs memo nit → 1A, cacheComponents note → 1B, breadcrumbs CLS → 1C, menu dedup → 2A, public NavLink idea → 2B (parked), pending feedback → 3 (parked), rewrite asymmetry → 4.
- **Corrections folded in:** the original review overstated the duplication ("NavLink three times") — the *matcher* is already shared; only the link JSX duplicates. Pending feedback was downgraded after confirming `(igrp)/loading.tsx`. Rewrite item downgraded to doc-only after confirming `basePath`-not-`rewrites`.
- **Type consistency:** `MenuItemLink`'s `MenuItemLinkProps` is referenced identically in Tasks 2A and 3; `showPending` is introduced only in Task 3.
- **No fake tests:** verification is `pnpm build:next-ui` + template preview, matching this package's actual (test-runner-free) toolchain.

## Execution Handoff (NOT NOW)

This plan is **banked**. Do not execute until `features/check-permissions` is merged. When the maintainer is ready, they choose:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks (superpowers:subagent-driven-development).
2. **Inline Execution** — batch execution with checkpoints in-session (superpowers:executing-plans).

First action at execution time: run the **Pre-Flight** checklist above on a fresh branch off `dev`.
