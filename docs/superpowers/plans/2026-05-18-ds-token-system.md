# Design System Token System Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `success`, `warning`, and `info` as first-class semantic tokens, replace all raw Tailwind colors in `IGRPStatsCard`, fix icon sizing, and standardize button icon sizes.

**Architecture:** Tokens are added to `tokens.css` (both `:root` and `.dark`), then referenced via `bg-success/10 text-success` etc. in components. No raw colors (`bg-green-100`, `text-amber-500`) anywhere in the design system after this plan.

**Tech Stack:** Tailwind v4 CSS custom properties (OKLCH), CVA, TypeScript

---

## File Map

**Modify:**
- `packages/design-system/src/tokens.css` — add success/warning/info CSS vars + theme aliases
- `packages/design-system/src/components/horizon/stats-card.tsx` — replace all raw colors, fix icon sizing
- `packages/design-system/src/components/horizon/button.tsx` — replace raw px icon sizes with Tailwind scale

---

### Task 1: Add semantic tokens to tokens.css

**Files:**
- Modify: `packages/design-system/src/tokens.css`

- [ ] **Step 1: Add `--color-*` aliases to the `@theme inline` block**

In `packages/design-system/src/tokens.css`, inside the `@theme inline { }` block, add after the `--color-destructive` line:

```css
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
```

- [ ] **Step 2: Add CSS variables to `:root`**

In the `:root { }` block, add after the `--destructive` line:

```css
  --success: oklch(0.527 0.154 150.069);
  --success-foreground: oklch(0.985 0.002 150);
  --warning: oklch(0.769 0.188 70.08);
  --warning-foreground: oklch(0.28 0.07 70);
  --info: oklch(0.488 0.243 264.376);
  --info-foreground: oklch(0.984 0.003 247.858);
```

- [ ] **Step 3: Add dark-mode overrides to `.dark`**

In the `.dark { }` block, add after the `--destructive` line:

```css
  --success: oklch(0.627 0.194 150.069);
  --success-foreground: oklch(0.28 0.065 150);
  --warning: oklch(0.828 0.189 84.429);
  --warning-foreground: oklch(0.28 0.07 84);
  --info: oklch(0.60 0.20 264.376);
  --info-foreground: oklch(0.28 0.04 264);
```

- [ ] **Step 4: Rebuild the CSS output**

```powershell
pnpm build:ds
```

Expected: exits 0. The `dist/tokens.css` will now include `--color-success`, `--color-warning`, `--color-info`.

- [ ] **Step 5: Verify tokens are in output**

```powershell
Select-String -Path "packages/design-system/dist/tokens.css" -Pattern "success|warning|info"
```

Expected: 6 lines (3 tokens × 2 = foreground variants).

- [ ] **Step 6: Commit**

```powershell
git add packages/design-system/src/tokens.css
git commit -m "feat(design-system): add success, warning, info semantic tokens"
```

---

### Task 2: Fix IGRPStatsCard icon sizing

**Files:**
- Modify: `packages/design-system/src/components/horizon/stats-card.tsx`

The icon container uses `h-8 w-8` syntax (should be `size-*`) and the icon inside is always `h-6 w-6` regardless of the container size.

- [ ] **Step 1: Fix the container CVA variants**

In `stats-card.tsx`, find `igrpStstaCardIconVariants` (around line 80). Replace the `size` variants:

```ts
// Before
size: {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-14 w-14",
},

// After
size: {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-14",
},
```

- [ ] **Step 2: Fix the icon size inside the container**

Search for the hardcoded `h-6 w-6` on the icon element inside `IGRPStatsCard`. It will look like:

```tsx
<IGRPIcon iconName={...} className="h-6 w-6" />
```

Replace it with a size derived from the `iconSize` prop:

```tsx
const iconSizeClass = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-7",
}[iconSize ?? "md"]

// Then on the icon:
<IGRPIcon iconName={...} className={cn(iconSizeClass)} />
```

Place the `iconSizeClass` constant inside the component body, above the return.

- [ ] **Step 3: Fix the next/image `sizes` prop**

Find `sizes="56px"` (hardcoded for xl). Replace with a derived value:

```tsx
const imageSizes = {
  sm: "32px",
  md: "40px",
  lg: "48px",
  xl: "56px",
}[iconSize ?? "md"]

// On the Image:
<Image ... sizes={imageSizes} />
```

- [ ] **Step 4: Build and verify**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```powershell
git add packages/design-system/src/components/horizon/stats-card.tsx
git commit -m "fix(design-system): proportional icon sizing in IGRPStatsCard"
```

---

### Task 3: Replace raw colors in IGRPStatsCard with semantic tokens

**Files:**
- Modify: `packages/design-system/src/components/horizon/stats-card.tsx`

All `bg-gray-100`, `text-green-500`, etc. must become semantic token classes.

- [ ] **Step 1: Replace the `showBackground + variant` compound variants**

Find `compoundVariants` in `igrpStstaCardIconVariants`. Replace all raw-color classes:

```ts
// Before → After
variant: "secondary"  className: "bg-gray-100 text-gray-600"
                   →  className: "bg-secondary text-secondary-foreground"

variant: "success"    className: "bg-green-100 text-green-500"
                   →  className: "bg-success/10 text-success"

variant: "destructive" className: "bg-red-100 text-red-500"
                    →  className: "bg-destructive/10 text-destructive"

variant: "warning"    className: "bg-amber-100 text-amber-500"
                   →  className: "bg-warning/10 text-warning"

variant: "info"       className: "bg-blue-100 text-blue-500"
                   →  className: "bg-info/10 text-info"

variant: "indigo"     className: "bg-indigo-100 text-purple-500"
                   →  className: "bg-info/10 text-info"
```

(The `indigo` variant is merged into `info` — both are blue-family.)

- [ ] **Step 2: Replace the `backgroundBorder + variant` compound variants**

```ts
// Before → After
variant: "secondary"   className: "border border-gray-200"
                    →  className: "border border-secondary"

variant: "success"     className: "border border-green-200"
                    →  className: "border border-success/20"

variant: "destructive" className: "border border-red-200"
                    →  className: "border border-destructive/20"

variant: "warning"     className: "border border-amber-200"
                    →  className: "border border-warning/20"

variant: "info"        className: "border border-blue-200"
                    →  className: "border border-info/20"

variant: "indigo"      className: "border border-purple-200"
                    →  className: "border border-info/20"
```

- [ ] **Step 3: Scan for any remaining raw colors**

```powershell
Select-String -Path "packages/design-system/src/components/horizon/stats-card.tsx" -Pattern "gray-|green-|red-|amber-|blue-|indigo-|purple-"
```

Expected: no output.

- [ ] **Step 4: Build**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 5: Verify no raw colors exist anywhere in the design system**

```powershell
Select-String -Path "packages/design-system/src/**/*.tsx" -Pattern "bg-gray-|bg-green-|bg-red-|bg-amber-|bg-blue-|bg-indigo-|bg-purple-|text-gray-|text-green-|text-red-|text-amber-|text-blue-|text-indigo-|text-purple-" -Recurse
```

Expected: no output (or only false positives in comments).

- [ ] **Step 6: Commit**

```powershell
git add packages/design-system/src/components/horizon/stats-card.tsx
git commit -m "fix(design-system): replace raw Tailwind colors with semantic tokens in IGRPStatsCard"
```

---

### Task 4: Fix IGRPButton icon sizes and gap

**Files:**
- Modify: `packages/design-system/src/components/horizon/button.tsx`

The `computedIconSize` is raw pixels. Replace with a Tailwind `size-*` class passed to `IGRPIcon`. Also standardize the gap in `button.tsx` primitive (base has `gap-2`, variants have `gap-1`).

- [ ] **Step 1: Replace `computedIconSize` with a className-based size map**

In `packages/design-system/src/components/horizon/button.tsx`, remove:

```ts
const computedIconSize = iconSize || (size === "sm" ? 14 : size === "lg" ? 20 : size === "icon" ? 18 : 16)
```

Replace with:

```ts
const computedIconClassName = iconClassName ?? ({
  xs: "size-3",
  sm: "size-3.5",
  lg: "size-5",
  icon: "size-4",
  "icon-xs": "size-3",
  "icon-sm": "size-3.5",
  "icon-lg": "size-5",
} as Record<string, string>)[size as string] ?? "size-4"
```

- [ ] **Step 2: Update all `IGRPIcon` usages in the file**

Replace every `size={computedIconSize}` and `className={cn(iconClassName)}` with `className={cn(computedIconClassName)}`:

```tsx
// Before
<IGRPIcon iconName={iconName} className={cn(iconClassName)} size={computedIconSize} aria-hidden="true" />

// After
<IGRPIcon iconName={iconName} className={cn(computedIconClassName)} aria-hidden="true" />
```

Do this for all 3 usages in the file (icon-only branch + start placement + end placement). Also update the LoadingIcon spinner to use `size-4`:

```tsx
const LoadingIcon = (
  <IGRPIcon iconName="LoaderCircle" className={cn("animate-spin", computedIconClassName)} aria-hidden="true" />
)
```

- [ ] **Step 3: Standardize gap in the Button primitive**

In `packages/design-system/src/components/primitives/button.tsx`, the base class has `gap-2`. The `xs` and `sm` variants override with `gap-1`, and `lg` with `gap-1.5`. Standardize the base class to `gap-1.5`:

Find in `buttonVariants` the base string:
```ts
"inline-flex items-center justify-center gap-2 whitespace-nowrap ..."
```

Change `gap-2` → `gap-1.5`.

Then remove the explicit `gap-1` from `xs` and `sm` variants (they'll inherit `gap-1.5` from the base, which is correct for small sizes — or keep them if you want xs/sm slightly tighter. Recommendation: keep `gap-1` for `xs` and `sm`, remove from `lg` since base is now `gap-1.5`).

Final intended gaps:
- `xs`: `gap-1`
- `sm`: `gap-1`
- `default`: `gap-1.5`
- `lg`: `gap-1.5`

- [ ] **Step 4: Build**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```powershell
git add packages/design-system/src/components/horizon/button.tsx packages/design-system/src/components/primitives/button.tsx
git commit -m "fix(design-system): replace raw px icon sizes with Tailwind scale in IGRPButton; standardize gap"
```

---

### Task 5: Create changeset

- [ ] **Step 1: Create changeset**

```powershell
pnpm changeset
```

When prompted:
- Select `@igrp/igrp-framework-react-design-system`
- Type: `patch`
- Summary: `Add success/warning/info semantic tokens; fix StatsCard raw colors, icon sizing; standardize Button icon sizes and gap`

- [ ] **Step 2: Final build check**

```powershell
pnpm build:ds
```

Expected: exits 0.
