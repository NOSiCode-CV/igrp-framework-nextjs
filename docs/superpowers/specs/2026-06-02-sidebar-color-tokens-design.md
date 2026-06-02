# Sidebar color tokens — design

**Date:** 2026-06-02
**Status:** Approved (pending spec review)
**Packages touched:** `@igrp/igrp-framework-react-design-system` (tokens), `@igrp/framework-next-ui` (menu active class), `templates/demo-legacy` (override docs)

## Problem

The sidebar chrome (background, text) and the menu active-highlight are token-driven, but:

1. There is **no dedicated token for the active menu item** — the highlight currently reuses `bg-sidebar-primary/10`, coupling it to the brand color. An integrator cannot tune the selected-item color independently of the brand.
2. There is no documented, discoverable surface telling an integrator *which* tokens to edit to recolor the sidebar.

Goal: let whoever sets up an app recolor the sidebar and the menu highlight by editing tokens in the template CSS — no component changes, no runtime picker.

## Non-goals

- No runtime end-user color-picker UI.
- No persistence / per-user storage.
- No new components or providers.

## Design

### 1. New semantic tokens (defaults in the DS)

Add two tokens to `packages/design-system/src/tokens.css`, defined for both light (`:root`) and dark (`.dark`), and registered in `@theme inline`:

```css
:root {
  --sidebar-active: color-mix(in oklab, var(--sidebar-primary) 10%, transparent);
  --sidebar-active-foreground: var(--sidebar-accent-foreground);
}
.dark {
  --sidebar-active: color-mix(in oklab, var(--sidebar-primary) 18%, transparent);
  --sidebar-active-foreground: var(--sidebar-accent-foreground);
}
@theme inline {
  --color-sidebar-active: var(--sidebar-active);
  --color-sidebar-active-foreground: var(--sidebar-active-foreground);
}
```

**Why defaults live in the DS, not the template:** the `next-ui` menu component references `bg-sidebar-active`. If a consumer app failed to define the token, the active background would resolve to nothing and the highlight would disappear. Defining defaults in the DS guarantees a working active state out of the box for every consumer; the template (or any app) can still override.

**Why `color-mix(... --sidebar-primary ...)`:** the default keeps the highlight tracking the brand/theme (e.g. `theme-blue` → blue tint) — preserving today's behavior — while still being its own overridable token. Dark mode uses a higher mix percentage (18%) because the dark sidebar needs more saturation to read.

### 2. Point the menu highlight at the new tokens

In `packages/framework/next-ui/src/components/templates/menus/utils.ts`, `ACTIVE_MENU_ITEM_CLASS` switches from `bg-sidebar-primary/10` (+ `text-sidebar-accent-foreground`) to the dedicated tokens, and adds an icon override so sub-item icons recolor (the DS sub-button forces `[&>svg]:text-sidebar-accent-foreground` unconditionally):

```
data-[active=true]:bg-sidebar-active
data-[active=true]:text-sidebar-active-foreground
data-[active=true]:[&>svg]:text-sidebar-active-foreground
data-[active=true]:hover:bg-sidebar-active
data-[active=true]:hover:text-sidebar-active-foreground
data-[active=true]:data-[state=open]:hover:bg-sidebar-active
data-[active=true]:data-[state=open]:hover:text-sidebar-active-foreground
```

The `data-[active=true]:data-[state=open]:hover:` compound (higher specificity) is retained to beat the DS primitive's `data-[state=open]:hover:bg-sidebar-accent`, which would otherwise drop the highlight when hovering an open active folder.

The collapsed-mode dropdown variant in `sub-leaf-link.tsx` mirrors this:
```
isActive && 'bg-sidebar-active text-sidebar-active-foreground focus:bg-sidebar-active focus:text-sidebar-active-foreground'
```

Hover keeps the same color as the resting active state (pinned, not strengthened) — simpler, and it never reverts to the faint accent.

### 3. Document the override surface in the template

Add a clearly-commented (commented-out) block to `templates/demo-legacy/src/styles/globals.css`, after the token + themes imports, listing every knob:

```css
/* Sidebar appearance — uncomment & set any color. Set BOTH :root (light) and .dark. */
:root {
  /* --sidebar: …                    panel background        */
  /* --sidebar-foreground: …         panel text              */
  /* --sidebar-active: …             selected item background */
  /* --sidebar-active-foreground: …  selected item text/icon  */
  /* --sidebar-accent: …             hover wash               */
  /* --sidebar-border: …             dividers / borders       */
}
```

Note in the comment: for **per-theme** highlight colors, set `--sidebar-active` inside the `.theme-*` blocks in `themes.css`; a global override goes in `globals.css :root`. A global `--sidebar-active` override is NOT recolored by theme switching (theme classes set `--sidebar-primary`, not `--sidebar-active`).

## Token surface (final)

| Token | Controls | New? |
|---|---|---|
| `--sidebar` | panel background | no |
| `--sidebar-foreground` | panel text | no |
| `--sidebar-active` | selected item background | **yes** |
| `--sidebar-active-foreground` | selected item text / icon | **yes** |
| `--sidebar-accent` / `--sidebar-accent-foreground` | hover wash | no |
| `--sidebar-border` | dividers / borders | no |
| `--sidebar-primary` / `--sidebar-primary-foreground` | brand | no |

## Build / release impact

- Dependency order: DS change → rebuild DS → rebuild `next-ui`. `next` needs no change (no public API change) but is rebuilt if doing a full framework build.
- Changesets (both `patch`): add **one new** changeset for `@igrp/igrp-framework-react-design-system` (new tokens); **extend the existing** `menus-active-state.md` changeset (already covers `@igrp/framework-next-ui`) to mention the switch to the dedicated tokens. No second `next-ui` changeset.
- No version/publish without explicit authorization.

## Risks & mitigations

- **`color-mix` browser support:** supported in all modern evergreen browsers; Tailwind v4 already targets modern baselines. Acceptable.
- **Consumer forgets to scan next-ui dist with `@source`:** unchanged from today; `bg-sidebar-active` is generated from the scanned dist. No new requirement.
- **Visual regression in Storybook (DS):** token-only addition; existing snapshots unaffected because defaults reproduce the current rendered look via `color-mix`.

## Verification

- `pnpm build:ds` then `pnpm build:next-ui` compile clean.
- `pnpm dev:demo`: active item shows the tint; overriding `--sidebar-active` in `globals.css` changes it; overriding `--sidebar`/`--sidebar-foreground` recolors the panel; light + dark both correct.
