# Design System Quick Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dead experimental components, delete redundant Horizon components, and fix the Sidebar cookie restore bug.

**Architecture:** Pure deletion + one bug fix. No new abstractions. Each task is independent and safe to revert individually.

**Tech Stack:** TypeScript, React 19, Tailwind v4, pnpm monorepo

---

## File Map

**Delete:**
- `packages/design-system/src/components/experimental/timeline/index.tsx`
- `packages/design-system/src/components/experimental/sheet/index.tsx`
- `packages/design-system/src/components/experimental/progress/index.tsx`
- `packages/design-system/src/components/experimental/appointment-picker.tsx`
- `packages/design-system/src/components/horizon/form/standalone-list.tsx`
- `packages/design-system/src/components/horizon/repetitive-component.tsx`

**Modify:**
- `packages/design-system/src/index.ts` — remove 2 exports (lines 593, 704)
- `packages/design-system/src/components/primitives/sidebar.tsx` — fix cookie read-on-mount
- All 50 files in `packages/design-system/src/components/primitives/` — add `// shadcn: 2026-05-18` comment

---

### Task 1: Delete dead experimental components

**Files:**
- Delete: `packages/design-system/src/components/experimental/timeline/index.tsx`
- Delete: `packages/design-system/src/components/experimental/sheet/index.tsx`
- Delete: `packages/design-system/src/components/experimental/progress/index.tsx`
- Delete: `packages/design-system/src/components/experimental/appointment-picker.tsx`

- [ ] **Step 1: Delete the 4 files**

```powershell
Remove-Item "packages/design-system/src/components/experimental/timeline/index.tsx"
Remove-Item "packages/design-system/src/components/experimental/sheet/index.tsx"
Remove-Item "packages/design-system/src/components/experimental/progress/index.tsx"
Remove-Item "packages/design-system/src/components/experimental/appointment-picker.tsx"
```

- [ ] **Step 2: Verify no imports reference them**

```powershell
grep -r "experimental/timeline|experimental/sheet|experimental/progress|experimental/appointment" packages/design-system/src/
```

Expected: no output.

- [ ] **Step 3: Verify build still passes**

```powershell
pnpm build:ds
```

Expected: exits 0, no errors.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "chore(design-system): delete dead experimental components (timeline, sheet, progress, appointment-picker)"
```

---

### Task 2: Delete IGRPStandaloneList and IGRPRepetitiveComponent

**Files:**
- Delete: `packages/design-system/src/components/horizon/form/standalone-list.tsx`
- Delete: `packages/design-system/src/components/horizon/repetitive-component.tsx`
- Modify: `packages/design-system/src/index.ts` lines 593 and 704

- [ ] **Step 1: Delete the source files**

```powershell
Remove-Item "packages/design-system/src/components/horizon/form/standalone-list.tsx"
Remove-Item "packages/design-system/src/components/horizon/repetitive-component.tsx"
```

- [ ] **Step 2: Remove exports from index.ts**

In `packages/design-system/src/index.ts`, delete these two lines:

Line 593:
```ts
export { IGRPStandaloneList, type IGRPStandaloneListProps } from "./components/horizon/form/standalone-list"
```

Line 704:
```ts
export { IGRPRepetitiveComponent, type IGRPRepetitiveComponentProps } from "./components/horizon/repetitive-component"
```

- [ ] **Step 3: Verify no imports reference them in the package**

```powershell
grep -r "IGRPStandaloneList\|IGRPRepetitiveComponent\|standalone-list\|repetitive-component" packages/design-system/src/
```

Expected: no output.

- [ ] **Step 4: Verify build passes**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "chore(design-system): remove IGRPStandaloneList and IGRPRepetitiveComponent (covered by IGRPFormList standalone mode and plain .map())"
```

---

### Task 3: Fix Sidebar cookie read-on-mount

**Files:**
- Modify: `packages/design-system/src/components/primitives/sidebar.tsx`

The `SidebarProvider` writes the sidebar state to a cookie on change but never reads it back on mount. On every page load, the sidebar resets to `defaultOpen` regardless of the user's previous state.

- [ ] **Step 1: Locate the `_open` useState in SidebarProvider**

Open `packages/design-system/src/components/primitives/sidebar.tsx`. Find this line (~line 65):

```ts
const [_open, _setOpen] = useState<boolean | undefined>(undefined)
```

- [ ] **Step 2: Replace it with a lazy initializer that reads the cookie**

```ts
const [_open, _setOpen] = useState<boolean | undefined>(() => {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${SIDEBAR_COOKIE_NAME}=([^;]+)`)
  )
  if (!match) return undefined
  return match[1] === "true"
})
```

- [ ] **Step 3: Verify the open resolution line is still correct**

The line immediately below should still read:
```ts
const open = openProp ?? _open ?? defaultOpen
```

This is correct — controlled prop wins, then cookie state, then the `defaultOpen` prop. No change needed.

- [ ] **Step 4: Build and verify**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 5: Manual smoke test**

Run the demo app, toggle the sidebar, reload the page. The sidebar should restore to its last state.

```powershell
pnpm dev:demo
```

Navigate to any IGRP page. Toggle sidebar. Reload. Verify state persists.

- [ ] **Step 6: Commit**

```powershell
git add packages/design-system/src/components/primitives/sidebar.tsx
git commit -m "fix(design-system): restore sidebar state from cookie on mount"
```

---

### Task 4: Add shadcn audit date comments to all primitives

**Files:**
- Modify: all `*.tsx` files in `packages/design-system/src/components/primitives/`

This establishes an audit trail so you can tell which primitives haven't been reviewed against upstream shadcn/ui in 6+ months.

- [ ] **Step 1: Add `// shadcn: 2026-05-18` as the first line of each primitive file**

Run this PowerShell script from the repo root:

```powershell
$primitiveFiles = Get-ChildItem -Path "packages/design-system/src/components/primitives" -Filter "*.tsx" -Recurse
foreach ($file in $primitiveFiles) {
  $content = Get-Content $file.FullName -Raw
  if (-not $content.StartsWith("// shadcn:")) {
    Set-Content $file.FullName -Value ("// shadcn: 2026-05-18`n" + $content) -NoNewline
  }
}
```

- [ ] **Step 2: Verify a sample file**

```powershell
Get-Content "packages/design-system/src/components/primitives/button.tsx" -TotalCount 3
```

Expected first line: `// shadcn: 2026-05-18`

- [ ] **Step 3: Verify file count**

```powershell
(Get-ChildItem "packages/design-system/src/components/primitives" -Filter "*.tsx" -Recurse).Count
```

Note the count. Then:

```powershell
Select-String -Path "packages/design-system/src/components/primitives/**/*.tsx" -Pattern "^// shadcn:" | Measure-Object | Select-Object -ExpandProperty Count
```

Both counts should match.

- [ ] **Step 4: Build to ensure no breakage**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```powershell
git add packages/design-system/src/components/primitives/
git commit -m "chore(design-system): add shadcn audit date to all primitives (2026-05-18)"
```

---

### Task 5: Create changeset and verify

- [ ] **Step 1: Create a changeset**

```powershell
pnpm changeset
```

When prompted:
- Select `@igrp/igrp-framework-react-design-system`
- Type: `patch`
- Summary: `Remove dead experimental components, fix sidebar cookie restore, add shadcn audit tracking`

- [ ] **Step 2: Verify changeset was created**

```powershell
Get-ChildItem .changeset/ -Filter "*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content
```

Expected: a `.md` file with the package name and patch bump.

- [ ] **Step 3: Final build check**

```powershell
pnpm build:ds
```

Expected: exits 0, clean output.
