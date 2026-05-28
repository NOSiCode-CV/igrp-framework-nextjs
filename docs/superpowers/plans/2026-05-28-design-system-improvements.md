# Design System Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply five quality improvements to `@igrp/igrp-framework-react-design-system` identified during the shadcn-skill audit: shrink consumer bundle via peerDeps, sunset the legacy `/styles` export, document the three-layer component map, warn template consumers off `shadcn add`, and add an upstream-drift detector.

**Architecture:** All five changes target `packages/design-system` (and one doc edit in `templates/demo-legacy/CLAUDE.md`). Improvements are sequenced from highest-risk (peerDeps — affects every consumer's install graph) to lowest (drift script — additive only). All five ship under a **single** `pnpm changeset` (patch, per repo hard-rules) at the end; no intermediate publishes.

**Tech Stack:** pnpm workspace, Tailwind v4, SWC + Babel + React Compiler, tsup-free (SWC pipeline), TypeScript 5.9, Vitest, Node 22.

---

## Pre-flight

- [ ] **Step 0.1: Confirm clean working tree**

Run: `git status`
Expected: `(clean)` on branch `dev` (or a feature branch off `dev`).

- [ ] **Step 0.2: Confirm framework builds from current `dev`**

Run: `pnpm build:framework`
Expected: all five packages build green (`next-auth → next-types → design-system → next-ui → next`).

- [ ] **Step 0.3: Snapshot current published version**

Run: `pnpm view @igrp/igrp-framework-react-design-system version --registry=https://sonatype.nosi.cv/repository/igrp/`
Record the result in the eventual changeset body — needed to verify the bump landed at release time.

---

## Task 1: Move heavy runtime deps to `peerDependencies`

**Why:** Today every consumer of the DS gets pinned versions of `react-hook-form`, `zod`, `recharts`, `@tanstack/react-table`, `date-fns`, and `lucide-react`. These are consumer-visible (apps import zod schemas, pass `lucide-react` icons into Horizon components, define their own table columns). Pinning them inside the DS causes duplicate copies, version drift, and prevents downstream apps from upgrading independently.

**Files:**
- Modify: `packages/design-system/package.json` (dependencies → peerDependencies + peerDependenciesMeta)
- Modify: `packages/design-system/package.json` (devDependencies — add the same packages so the DS builds standalone)
- Verify: `packages/design-system/src/**` (no new code; sanity-check that all imports resolve through peer)

### Step 1.1: Identify exact versions currently in use

- [ ] Read `packages/design-system/package.json` lines 52-101 and copy the current versions of these six packages:
  - `react-hook-form`
  - `zod`
  - `recharts`
  - `@tanstack/react-table`
  - `date-fns`
  - `lucide-react`

Record them in a scratch note. Reference value (already in repo at time of plan):
```
react-hook-form: ^7.76.0
zod: ^4.4.3
recharts: 2.15.4
@tanstack/react-table: ^8.21.3
date-fns: ^4.1.0
lucide-react: ^0.577.0
```

### Step 1.2: Edit `packages/design-system/package.json`

- [ ] Remove these six entries from the `dependencies` block.

- [ ] Extend the existing `peerDependencies` block (currently just `next`/`react`/`react-dom`) to:

```json
  "peerDependencies": {
    "next": "^15.5.18",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "@tanstack/react-table": "^8.21.0",
    "date-fns": "^4.0.0",
    "lucide-react": ">=0.500.0",
    "react-hook-form": "^7.0.0",
    "recharts": "^2.15.0",
    "zod": "^4.0.0"
  },
```

Note the **loosened ranges** — peers should accept the broadest semver-safe range so consumers can upgrade independently.

- [ ] Add a `peerDependenciesMeta` block (all six are required at runtime — none `optional: true` — because every Horizon component path uses at least one):

```json
  "peerDependenciesMeta": {
    "@tanstack/react-table": { "optional": false },
    "date-fns": { "optional": false },
    "lucide-react": { "optional": false },
    "react-hook-form": { "optional": false },
    "recharts": { "optional": false },
    "zod": { "optional": false }
  },
```

- [ ] Add the same six packages to `devDependencies` at the **same pinned versions** previously in `dependencies` — the DS still needs them locally to build/type-check:

```json
    "@tanstack/react-table": "^8.21.3",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.577.0",
    "react-hook-form": "^7.76.0",
    "recharts": "2.15.4",
    "zod": "^4.4.3",
```

### Step 1.3: Reinstall to refresh the lockfile

- [ ] Run: `pnpm install:deps`
Expected: lockfile updates; no install errors; `packages/design-system/node_modules` retains the dev copies of all six packages (via devDependencies hoisting from the workspace).

### Step 1.4: Verify the DS still builds

- [ ] Run: `pnpm build:ds`
Expected: SWC + Babel + types all green. If a type error appears for a peer import, the devDependency mirror is missing or version-mismatched — fix and rerun.

### Step 1.5: Verify downstream builds still resolve peers

- [ ] Run: `pnpm build:framework`
Expected: `next-ui` and `next` also build green. `next-ui` declares its own peer/dep on these libs — confirm before proceeding by:

```
grep -E "react-hook-form|zod|recharts|@tanstack/react-table|date-fns|lucide-react" packages/framework/next-ui/package.json
```

If `next-ui` was relying on transitive resolution through the DS (i.e. doesn't list one of these libs itself), add it explicitly to `next-ui`'s `dependencies` (not peer — `next-ui` is the bundled chrome layer). Repeat for `next` and `next-types`.

### Step 1.6: Verify the demo template still installs & dev-runs

- [ ] Run: `pnpm dev:demo` and visit `http://localhost:3000`
Expected: template boots, login page renders, forms work. If install fails with `ERR_PNPM_PEER_DEP_ISSUES`, add the six packages explicitly to `templates/demo-legacy/package.json` `dependencies` (the template is an app, not a library — it should pin concrete versions).

- [ ] Stop the dev server (Ctrl+C) once verified.

### Step 1.7: Commit Task 1

```
git add packages/design-system/package.json packages/framework/next-ui/package.json packages/framework/next/package.json packages/framework/next-types/package.json templates/demo-legacy/package.json pnpm-lock.yaml
git commit -m "refactor(design-system): move heavy runtime deps to peerDependencies

react-hook-form, zod, recharts, @tanstack/react-table, date-fns, and
lucide-react are consumer-visible (apps pass icons in, define their own
schemas, build table columns). Pinning them inside the DS forced version
duplication. Loosen peer ranges so apps can upgrade independently."
```

---

## Task 2: Sunset the legacy `/styles` export

**Why:** Templates must import `/tokens` only — the prebuilt `styles.css` causes cascade conflicts (documented in `.claude/shared/tailwind-v4.md`). Today the build still regenerates `styles.css` on every release via `tailwind:build`, and the export is still advertised. This task removes the regeneration step **and the export from non-publish config**, while leaving the `publishConfig.exports` entry in place for one more beta so existing legacy consumers don't hard-break. A follow-up changeset (next quarter) will remove it entirely.

**Files:**
- Modify: `packages/design-system/package.json` (remove `tailwind:build` from build chain; remove `/styles` from dev `exports`; keep it in `publishConfig.exports` with a deprecation comment)
- Modify: `packages/design-system/src/index.ts` — no change (no JS code references `/styles`)
- Delete: `packages/design-system/src/styles.css` (it is a generated artifact — confirm with `git log --oneline -- packages/design-system/src/styles.css` that it's not hand-maintained before deleting)
- Modify: `packages/design-system/.gitignore` — add `src/styles.css` if not already ignored
- Modify: `packages/design-system/CLAUDE.md` — add a "Deprecated exports" note
- Modify: `.claude/shared/tailwind-v4.md` — flip "DS package.json still exposes `/styles` for legacy consumers" to "is being removed; do not add new uses"

### Step 2.1: Confirm `styles.css` is generated, not hand-maintained

- [ ] Run: `git log --oneline -- packages/design-system/src/styles.css | head -5`
Expected: commits are mostly automated build-output churn or absent. If any commit message indicates manual edits, **stop and re-evaluate** before deleting.

### Step 2.2: Remove `tailwind:build` from the release build chain

- [ ] In `packages/design-system/package.json`, change line 30 from:
```
"build:reactcompiler": "pnpm clean:dist && pnpm tailwind:build && pnpm build:swc && pnpm build:babel && pnpm build:types",
```
to:
```
"build:reactcompiler": "pnpm clean:dist && pnpm build:swc && pnpm build:babel && pnpm build:types",
```

- [ ] Leave the `tailwind:build` script entry itself in place for now (line 41) so anyone who needs to regenerate locally still can — it's just no longer wired into release.

### Step 2.3: Delete the generated artifact

- [ ] Run: `rm packages/design-system/src/styles.css`

- [ ] Add `src/styles.css` to `packages/design-system/.gitignore` (create the file if missing — check `ls packages/design-system/.gitignore` first).

### Step 2.4: Drop `/styles` from the dev `exports` block, keep it in `publishConfig`

The `publishConfig.exports` block (currently lines 147-155) is what npm sees. Leaving `/styles` there for one more beta gives legacy apps a soft-deprecation window; removing it from the top-level `exports` keeps local workspace consumers from accidentally taking a new dep on it.

- [ ] In `packages/design-system/package.json`, edit the top-level `exports` block (lines 137-145) to drop the `"./styles"` line. Result:

```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./tokens": "./dist/tokens.css"
  },
```

- [ ] Keep `publishConfig.exports` as-is (still includes `./styles`) for the deprecation window. Add a sibling comment via package.json `"//"` field above `publishConfig`:

```json
  "//": "DEPRECATED: publishConfig.exports['./styles'] is scheduled for removal in the next beta after 0.1.0-beta.131. Use './tokens' + the consuming app's own Tailwind build instead. See .claude/shared/tailwind-v4.md.",
  "publishConfig": { ... }
```

### Step 2.5: Update `packages/design-system/CLAUDE.md`

- [ ] Open `packages/design-system/CLAUDE.md` and add a new section before "Shared rules":

```markdown
## Deprecated exports (do not extend)

- `@igrp/igrp-framework-react-design-system/styles` — the prebuilt CSS bundle. Scheduled for removal one beta after `0.1.0-beta.131`. Templates must import `/tokens` only and compile Tailwind in the app itself. See `.claude/shared/tailwind-v4.md`. Do not add new code or examples that reference `/styles`.
```

### Step 2.6: Update the shared Tailwind doc

- [ ] Edit `.claude/shared/tailwind-v4.md` — find the line "The DS `package.json` still exposes `/styles` for legacy consumers, but templates in this repo must not use it." and replace with:

```
The DS still publishes `/styles` for legacy consumers, but it is **deprecated** and will be removed one beta after 0.1.0-beta.131. Templates in this repo must not use it.
```

### Step 2.7: Verify build still works without `tailwind:build`

- [ ] Run: `pnpm build:ds`
Expected: success. `dist/styles.css` no longer present in the build output (it was being generated from `src/styles.css` → copied to `dist`). Confirm:
```
ls packages/design-system/dist/styles.css
```
Expected: not found, OR present only because `publishConfig.exports` is still pointing at it — in which case it must be present. **Re-read this step.** If `publishConfig.exports` references `./styles`, the file MUST exist in `dist` at publish time. Two valid options:

   - **Option A (recommended):** keep `tailwind:build` wired in but **only** for the publish step. Revert step 2.2 — leave the build chain as-is — and accept that `styles.css` is regenerated every build. The deprecation is purely in docs + dev `exports`. Skip the artifact deletion in step 2.3 too.
   - **Option B:** ship a stub `dist/styles.css` (empty file with a `/* deprecated */` comment) so the export path resolves but consumers get nothing. Riskier — breaks any consumer still relying on the cascade.

**Choose Option A** unless you're confident no consumer outside this repo imports `/styles`. The release script will rebuild it. The win in this task becomes purely the deprecation signal in docs + dev `exports` + CLAUDE.md.

- [ ] If choosing Option A: revert step 2.2 (restore `tailwind:build` to the chain) and revert step 2.3 (do not delete `src/styles.css`). Keep steps 2.4 / 2.5 / 2.6.

### Step 2.8: Re-verify template still works

- [ ] Run: `pnpm dev:demo` — page loads, styles render correctly (the template imports `/tokens`, not `/styles`, so this should be a no-op verification).

- [ ] Stop dev server.

### Step 2.9: Commit Task 2

```
git add packages/design-system/package.json packages/design-system/CLAUDE.md .claude/shared/tailwind-v4.md
git commit -m "chore(design-system): deprecate /styles export

Remove ./styles from the dev exports map (kept in publishConfig.exports
for one more beta to give legacy consumers a soft-deprecation window).
Document the removal timeline in CLAUDE.md and the shared Tailwind doc.
No runtime change — release still builds styles.css until the export is
fully removed."
```

---

## Task 3: Add `COMPONENTS.md` — the three-layer component map

**Why:** New contributors and downstream app developers cannot tell which `IGRP*` component pairs with which Primitive, or which IGRP customizations diverge from upstream shadcn. A single reference table eliminates the "is there already a component for X" question and prevents accidental reinvention.

**Files:**
- Create: `packages/design-system/COMPONENTS.md`

### Step 3.1: Create `packages/design-system/COMPONENTS.md`

- [ ] Write the file with the following content:

````markdown
# IGRP Design System — Component Map

> Reference for the three-layer model. **Always prefer the Horizon layer.** Drop to Primitives only when Horizon is too opinionated for the use case. Use Custom for IGRP-specific compositions.

## Quick rules

- `IGRP*` from the public root (`@igrp/igrp-framework-react-design-system`) is **always client-side** — files importing it need `'use client'`.
- Forms are always `IGRPForm` + Zod. Never raw `<form>` or direct `react-hook-form`.
- Use semantic tokens (`bg-background`, `text-foreground`, …). Never raw Tailwind colors.
- `cn()` for class merging; `size-*` for equal w/h; `flex gap-*` for spacing.

## Layer map

| Need | Horizon (default) | Primitive (escape hatch) | Custom |
| --- | --- | --- | --- |
| Form root + Zod validation + submit handling | `IGRPForm` | `Form` (RHF context only) | — |
| Text input | `IGRPInputText`, `IGRPInputNumber`, `IGRPInputPassword`, `IGRPInputUrl`, `IGRPInputSearch` | `Input` | — |
| Textarea | `IGRPTextarea` | `Textarea` | — |
| Select | `IGRPSelect` | `Select` + `SelectGroup` + `SelectItem` | — |
| Combobox (typeahead) | `IGRPCombobox` | `Command` inside `Popover` | — |
| Checkbox | `IGRPCheckbox` | `Checkbox` | — |
| Switch | `IGRPSwitch` | `Switch` | — |
| Radio group | `IGRPRadioGroup` | `RadioGroup` + `RadioGroupItem` | — |
| Date / time / range | `IGRPCalendarSingle`, `IGRPCalendarRange`, `IGRPCalendarMultiple`, `IGRPDateTime`, `IGRPTime` | `Calendar` | — |
| Phone | `IGRPPhone` | — | — |
| Color | `IGRPColor` | — | — |
| File upload | `IGRPFile` | — | — |
| Input with addons (icon, button, prefix) | `IGRPInputWithAddons` | `InputGroup` + `InputGroupInput` + `InputGroupAddon` | — |
| Data table | `IGRPDataTable` | `Table` | — |
| Charts (area / bar / line / pie / radar / radial) | `IGRPAreaChart`, `IGRPBarChart`, `IGRPLineChart`, `IGRPPieChart`, `IGRPRadarChart`, `IGRPRadialBarChart` | `ChartContainer` + `ChartTooltip` + raw Recharts | — |
| Card | `IGRPCard`, `IGRPCardDetails`, `IGRPInfoCard`, `IGRPStatsCard` | `Card` + `CardHeader` + `CardTitle` + `CardDescription` + `CardContent` + `CardFooter` | `IGRPStatsCardMini`, `IGRPStatsCardTopBorderColored` |
| Modal dialog | `IGRPModalDialog` | `Dialog` + `DialogTitle` (required) | — |
| Confirmation dialog | `IGRPAlertDialog` | `AlertDialog` | — |
| Side panel | — | `Sheet` + `SheetTitle` | — |
| Bottom sheet | — | `Drawer` + `DrawerTitle` | — |
| Tabs | `IGRPTabs` | `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` | — |
| Accordion | `IGRPAccordion` | `Accordion` + `AccordionItem` + `AccordionTrigger` + `AccordionContent` | — |
| Toast | — | `Sonner` (`toast()` from `sonner`) — wired via `IGRPToaster` | — |
| Alert / callout | `IGRPAlert`, `IGRPBanner` | `Alert` + `AlertTitle` + `AlertDescription` | `IGRPStatusBanner` |
| Empty state | — | `Empty` | — |
| Badge | `IGRPBadge` | `Badge` | — |
| Button | `IGRPButton` | `Button` (variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; sizes: `xs`, `sm`, `default`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`) | — |
| Avatar | `IGRPAvatar` | `Avatar` + `AvatarImage` + `AvatarFallback` (fallback required) | `IGRPUserAvatar` |
| Menu navigation | `IGRPMenuNavigation` | `NavigationMenu` | — |
| Breadcrumb | — | `Breadcrumb` + `BreadcrumbList` + `BreadcrumbItem` + `BreadcrumbLink` + `BreadcrumbPage` + `BreadcrumbSeparator` | — |
| Pagination | — | `Pagination` | — |
| Sidebar | — | `Sidebar` + `SidebarHeader`/`SidebarContent`/`SidebarFooter`/`SidebarMenu` | — |
| Command palette | `IGRPCommand` | `Command` inside `Dialog` | — |
| Dropdown menu | `IGRPDropdownMenu` | `DropdownMenu` + `DropdownMenuGroup` + `DropdownMenuItem` | — |
| Tooltip | — | `Tooltip` + `TooltipTrigger` + `TooltipContent` | — |
| Hover card | — | `HoverCard` + `HoverCardTrigger` + `HoverCardContent` | — |
| Context menu | — | `ContextMenu` | — |
| Carousel | — | `Carousel` + `CarouselContent` + `CarouselItem` + `CarouselPrevious` + `CarouselNext` | — |
| Scroll area | — | `ScrollArea` | — |
| Resizable panels | — | `ResizablePanelGroup` + `ResizablePanel` + `ResizableHandle` | — |
| Separator | — | `Separator` | — |
| Skeleton | — | `Skeleton` | — |
| Spinner | `IGRPLoadingSpinner` | `Spinner` | — |
| Progress | — | `Progress` | — |
| Stepper | — | `Stepper` | — |
| Image | `IGRPImage`, `IGRPImageCropper` | `Cropper` | — |
| Chat | `IGRPChat` | — | — |
| Process / timeline | `IGRPProcess` | — | — |
| PDF viewer | `IGRPPdfViewer` | — | — |
| Video embed | `IGRPVideoEmbed` | — | — |
| Copy-to-clipboard | `IGRPCopyTo` | — | — |
| Notifications | `IGRPNotification` | — | — |
| Icon | `IGRPIcon` | (use `lucide-react` directly with `data-icon="inline-start"` / `inline-end"` slot) | — |
| Page header / footer / container | `IGRPPageHeader`, `IGRPPageFooter`, `IGRPContainer` | — | — |
| Typography | `IGRPTypography` family | — | — |

## IGRP-specific deltas from upstream shadcn

These primitives are intentionally divergent. **Audit them when refreshing from upstream.**

- **`Button`** — adds `xs`, `icon-xs`, `icon-sm`, `icon-lg` sizes beyond the shadcn baseline. Adds `has-data-[icon=inline-end]` / `has-data-[icon=inline-start]` padding tweaks per size.
- *(Add other deltas here as they accumulate. The header comment `// IGRP CUSTOM: THIS COMPONENT IS CHANGED FROM THE ORIGINAL` marks them in source.)*

## Experimental layer

Components under `src/components/experimental/` (currently: `progress/`, `sheet/`, `timeline/`) are **excluded from the SWC build** and not exported. They are work-in-progress and may break without a changeset. Promotion criteria: stable API, tests in `design-system-storybook`, no `experimental/` imports from other layers.

## Adding a new component — decision flow

1. Does the shadcn skill component table list it? → Add as a Primitive first (copy from upstream via the shadcn CLI's `--diff` flow against a scratch directory).
2. Will every IGRP app want the same labels / icons / loading / form wiring? → Add a Horizon wrapper on top.
3. Is it IGRP-domain-specific (stats card variant, user avatar, status banner)? → Add to `custom/`.
````

### Step 3.2: Commit Task 3

```
git add packages/design-system/COMPONENTS.md
git commit -m "docs(design-system): add COMPONENTS.md three-layer reference

Map every consumer need to Horizon (default), Primitive (escape hatch),
and Custom (domain-specific). Document IGRP deltas from upstream shadcn
and the experimental-layer promotion criteria."
```

---

## Task 4: Warn template consumers off `npx shadcn add`

**Why:** Running `shadcn add select` inside `templates/demo-legacy` (or any downstream IGRP app) drops a fresh `components/ui/select.tsx` that collides with `IGRPSelect` and bypasses Horizon entirely. The conflict isn't obvious until form wiring breaks.

**Files:**
- Modify: `templates/demo-legacy/CLAUDE.md`
- Modify: `templates/demo-legacy/README.md` (one-line link to the section)

### Step 4.1: Locate the right spot in `templates/demo-legacy/CLAUDE.md`

- [ ] Read `templates/demo-legacy/CLAUDE.md` start-to-end. Find the section that talks about UI rules / design system consumption (look for `IGRP*` or `design-system`). Insert the warning **adjacent** to that section.

### Step 4.2: Insert the warning

- [ ] Add this block (adjust heading depth to match the surrounding doc — likely `##`):

```markdown
## Do not run `npx shadcn add` here

This template consumes `@igrp/igrp-framework-react-design-system`, which already vends every shadcn primitive (`Button`, `Card`, `Dialog`, `Select`, …) plus a Horizon layer of opinionated `IGRP*` wrappers. Running `npx shadcn@latest add <component>` will:

- drop a fresh `components/ui/<component>.tsx` that **collides** with the existing IGRP primitive,
- skip Horizon wiring (Zod, IGRPForm, mock-data preview mode, theme tokens),
- introduce a second copy of dependencies the DS already manages.

**Instead:**

- Use the existing Horizon component (e.g. `IGRPSelect`) — see `packages/design-system/COMPONENTS.md` for the full map.
- Drop to the primitive (`Select` from the DS root) only when Horizon is too opinionated.
- If a component genuinely doesn't exist in the DS, open a PR against `packages/design-system` to add it — do not vendor it into the template.

The shadcn CLI **is** appropriate inside `packages/design-system` itself, when refreshing primitives from upstream. See the upstream-drift script under `packages/design-system/scripts/`.
```

### Step 4.3: Add a pointer from `templates/demo-legacy/README.md`

- [ ] In the docs index / "see also" section of `templates/demo-legacy/README.md`, add one bullet:

```markdown
- **Do not run `npx shadcn add` here** — see `CLAUDE.md` § "Do not run `npx shadcn add` here". Use `IGRP*` from the design system instead.
```

### Step 4.4: Commit Task 4

```
git add templates/demo-legacy/CLAUDE.md templates/demo-legacy/README.md
git commit -m "docs(demo-legacy): warn against running shadcn add in the template

The DS already vends every shadcn primitive plus Horizon wrappers.
Running shadcn add inside the template creates collisions and bypasses
form/theme wiring. Document the alternative paths."
```

---

## Task 5: Upstream-drift detector for the Primitives layer

**Why:** Primitives are stamped with `// shadcn: YYYY-MM-DD` markers, but nothing today catches when upstream evolves. A quarterly check script compares each primitive against `npx shadcn@latest add --diff` and surfaces drift, so refreshes can be planned instead of accidental.

**Files:**
- Create: `packages/design-system/scripts/check-shadcn-drift.mjs`
- Create: `packages/design-system/scripts/README.md`
- Modify: `packages/design-system/package.json` (add `drift:shadcn` script)
- Create: `packages/design-system/scripts/__tests__/check-shadcn-drift.test.mjs`

### Step 5.1: Write the failing test

- [ ] Create `packages/design-system/scripts/__tests__/check-shadcn-drift.test.mjs`:

```js
import { describe, it, expect } from "vitest"
import { parseStampDate, listPrimitives } from "../check-shadcn-drift.mjs"

describe("parseStampDate", () => {
  it("extracts the YYYY-MM-DD from a shadcn stamp comment", () => {
    const src = "// shadcn: 2026-05-18\nimport * as React from 'react'\n"
    expect(parseStampDate(src)).toBe("2026-05-18")
  })

  it("returns null when no stamp is present", () => {
    const src = "import * as React from 'react'\n"
    expect(parseStampDate(src)).toBeNull()
  })

  it("ignores stamps that are not on the first comment line", () => {
    const src = "import * as React from 'react'\n// shadcn: 2026-05-18\n"
    expect(parseStampDate(src)).toBeNull()
  })
})

describe("listPrimitives", () => {
  it("returns a list of .tsx files under primitives/ relative to the package root", async () => {
    const files = await listPrimitives()
    expect(files.length).toBeGreaterThan(20) // we have ~50
    expect(files.every((f) => f.endsWith(".tsx"))).toBe(true)
    expect(files.some((f) => f.endsWith("button.tsx"))).toBe(true)
  })
})
```

### Step 5.2: Run the test to verify it fails

- [ ] Run: `pnpm --filter @igrp/igrp-framework-react-design-system test scripts/__tests__/check-shadcn-drift.test.mjs`
Expected: FAIL — `Cannot find module '../check-shadcn-drift.mjs'`.

### Step 5.3: Implement `check-shadcn-drift.mjs`

- [ ] Create `packages/design-system/scripts/check-shadcn-drift.mjs`:

```js
#!/usr/bin/env node
/**
 * Reports drift between local Primitives and upstream shadcn.
 *
 * For each .tsx under src/components/primitives/, this script:
 *   1. Reads the first-line `// shadcn: YYYY-MM-DD` stamp (if any).
 *   2. Runs `npx shadcn@latest add <name> --dry-run --diff <file>` in a
 *      scratch directory and captures the diff.
 *   3. Prints a per-file report: { stamp, hasDrift, diffSummary }.
 *
 * Exit code 0 if no drift is detected, 1 if any primitive has drifted.
 *
 * NOTE: this script is intended for periodic (~quarterly) maintenance,
 * not CI. It hits the network and is slow.
 */
import { readFile, readdir, mkdtemp } from "node:fs/promises"
import { join, resolve, dirname, basename } from "node:path"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"
import { spawn } from "node:child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(__dirname, "..")
const PRIMITIVES_DIR = join(PACKAGE_ROOT, "src", "components", "primitives")

const STAMP_RE = /^\/\/\s*shadcn:\s*(\d{4}-\d{2}-\d{2})\b/

export function parseStampDate(source) {
  const firstLine = source.split(/\r?\n/, 1)[0] ?? ""
  const m = STAMP_RE.exec(firstLine)
  return m ? m[1] : null
}

export async function listPrimitives() {
  const entries = await readdir(PRIMITIVES_DIR, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".tsx"))
    .map((e) => e.name)
    .sort()
}

function run(cmd, args, opts) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (b) => (stdout += b.toString()))
    child.stderr.on("data", (b) => (stderr += b.toString()))
    child.on("error", rejectP)
    child.on("close", (code) => resolveP({ code, stdout, stderr }))
  })
}

async function checkOne(file, scratch) {
  const full = join(PRIMITIVES_DIR, file)
  const source = await readFile(full, "utf8")
  const stamp = parseStampDate(source)
  const name = basename(file, ".tsx")

  const { code, stdout, stderr } = await run(
    "npx",
    ["shadcn@latest", "add", name, "--dry-run", "--diff", "--base", "radix"],
    { cwd: scratch },
  )

  const hasDrift = code === 0 && stdout.includes("---")
  return { file, name, stamp, hasDrift, raw: stdout || stderr }
}

async function main() {
  const files = await listPrimitives()
  const scratch = await mkdtemp(join(tmpdir(), "shadcn-drift-"))

  // Initialize a throwaway shadcn project so `add --diff` has somewhere to compare against.
  await run("npx", ["shadcn@latest", "init", "--yes", "--defaults", "--base", "radix"], { cwd: scratch })

  const results = []
  for (const f of files) {
    process.stdout.write(`checking ${f}…`)
    const r = await checkOne(f, scratch)
    results.push(r)
    process.stdout.write(r.hasDrift ? " DRIFT\n" : " ok\n")
  }

  const drifted = results.filter((r) => r.hasDrift)
  console.log(`\n${drifted.length}/${results.length} primitives have drifted from upstream.`)
  for (const r of drifted) {
    console.log(`\n--- ${r.file} (stamp: ${r.stamp ?? "<none>"}) ---`)
    console.log(r.raw.slice(0, 4000))
  }
  process.exit(drifted.length > 0 ? 1 : 0)
}

// Allow this file to be imported by tests without executing main().
const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  main().catch((err) => {
    console.error(err)
    process.exit(2)
  })
}
```

### Step 5.4: Run the test to verify it passes

- [ ] Run: `pnpm --filter @igrp/igrp-framework-react-design-system test scripts/__tests__/check-shadcn-drift.test.mjs`
Expected: PASS — both `parseStampDate` and `listPrimitives` tests green.

### Step 5.5: Wire the package.json script

- [ ] Add to `packages/design-system/package.json` scripts:

```json
"drift:shadcn": "node scripts/check-shadcn-drift.mjs",
```

### Step 5.6: Create the scripts README

- [ ] Create `packages/design-system/scripts/README.md`:

```markdown
# Design system maintenance scripts

## `check-shadcn-drift.mjs`

Periodic (~quarterly) check that compares each primitive under
`src/components/primitives/` against the upstream shadcn registry,
using the shadcn CLI's `--diff` mode in a scratch directory.

**Run:** `pnpm drift:shadcn` (from `packages/design-system/`).

**What it does:**
- Reads the `// shadcn: YYYY-MM-DD` stamp at the top of each primitive.
- Runs `npx shadcn@latest add <name> --dry-run --diff` in a temp dir.
- Reports primitives that have drifted from upstream.

**What to do with drift:**
- If the upstream change is a bugfix → update the local primitive, bump the stamp date, add a changeset.
- If the local divergence is intentional → add an entry to the "IGRP deltas" section of `../COMPONENTS.md` and bump the stamp date so the next run treats it as the new baseline.

This script is slow (hits the network, runs the shadcn CLI per file) and is **not** wired into CI. Run it manually before scheduled refreshes.
```

### Step 5.7: Verify the script is at least loadable (don't run end-to-end — it's slow)

- [ ] Run: `node --check packages/design-system/scripts/check-shadcn-drift.mjs`
Expected: no output (syntax-valid).

### Step 5.8: Commit Task 5

```
git add packages/design-system/scripts/check-shadcn-drift.mjs packages/design-system/scripts/__tests__/check-shadcn-drift.test.mjs packages/design-system/scripts/README.md packages/design-system/package.json
git commit -m "feat(design-system): add shadcn upstream-drift detector

A periodic-maintenance script that compares each primitive against
upstream shadcn via the CLI --diff flow. Run pnpm drift:shadcn to
surface drift, then either refresh the primitive or document the
intentional divergence in COMPONENTS.md."
```

---

## Wrap-up: Single batched release

Per the scoping decision, all five improvements ship under one changeset + one publish at the end. No intermediate publishes.

### Step W.1: Verify everything still builds end-to-end

- [ ] Run: `pnpm build:framework`
Expected: all five packages build green in dependency order.

- [ ] Run: `pnpm dev:demo` and click through: login → home → a form → a table. Stop the server.
Expected: nothing visually or functionally regressed.

### Step W.2: Create the changeset

- [ ] Run: `pnpm changeset`
- Select **only** `@igrp/igrp-framework-react-design-system` (the only package with user-visible changes).
- Select **patch** (per repo hard-rules — never major/minor in pre-release beta mode).
- Use this summary:

```
Design-system quality pass:

- Move react-hook-form, zod, recharts, @tanstack/react-table, date-fns,
  and lucide-react from dependencies to peerDependencies so consumers
  can upgrade independently and avoid duplicate copies.
- Deprecate the /styles export (removal scheduled one beta after this
  release). Templates must import /tokens only.
- Add COMPONENTS.md: full three-layer (Horizon / Primitive / Custom)
  reference table plus IGRP deltas from upstream shadcn.
- Add upstream-drift detector script (pnpm drift:shadcn) for periodic
  primitive refreshes.
- demo-legacy template: document that `npx shadcn add` must not be run
  inside the template (it collides with IGRP primitives).
```

### Step W.3: Apply the version bump

- [ ] Run: `pnpm version:changesets`
Expected: `packages/design-system/package.json` `version` bumps by one patch (e.g. `0.1.0-beta.130` → `0.1.0-beta.131`); `CHANGELOG.md` updated. Commit the resulting changes:

```
git add packages/design-system/package.json packages/design-system/CHANGELOG.md .changeset
git commit -m "chore(release): bump design-system after quality pass"
```

### Step W.4: Build the package one more time (required by the release script)

- [ ] Run: `pnpm build:ds`
Expected: green.

### Step W.5: Publish via the per-package release script (never `changeset publish`)

- [ ] Run: `pnpm --filter @igrp/igrp-framework-react-design-system release`
Expected: `pnpm publish --registry=https://sonatype.nosi.cv/repository/igrp/ --tag latest` succeeds.

### Step W.6: Verify the publish landed

- [ ] Run: `pnpm view @igrp/igrp-framework-react-design-system version --registry=https://sonatype.nosi.cv/repository/igrp/`
Expected: returns the newly bumped version. If it returns the old version, **do not retry blindly** — investigate (auth, network, or registry replication lag).

### Step W.7: Push the branch & open the PR

- [ ] Run: `git push -u origin HEAD` (assumes a feature branch off `dev`; if you've been committing directly to `dev`, stop and confirm with the maintainer first — direct pushes to `dev` are not the workflow here).
- [ ] Open a PR titled `chore(design-system): quality pass — peerDeps, /styles sunset, COMPONENTS.md, drift detector` with a body that lists the five tasks and links to `packages/design-system/CHANGELOG.md` for the user-visible summary.

---

## Self-review notes

- **Spec coverage:** all five improvements from the audit have a task (1 → peerDeps; 2 → /styles sunset; 3 → COMPONENTS.md; 4 → template warning; 5 → drift script). ✅
- **Hard-rule compliance:** changeset is `patch`, publish uses per-package `release` script with `--tag latest`, registry verification before & after, no `--no-verify`, all per `.claude/shared/hard-rules.md`. ✅
- **Risk ordering:** Task 1 first (largest blast radius — install graph for every consumer). Task 2 has an in-step decision point (Option A vs B) with an explicit recommendation to keep it safe. Task 5 last (purely additive). ✅
- **Type/name consistency:** `parseStampDate` and `listPrimitives` are referenced consistently between Step 5.1 and Step 5.3. The Button size set listed in COMPONENTS.md (Task 3) matches the actual CVA in `button.tsx`. ✅
