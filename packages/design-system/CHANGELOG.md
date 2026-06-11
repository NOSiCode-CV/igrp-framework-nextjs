# @igrp/igrp-framework-react-design-system

## 0.1.0-beta.136

### Patch Changes

- 033e1d7: `IGRPDataTable`: disable TanStack's `autoResetPageIndex`/`autoResetExpanded` — their microtask-based reset dispatches state updates before the component mounts under React 19 concurrent rendering ("Can't perform a React state update on a component that hasn't mounted yet"). The page-index reset on filter/sort changes is now handled synchronously in `tableReducer` instead, preserving the previous UX.

## 0.1.0-beta.135

### Patch Changes

- 0eb0323: - `IGRPText`: deprecate the `variant` color prop and stop applying a hard-coded solid color class, so text color now inherits from `className` / semantic tokens instead of being forced to `primary`.
  - `IGRPStatusBanner`: drop redundant `cn()` wrappers around static className strings.

## 0.1.0-beta.134

### Patch Changes

- 6b42572: - Coordinated maintenance release: bump all framework packages to the next beta to keep versions aligned across the framework.

## 0.1.0-beta.133

### Patch Changes

- 1829701: refactor(ds): streamline imports and formatting in Horizon inputs, form, and i18n

  Non-functional readability pass — no API or runtime behavior change:
  - Consolidate multi-line imports/exports onto single lines in `input/search.tsx`, `input/text.tsx`, `i18n/context.tsx`, and `i18n/index.ts`.
  - Reformat the `IGRPForm` `useEffect` dependency array (same dependencies) and collapse a wrapper `div` className in `IGRPInputText`.

## 0.1.0-beta.132

### Patch Changes

- 62faea7: Design-system audit follow-ups (no public API breaks):
  - **`src/lib/colors.ts`**: replace raw Tailwind palette references (`text-emerald-700 dark:text-emerald-400`, `bg-red-500`, etc.) with semantic tokens (`text-success`, `bg-destructive`, …). Dark mode is now driven entirely by token theming. The `IGRPColors` shape and all exported types are unchanged.
  - **`tokens.css`**: add `--destructive-foreground`, `--indigo`, `--indigo-foreground` light and dark values plus their `@theme inline` entries, so `colors.ts` (and downstream consumers) can express the full destructive/indigo roles via semantic tokens.
  - **`IGRPForm`**: the `defaultValues` sync effect now skips reset when the form is dirty, so a parent re-rendering with a new `defaultValues` object reference no longer clobbers user input. Consumers that _want_ to overwrite dirty state should bump `resetKey` or call `formRef.current?.reset()` explicitly.
  - **`IGRPDataTable`**: extract `IGRPDataTableRowActions` to a separate file (`data-table/row-actions-cell.tsx`) without the `"use no memo"` directive, so the React Compiler can memoize per-row renders. The parent table file still opts out (required for `useReactTable`).
  - **Docs**: document the shadcn drift-checker script and the primitives-layer `dark:` policy in the package CLAUDE.md + README.
  - **Tests**: add a Vitest + React Testing Library setup (jsdom) with focused unit tests for `IGRPForm` (submit/validation/global error/dirty guard/pristine sync), `IGRPInputText` (label, helper, error, required), and `IGRPDataTable` (smoke + empty-state).

- 773b8b0: Design-system robustness pass — M1 (a11y), M2 (i18n + type safety), M3 (test breadth + side-effect hygiene). No breaking public API changes.

  **M1 — Accessibility / Slot forwarding**
  - `IGRPInputText` (form-context branch) and `IGRPInputSearch` (both branches) — fix shadcn `FormControl` Slot wiring: the `id` from `useFormField()` now lands on the `<input>` element instead of the positioning wrapper div, so the `<FormLabel htmlFor>` association is correct, screen readers announce labels, and clicking the label focuses the input. The positioning wrapper still exists as a sibling for icon overlays.
  - New a11y assertions in the IGRPForm test suite: clicking `<FormLabel>` focuses the underlying input, and after validation failure the input carries `aria-invalid="true"` plus `aria-describedby` pointing at the form message id.

  **M2 — i18n provider + IGRPForm type tightening**
  - New `IGRPI18nProvider` + `useIGRPi18n()` hook + `IGRPI18nStrings` / `IGRPI18nStringsOverride` types under the new `i18n/` module. pt-PT defaults are exported as `IGRP_I18N_DEFAULTS_PT_PT`. Provider performs per-group shallow merge; missing keys fall back to defaults.
  - Wired into `IGRPDataTable` (`clientClearLabel`, `notFoundLabel`), `IGRPInputPhone` (placeholder, country selector label, default option), `IGRPInputPassword` (toggle aria-label), `IGRPInputNumber` (increment/decrement labels, invalid-value message), `IGRPForm` (submission error toast title + fallback message). Component-level props still override the provider value when supplied.
  - Removed file-level `eslint-disable @typescript-eslint/no-explicit-any` from `IGRPForm`. The remaining `any` is bounded to a single-line type alias (`type AnyZod = z.ZodType<Record<string, any>, any, any>`) that mirrors react-hook-form's `FieldValues` constraint — the `any`s exist to thread through to a third-party generic, not to weaken the public surface. Internal `useForm` / `Resolver` / `UseFormReturn` middle generics tightened from `any` → `unknown`.

  **M3 — Test breadth + side-effect hygiene**
  - New tests: `input-password.test.tsx`, `input-number.test.tsx`, `input-search.test.tsx`, `i18n/__tests__/context.test.tsx`, `scripts/side-effects.test.mjs`. Coverage now includes stepper math, visibility toggle, search submit/Enter, i18n provider merge semantics, and tree-shake hygiene. Suite: 85 tests across 10 files, all green.
  - `scripts/side-effects.test.mjs` is a regression guard: every `.ts`/`.tsx` source file must be free of top-level CSS imports and bare top-level function calls. Catches patterns that would silently defeat consumer tree-shaking with `sideEffects: ["*.css"]`.
  - `form-list.tsx`: replaced `Object.assign(IGRPFormList, { displayName: … })` with direct `IGRPFormList.displayName = …` assignment — equivalent behavior, doesn't trip the side-effect guard, more idiomatic.

- b88c4b1: Add dedicated `--sidebar-active` / `--sidebar-active-foreground` tokens (light + dark, registered in `@theme inline`) for the selected sidebar menu item. Defaults to a `color-mix` tint of `--sidebar-primary` so the highlight tracks the active theme, while remaining independently overridable by consumers.

## 0.1.0-beta.131

### Patch Changes

- 48d2818: Web Interface Guidelines a11y pass: fix dead expander button and inverted theme-color constants; default `aria-hidden` on `IGRPIcon` and enforce an accessible name on icon-only `IGRPButton`; standardize input `aria-describedby`/label wiring and password hardening; add live regions to alert/notification/chat/form; scope `transition-all` and add reduced-motion guards; correct invalid ARIA on stepper/menu-navigation; locale-aware date formatting via `Intl.DateTimeFormat`. Note: `IGRPDataTableCellDate` props change from `dateFormat` to `language`/`dateOptions`.
- 48dd45c: - Use `move-cli` instead of the cmd.exe `move` builtin in the `build:babel` step so the build runs on non-Windows platforms.
- 3377f52: chore(design-system): close-out Bundle A — finish /styles removal, catalogue deltas, add IGRPMenubar, harden drift script
  - Remove the deprecated `/styles` export entirely: dropped from `publishConfig.exports`, the `tailwind:build` script and its build-chain invocation are gone, the generated `src/styles.css` is deleted, `@tailwindcss/cli` dropped from devDependencies. Templates import `/tokens` only and compile Tailwind in the app. README and CLAUDE.md updated to reflect the removal.
  - Catalogue the four remaining IGRP-custom primitive deltas in `COMPONENTS.md` (Accordion, Form, Popover, RadioGroup) alongside the existing Button entry. Combined with Button, this is the complete intentional-divergence baseline the drift detector compares against.
  - Drift detector hardening: spawn options now use `shell: process.platform === "win32"` so `npx`/`npm` shims resolve on Windows; removed the `#!/usr/bin/env node` shebang from the `.mjs` so vitest 4.1.x can import it without a parser error.
  - `drift-baseline-2026-05.md`: first end-to-end run captured. The run revealed two further structural defects in the script (non-interactive `init` blocks on a prompt → no `components.json`; `hasDrift` swallows non-zero CLI exits as `ok`). No actionable baseline this cycle; the next baseline will be the first real one after those fixes land in a follow-up.
  - Add `IGRPMenubar` Horizon wrapper — pure re-export of all 16 primitive `Menubar*` sub-components under `IGRP*` aliases, mirroring the `IGRPDropdownMenu` pattern. Closes the Horizon-layer Menubar gap.

- db24347: Replace raw color utilities with semantic tokens: add a `--highlight` / `--highlight-foreground` token (used by `IGRPText` highlighting) and drop manual `dark:bg-zinc-900/60` overrides on `IGRPModalDialog` sticky header/footer. Reconcile the legacy `index.css` theme with `tokens.css` by adding the previously missing `success`/`warning`/`info` tokens so the `/styles` build matches the `/tokens` export.
- c412311: refactor(design-system): peer-dep heavy libs, deprecate /styles export, add COMPONENTS.md + shadcn-drift detector
  - Move `react-hook-form`, `zod`, `recharts`, `@tanstack/react-table`, `date-fns`, and `lucide-react` from `dependencies` to `peerDependencies` so consumers can upgrade them independently and avoid duplicate copies. Loosened semver ranges; mirrored as `devDependencies` so the DS still builds standalone.
  - Deprecate the `/styles` export. Removed from the dev `exports` map; kept in `publishConfig.exports` for one more beta as a soft-deprecation window. Scheduled for removal in the next beta. Templates must import `/tokens` only and compile Tailwind in the app.
  - Add `packages/design-system/COMPONENTS.md` — three-layer (Horizon / Primitive / Custom) reference map with IGRP deltas from upstream shadcn and the experimental-layer promotion criteria.
  - Add `pnpm drift:shadcn` — periodic-maintenance script that compares each primitive against upstream shadcn via the CLI `--diff` flow. Not wired into CI.
  - demo-legacy template: document that `npx shadcn add` must not be run inside the template (it collides with IGRP primitives).

- 55b7077: design-system: define the missing `--chart-6/7/8` tokens (violet/red/lime, light + dark) that `IGRP_CHART_COLORS` already referenced, so charts with 6–8 series render correct fills instead of blanks. Replace the hardcoded `dark:border-slate-800/60` on the data-table header row with the semantic `border-border` token. Make the data-table input-filter accessible label configurable via a new `ariaLabel` prop (and matching `ariaLabel` on the filter descriptor); pt-PT default labels are unchanged.

  template: extend the theme variants (blue/green/amber/default/mono) beyond `--primary` to also re-theme `--ring`, `--sidebar-primary`, and (for the colored themes) the primary `--chart-1` series, so a selected theme expresses brand identity across focus rings, the active sidebar item, and charts.

## 0.1.0-beta.130

### Patch Changes

- 2a06c02: fix(design-system): add Spinner primitive; announce IGRPLoadingSpinner via role=status; next/image for cropper preview; autocomplete/inputmode on phone & url inputs; replace raw tailwind colors with semantic tokens; narrow transition-all in horizon layer; honor prefers-reduced-motion on animations
- a1fbb7c: - Raise the minimum supported Node.js engine from `>=20.x.x` to `>=22.x.x` to match the rest of the monorepo.

## 0.1.0-beta.129

### Patch Changes

- ac94a9c: Promote experimental components to Horizon: IGRPBreadcrumb (with size/color variants and dropdown collapsing), IGRPBanner (cookie and announcement variants), IGRPImageCropper (basic/circular/zoom/preview variants); add dropzone variant to IGRPInputFile with all UI strings configurable as props
- a4ef1fe: Add success, warning, info as first-class semantic tokens; replace all raw Tailwind colors in IGRPStatsCard with semantic tokens; fix proportional icon sizing in IGRPStatsCard; standardize IGRPButton icon sizes to Tailwind scale and gap to gap-1.5
- 9a0dd9b: fix(data-table): fix filter state desync, date range picker, clear-all button, select rendering, and a11y issues
- 9f9ee3d: Add createIGRPColumnHelper with cellType shortcuts, unified actions prop, declarative filter descriptors, onQueryChange server-side callback, and pagination config prop to IGRPDataTable
- 72268fd: a11y/polish pass: focus rings, motion-safe animations, tabular-nums, text-balance, onError callback, remove stale iconSize prop
- ba86302: Remove dead experimental components (timeline, sheet, progress, appointment-picker); remove IGRPStandaloneList and IGRPRepetitiveComponent; fix sidebar cookie restore on mount; add shadcn audit date tracking to all primitives

## 0.1.0-beta.128

### Patch Changes

- fe2ed3d: - Update `@types/node` to v25.7.0 across all framework packages
  - Bump `typescript-eslint` and `vitest` to latest versions

## 0.1.0-beta.116

### Patch Changes

- beta.116 — template migrator CLI, lock file relocation, and release tooling fixes.

  @igrp/template-migrator
  - New CLI package that automates IGRP template upgrades via `pnpm dlx @igrp/template-migrator@latest`.
  - Bundles all 6 demo-legacy migration guides (01–06) as a cumulative manifest with embedded payloads.
  - Commands: status, plan, apply (--yes / --to), list, rollback, check (CI gate).
  - Lock file moved from root `.igrpmigrations.lock.json` → `.igrpmigrations/lock.json`; backward-compat read of old path on first run.
  - Prebuild pack script cleans payload output on every run to prevent stale files.
  - tsup config: shims disabled (no \_\_dirname polyfill injection before shebang), banner removed (shebang lives in src/cli.ts line 1).

  @igrp/framework-next-template (templates/demo-legacy)
  - `.igrpmigrations/lock.json` pre-seeded to mark all 6 migrations as applied.
  - `create-zip-template.ps1` updated to strip migration guides and payloads from the published zip — only `lock.json` is included so consumers start fully up-to-date.
  - `MIGRATING.md` added: end-user upgrade guide (status → plan → apply workflow).

## 0.1.0-beta.115

### Patch Changes

- Edge-safe auth refactor + App Router error-handling overhaul.

  @igrp/framework-next-auth
  - Split withIGRPAuth() into Edge-safe shell + lazy Node helpers; next-auth (main) and next/headers are no longer static imports. Fixes TypeError reading 'custom' from openid-client leaking into the Edge middleware bundle under Next.js 15.5.15.
  - interopDefault() helper normalizes CJS/ESM default-import mismatch against next-auth v4 (KeycloakProvider, NextAuth).
  - tsup is now the single producer of dist/; added ./oidc and ./providers subpath exports; trimmed root barrel to Edge-safe modules only.
  - Tolerates AUTH_PROVIDER=none by returning a stub instance (404 on auth routes) instead of crashing NextAuth with an empty providers array.

  @igrp/framework-next
  - New ./errors subpath with typed IgrpError hierarchy (IgrpConfigError, IgrpAuthConfigError, IgrpLayoutDataError) and isIgrpError structural guard — designed to survive production error.message redaction via stable error.name.
  - Access-management config validation moved from IGRPLayout into igrpBuildConfig so throws fire at root-segment render where global-error.tsx can catch them.
  - IGRPLayout and fetchLayoutData now throw typed errors instead of raw Error.

  @igrp/framework-next-ui
  - New IGRPSegmentError component for segment-level error.tsx boundaries — renders inside layout chrome, offers reset + go-home actions, accepts resolveCopy(error) for i18n.

  @igrp/framework-next-template (templates/demo-legacy)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-legacy/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

## 0.1.0-beta.114

### Patch Changes

- Edge-safe auth refactor + App Router error-handling overhaul.

  @igrp/framework-next-auth
  - Split withIGRPAuth() into Edge-safe shell + lazy Node helpers; next-auth (main) and next/headers are no longer static imports. Fixes TypeError reading 'custom' from openid-client leaking into the Edge middleware bundle under Next.js 15.5.15.
  - interopDefault() helper normalizes CJS/ESM default-import mismatch against next-auth v4 (KeycloakProvider, NextAuth).
  - tsup is now the single producer of dist/; added ./oidc and ./providers subpath exports; trimmed root barrel to Edge-safe modules only.
  - Tolerates AUTH_PROVIDER=none by returning a stub instance (404 on auth routes) instead of crashing NextAuth with an empty providers array.

  @igrp/framework-next
  - New ./errors subpath with typed IgrpError hierarchy (IgrpConfigError, IgrpAuthConfigError, IgrpLayoutDataError) and isIgrpError structural guard — designed to survive production error.message redaction via stable error.name.
  - Access-management config validation moved from IGRPLayout into igrpBuildConfig so throws fire at root-segment render where global-error.tsx can catch them.
  - IGRPLayout and fetchLayoutData now throw typed errors instead of raw Error.

  @igrp/framework-next-ui
  - New IGRPSegmentError component for segment-level error.tsx boundaries — renders inside layout chrome, offers reset + go-home actions, accepts resolveCopy(error) for i18n.

  @igrp/framework-next-template (templates/demo-legacy)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-legacy/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

## 0.1.0-beta.102

- Initial changelog. Future releases will be documented via [Changesets](https://github.com/changesets/changesets).
