# Monorepo Deep-Review Remediation R2 — Design Spec

**Date:** 2026-06-29
**Scope:** repo-wide (`next-auth`, `next-types`, `design-system`, `next-ui`, `next`, `template-migrator`, `templates/demo-v1`, monorepo tooling)
**Approach:** Surgical fixes only — no architecture rewrites. Each item is an independent change with its own `patch` changeset (publishable packages) and acceptance criteria.
**Source:** Second multi-agent deep review (2026-06-29): 7 package finders → independent source verification → cross-reference against the shipped `2026-06-26-monorepo-deep-review-remediation` backlog. Only **net-new** findings are specced here; overlaps with the prior spec are folded in as cross-referenced delta items; candidates already fixed or already-tracked were dropped (see *Candidates dropped*).

---

## How to read this spec

- This is **R2** — it sits on top of `docs/superpowers/specs/2026-06-26-monorepo-deep-review-remediation-design.md` (all 26 items of which have shipped). It does **not** repeat those; a handful of items here **extend** a prior item and say so explicitly (`extends #N`).
- Items are numbered **1 → 52, highest severity first** (P0 Critical → P3 Low); **item 7 is withdrawn** (see its stub) — 51 actionable items. Fix top-down; do not start a lower band until the band above is merged.
- Each item carries a **cluster tag** — `a11y` · `tokens` · `types` · `release` · `template` · `errors` · `perf` · `dx` — so the cross-cutting themes stay visible inside the severity bands. The two dominant net-new clusters are **a11y** (design-system) and **release/template hygiene**.
- **Verdict** is from source verification: **CONFIRMED** = trigger + wrong output proven in current code; **PLAUSIBLE** = mechanism real but trigger depends on something not observable in-repo (backend response, future input, consumer wiring) — each PLAUSIBLE item names the decision that turns it into a fix or a no-op.
- Each item lists **exact files**, the **problem**, the **impact**, the **fix direction**, **acceptance criteria**, and the **changeset** package. This is a spec, not a step-by-step plan — TDD steps and full code are produced per-band when the work is scheduled (R2 P0/P1/P2/P3 plan files).

## Global constraints (apply to every item)

Copied from `.claude/shared/hard-rules.md` and `dependency-order.md` — every task's requirements implicitly include these:

- **pnpm only**, `engines.node >= 22`. Internal deps use `workspace:*`.
- **Never edit `dist/`.** Source is always under `src/`. Never import package internals (`@igrp/*/dist/...`) — use documented subpath exports.
- **One `patch` changeset per user-visible change** to a publishable package (`pnpm changeset`). **Never `major`/`minor`** — repo is in pre-release `beta` mode; `patch` increments the beta counter only.
- **Build in dependency order:** `next-auth → next-types → design-system → next-ui → next`. After any public-API change to a framework package, run `pnpm build:framework` before consuming downstream.
- **Lint is package-specific:** framework packages = ESLint + Prettier; `templates/demo-v1` = Biome. Do not cross-apply.
- **No publish without explicit per-task authorization.** This spec stages code + changesets only; versioning/publishing is a separate, authorized step using each package's `release` script (never `changeset publish`).
- **`templates/demo-v1` and the storybook package are `changeset`-ignored** (`.changeset/config.json:10-13`) — template/tooling items ship without a changeset; they note `Changeset: none`.

## Cross-package sequencing note

- Most items are single-package and independent.
- **Item 13 (H1 doc-only)** touches `next-auth` docs/comments and pairs naturally with any consumer-side logging guidance, but has no build dependency.
- The design-system a11y cluster (items 1, 2, 3, 5, and the P2 a11y items) all live in `@igrp/igrp-framework-react-design-system` and can land as one band/changeset to avoid churn; rebuild DS (`pnpm build:ds`) before any downstream that relies on the new behavior.
- **Item 11** extends migrator item #18; **Item 30** extends #15; **Item 26** extends #19 — verify the prior fix is present before layering (it is, as of `a520fe9a`/`d5233b08`).

---

# Band P0 — Critical

> Theme: the single highest-traffic data component (`IGRPDataTable`) has a per-render rebuild that the React Compiler is explicitly told not to fix, and a dialog-composition bug that is both an a11y defect and a crash. Both ship to every consumer app.

## 1. `IGRPDataTable` rebuilds columns/helper/filter descriptors every render; `data` passed unmemoized

- **Severity:** Critical · **Verdict:** CONFIRMED · **Cluster:** perf · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/data-table/index.tsx:5` (`"use no memo"`), `:267` (`createColumnHelper()` per render), `:268-281` (`actionColumn` + `allColumns` new array per render), `:284` (`useReactTable({ data, columns: allColumns, … })`), `:345-353` (`filterDescriptors` rebuilt per render)
- **Problem:** The file carries `"use no memo"` (correct — TanStack's `useReactTable` is incompatible with the compiler), but then constructs a fresh `createColumnHelper`, a fresh `allColumns` array, and a fresh `filterDescriptors` array on **every render**, and forwards the caller's `data` straight in. Because the compiler is disabled here, none of these identities are stabilized.
- **Impact:** TanStack rebuilds its column model and resets per-column caches on every parent re-render, with the full set of row models enabled (`getFaceted*`/`getGrouped*`/`getSorted*`, `:288-296`). Scales badly with row/column count. This is the most-used component in the system; the cost is paid in every table in every app. (Partly mitigated by `useReducer` state, but any parent re-render still pays it.)
- **Fix:** `useMemo` `allColumns` and `filterDescriptors` keyed on `[columns, actions]`; memoize/hoist the column helper; document in `IGRPDataTableProps` that `data` and `columns` must be referentially stable (the compiler is off, so the caller owns memoization). Do **not** remove `"use no memo"`.
- **Acceptance:** Storybook interaction or a render-count test shows the column model is not rebuilt on an unrelated parent re-render; `allColumns`/`filterDescriptors` identities are stable across renders when `columns`/`actions` are unchanged. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 2. `IGRPDataTableButtonModal` hosts arbitrary content inside `<DialogDescription asChild>`

- **Severity:** Critical · **Verdict:** CONFIRMED · **Cluster:** a11y · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/data-table/action-button-icon.tsx:272` (`<DialogDescription asChild>{render ? render(close) : children}</DialogDescription>`), footer at `:274-286`
- **Problem:** `asChild` makes `DialogDescription` clone onto its single child via Radix `Slot`. Here the child is whatever `render(close)`/`children` returns — typically a whole form. Two failures: (a) Radix announces the entire form subtree as the dialog's `aria-describedby` description on open; (b) if `render` returns a fragment or multiple roots, `Slot` throws `React.Children.only`.
- **Impact:** Broken dialog semantics for screen-reader users on every modal built with this helper, plus a latent runtime crash for any multi-root `render`. `DialogTitle` is correctly present, so only the description is wrong.
- **Fix:** Drop `asChild`; render `render(close)`/`children` in a plain content `<div>`. If a description is wanted, add a separate short `DialogDescription` string. Keep `DialogTitle`.
- **Acceptance:** modal content renders without being the `aria-describedby` target; a `render` returning a fragment no longer throws; Storybook a11y check on the modal passes. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

---

# Band P1 — High

> Theme: design-system accessibility gaps that reach every form/table/dialog, plus template + release hygiene the prior round never touched.

## 3. Horizon form fields (Select, date-picker) drop `FormControl`'s injected a11y attributes

- **Severity:** High · **Verdict:** CONFIRMED · **Cluster:** a11y · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/primitives/form.tsx:103-115` (the canonical `FormControl` Slot that injects `id`/`aria-invalid`/`aria-describedby`); `…/horizon/input/select.tsx:268` (`<FormControl><IGRPSelectField …/></FormControl>`); `…/horizon/input/date-picker/single.tsx:149` (`<FormControl><DatePickerSingleField …/></FormControl>`)
- **Problem:** `FormControl` injects a11y props via `Slot`, but `IGRPSelectField`/`DatePickerSingleField` consume only their named props and **ignore** the injected `aria-invalid`/`aria-describedby`/`id`. So the Select trigger and the date-picker button get **no error association** in the invalid state. Text/textarea/number happen to work because they pass the props straight to a native `<input>`.
- **Impact:** Screen-reader users get no programmatic error association on Select and date controls — a substantial, repeated a11y gap across the most common form fields.
- **Fix:** Forward the Slot-injected attributes to the real interactive element (e.g. wrap the actual trigger in `FormControl` via `asChild`, or thread `aria-invalid={!!fieldState.error}` + `aria-describedby` down to `SelectTrigger`/the date button, which already accept `id`).
- **Acceptance:** in error state, the Select trigger and date-picker button carry `aria-invalid="true"` and `aria-describedby` pointing at the message id; Storybook a11y interaction confirms. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 4. Charts hardcode hex grid/axis/reference colors as defaults

- **Severity:** High · **Verdict:** CONFIRMED · **Cluster:** tokens · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/charts/area.tsx:64-67`, and identically in `line-chart-inner.tsx:76-79`, `radar-chart-inner.tsx:73`, `radial/radial-chart-inner.tsx:157`, `bars/horizontal-chart-inner.tsx:76-79`, `bars/vertical-chart-inner.tsx:73-76` (`gridColor="#e5e7eb"`, `referenceLineColor="#e5e7eb"`, `axisColor="#d1d5db"`)
- **Problem:** Six chart inners default grid/axis/reference colors to light-grey hex literals — a direct violation of the semantic-tokens rule (`ui-rules.md`, DS `CLAUDE.md`). Series colors already use `var(--chart-N)`, so the layer is internally inconsistent. (Note: the 2026-06-26 chart items #13/#14 touched `charts/lib.ts` math only; these per-chart defaults were untouched.)
- **Impact:** Every chart renders light-grey gridlines/axes in **dark mode** unless the consumer overrides all three props on every chart. No theme adaptation.
- **Fix:** Default to token-driven values (recharts accepts CSS-var strings): `var(--border)` for grid/reference, `var(--border)`/`var(--muted-foreground)` for axis. Keep the props for overrides.
- **Acceptance:** charts render correct grid/axis colors in light **and** dark with no per-chart overrides; grep finds no `#e5e7eb`/`#d1d5db` defaults in `charts/`. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 5. AlertDialog renders an empty or missing description

- **Severity:** High · **Verdict:** CONFIRMED · **Cluster:** a11y · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/alert-dialog.tsx:135-140` (description rendered only `if (description)`); `…/data-table/action-button-icon.tsx:128-131` (`<AlertDialogDescription>{children}</AlertDialogDescription>` — empty when no `children`)
- **Problem:** When `description` is omitted, `IGRPAlertDialog` renders **no** description (dangling `aria-describedby`, Radix dev warning); the data-table alert variant renders an **empty** description element when the action has no description (it's optional, `types.ts:26`).
- **Impact:** Radix logs warnings in consumer apps and SR users get only the title; inconsistent with the modal-dialog handling.
- **Fix:** Render the description only when content exists (and ensure Radix's `aria-describedby` is correctly omitted otherwise), or provide a visually-hidden fallback. Make the title+description contract explicit.
- **Acceptance:** no Radix "missing Description"/"dangling aria-describedby" warning for either variant with or without a description; Storybook a11y passes. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 6. Sidebar: `role="navigation"` on a `<ul>` strips list semantics and emits redundant unlabeled landmarks

- **Severity:** High · **Verdict:** CONFIRMED · **Cluster:** a11y · **Package:** `@igrp/framework-next-ui`
- **Files:** `packages/framework/next-ui/src/components/templates/menus/section-group.tsx:26` (`<SidebarMenu role="navigation">`); DS `primitives/sidebar.tsx:431-440` (`SidebarMenu` renders a `<ul>`)
- **Problem:** `role="navigation"` on a `<ul>` overrides its implicit `list` role, and `SectionGroup` renders once per section, so a multi-section sidebar emits several **unlabeled** `navigation` landmarks. The DS `Sidebar` root is a plain `<div>`, so there is currently no real navigation landmark at all.
- **Impact:** Lists lose their semantics; landmark navigation degrades to "navigation, navigation, navigation".
- **Fix:** Remove `role="navigation"` from `SidebarMenu`. Wrap the sidebar's menu region **once** in a real `<nav aria-label="Menu principal">` (pt-PT default, overridable) — in `IGRPTemplateMenus` or around the DS `Sidebar` content.
- **Acceptance:** exactly one labeled `navigation` landmark for the sidebar; `<ul>`s keep `list` semantics; axe/Storybook a11y passes. `pnpm build:next-ui` green.
- **Changeset:** `@igrp/framework-next-ui` (patch).

## 7. (Withdrawn) Root `release:publish` / `release:all` scripts

- **Status:** **Withdrawn 2026-06-29** by maintainer decision. The repo is intentionally on the `0.1.0-beta.*` pre-release line, so the `changeset publish` (`--tag beta`) release scripts are correct for now and are deliberately left as-is. Not an actionable item; do not re-file while the repo remains in beta pre-release mode. (Item number retained so the band plans' `spec #N` references stay stable.)

## 8. `.env.example` omits the `NEXTAUTH_URL` + basePath + `/api/auth` rule

- **Severity:** High · **Verdict:** CONFIRMED · **Cluster:** template · **Package:** `templates/demo-v1` (no changeset)
- **Files:** `templates/demo-v1/.env.example:55-57` (`NEXTAUTH_URL=` with only a generic comment)
- **Problem:** The canonical reference doesn't document the hard constraint stated in `CLAUDE.md` and `templates/demo-v1/CLAUDE.md`: when `NEXT_PUBLIC_BASE_PATH` is set, `NEXTAUTH_URL` must include both the basePath **and** `/api/auth`. The redirect callback (`next-auth` `deriveAppBaseUrl`) assumes that suffix is present; the docs never tell the consumer to add it. The callback/post-logout block (`.env.example:33-42`) documents basePath variants correctly, making this omission stand out.
- **Impact:** The documented #1 cause of the login loop with a growing nested `?callbackUrl=…` chain. Consumers copy this file.
- **Fix:** Mirror the `:33-42` treatment for `NEXTAUTH_URL`: show both forms (`http://localhost:3000/api/auth` and `…/apps/template/api/auth`) and note NextAuth treats the value as its API root.
- **Acceptance:** `.env.example` documents both forms and the basePath rule; no code change. Manual: a fresh consumer following the file does not hit the login loop with a basePath.
- **Changeset:** none (template is changeset-ignored).

## 9. React Query provider mounted only in the regenerable `(generated)` shell

- **Severity:** High · **Verdict:** CONFIRMED · **Cluster:** template · **Package:** `templates/demo-v1` (no changeset)
- **Files:** `templates/demo-v1/src/app/(igrp)/(generated)/layout.tsx:6` (`<IGRPQueryProvider>` — the only mount, grep-confirmed); provider at `src/providers/query-client.tsx`
- **Problem:** The app-wide React Query provider wraps only `(generated)` routes. Two issues: (a) **scope hole** — `(demo)` and root `(igrp)` routes aren't inside it, so any `useQuery`/`useMutation` there throws "No QueryClient set"; (b) **regenerability** — per `igrp-module-architecture`, `(generated)` is Studio-owned and may be wiped, destroying the provider. The folder is Biome-excluded (`biome.json:20`), confirming it's treated as generated.
- **Impact:** The canonical template teaches consumers to place a cross-cutting provider in the one folder guaranteed not to survive; data-layer breaks outside `(generated)`.
- **Fix:** Hoist `IGRPQueryProvider` to a hand-owned layout covering the whole authenticated app — `src/app/(igrp)/layout.tsx` or the root providers. Leave `(generated)/layout.tsx` a trivial pass-through (or delete it).
- **Acceptance:** `useQuery` works in a `(demo)` route; the provider survives a `(generated)` regeneration (lives outside it). Build + dev smoke green.
- **Changeset:** none (template is changeset-ignored).

## 10. Client components read `NEXT_PUBLIC_IGRP_APP_CODE`, which is defined nowhere

- **Severity:** High · **Verdict:** CONFIRMED · **Cluster:** template · **Package:** `templates/demo-v1` (no changeset)
- **Files:** `templates/demo-v1/src/app/(auth)/logout/page.tsx:203`, `…/login/logout-completion.tsx:53` (both read `process.env.NEXT_PUBLIC_IGRP_APP_CODE`); `.env.example`/`.env` define only the server-only `IGRP_APP_CODE`
- **Problem:** These client components reach for a `NEXT_PUBLIC_` variant that was never created (grep-confirmed absent from `.env` and `.env.example`); the server-only `IGRP_APP_CODE` is unreadable client-side. The prop is therefore always `undefined`.
- **Impact:** Logout/teardown loading screens silently lose app-code branding; a consumer copying this inherits a dead env reference with no error.
- **Fix:** Either add `NEXT_PUBLIC_IGRP_APP_CODE` to `.env.example`/`.env` (with a note the client needs the public variant), or resolve the app code server-side and pass it as a prop. Make server and client agree.
- **Acceptance:** the loading screens render the app code; no read of an undefined env var (grep). Build + dev smoke green.
- **Changeset:** none (template is changeset-ignored).

## 11. Migrator `requires` is a consistency check on file-order, not a toposort — mis-authored `requires` deadlocks `apply` (extends #18)

- **Severity:** High · **Verdict:** CONFIRMED (gap) / PLAUSIBLE (trigger) · **Cluster:** dx · **Package:** `@igrp/template-migrator`
- **Files:** `packages/template-migrator/src/commands/apply.ts:28` (`pending` = manifest/file order), `:40-45` (the item-#18 `requires` gate — checks `appliedIds`, hard-aborts on miss); `scripts/pack.ts:62-82` (packs `fm.requires` verbatim, no graph validation)
- **Problem:** Item #18 added the `requires` *gate*, but execution order is still the numeric filename sort; `requires` only *checks* against already-applied ids, it doesn't *order*. If a migration `NN` declares `requires: ["<a-later-or-typo'd-id>"]`, `apply` reaches `NN` first, sees the requirement unapplied, and aborts permanently on a fresh app. `pack.ts` validates nothing (existence, uniqueness, earlier-than).
- **Impact:** A mis-authored or typo'd `requires` permanently deadlocks every consumer's `apply` with a confusing message. Currently safe by convention (all 23 migrations form a strict linear chain) — but unguarded.
- **Fix:** Add a build-time validation pass in `pack.ts` (fail the pack) that rejects duplicate ids, asserts every `requires` resolves to a known **earlier** migration, and (ideally) topologically validates. Optionally order `apply` by toposort so `requires` becomes load-bearing.
- **Acceptance:** packing a migration set with a forward/typo'd/duplicate `requires` fails at pack time with a clear error; a valid set packs unchanged. Test in `src/__tests__`. `pnpm --filter @igrp/template-migrator test` green.
- **Changeset:** `@igrp/template-migrator` (patch).

## 12. `index.css` has drifted from `tokens.css` (Storybook root misrenders)

- **Severity:** High (impact Medium — Storybook only) · **Verdict:** CONFIRMED · **Cluster:** tokens · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/index.css` vs `packages/design-system/src/tokens.css`; importer `packages/design-system-storybook/.storybook/preview.ts:2`
- **Problem:** `tokens.css` declares `--destructive-foreground`, `--indigo*`, `--sidebar-active*` (16 occurrences); `index.css` has **none** of them, yet `lib/colors.ts` actively emits `text-destructive-foreground`/`*-indigo`. `index.css` is the **Storybook root stylesheet** (`design-system-storybook/.storybook/preview.ts:2` imports `../src/index.css`) — so it is **not** an orphan (corrected from the initial review): the drift means Storybook renders destructive/indigo/sidebar-active variants with undefined custom properties, i.e. Storybook no longer faithfully previews what `/tokens`-importing consumers get.
- **Impact:** Storybook misrenders the affected variants; the hand-maintained duplication will keep drifting.
- **Fix:** Make `index.css` `@import "./tokens.css"` (then keep only the Storybook-specific Tailwind/keyframes/reset extras on top), eliminating the duplicated token blocks. Optionally add a test asserting `index.css`'s custom-property names are a superset of `tokens.css`.
- **Acceptance:** `index.css` imports `tokens.css`; the drifted tokens resolve in Storybook; `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 13. (doc-only) Session carries `accessToken` + `idToken` — document the trade-off, never log client-side

- **Severity:** High (awareness) · **Verdict:** CONFIRMED · **Cluster:** docs · **Package:** `@igrp/framework-next-auth` (no code change)
- **Files:** `packages/framework/next-auth/src/config.ts:627-635` (session callback copies `accessToken` + `idToken`); `session.ts`, `types.ts` (declare the fields)
- **Decision (from R2 scoping):** keep both tokens; **document** rather than change. `accessToken` exposure is intentional (the client AM client reads `session.accessToken`); `refreshToken` is correctly omitted.
- **Problem/Impact:** Both tokens are readable over `/api/auth/session` and via `useSession()` — broadening the XSS blast radius (an XSS exfiltrates a bearer token, not just a cookie) and risking token leakage into any client telemetry that serializes the session.
- **Fix (docs only):** Add a security note (package `CLAUDE.md` / a JSDoc on the session callback and `Session` type) stating the session intentionally carries `accessToken`/`idToken`, that consumers must never log/serialize the session object client-side, and that error/telemetry pipelines must redact it. No runtime change.
- **Acceptance:** the security note exists at the session callback + `Session` type; no behavioral change. (If a future round wants to drop `idToken`, that's a separate item.)
- **Changeset:** `@igrp/framework-next-auth` (patch) — doc/comment change is user-visible in the published types' JSDoc.

---

# Band P2 — Medium

## 14. `getLoginRedirectUrl` reads `process.env` instead of the injected `env`

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/framework-next-auth`
- **Files:** `packages/framework/next-auth/src/config.ts:763-766` (`process.env.NEXT_PUBLIC_BASE_PATH ?? ''`); compare the `env.NEXTAUTH_URL_INTERNAL` read on the same line
- **Problem:** Every other primitive uses the injected `env` (the `withIGRPAuth({ env })` contract); this one mixes in raw `process.env` for the base path. Same pattern at `:749`/`:779` (`secret || process.env.NEXTAUTH_SECRET`, lower impact since `secret` already defaults from `process.env` at the factory top).
- **Impact:** A consumer passing a validated/custom `env` map gets an inconsistent base path here — the exact env-source divergence class that produced the prior secure-cookie bug.
- **Fix:** Read `env.NEXT_PUBLIC_BASE_PATH ?? ''`; align the `secret` fallbacks to the injected `env`.
- **Acceptance:** new `getLoginRedirectUrl` test with a custom `env` (basePath + `NEXTAUTH_URL_INTERNAL`) returns the injected values; no `process.env` reads remain in the factory body except the documented top-level defaults. `pnpm build:auth` green.
- **Changeset:** `@igrp/framework-next-auth` (patch).

## 15. `IGRPConfigArgs` declares conditionally-required fields as unconditionally required

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** types · **Package:** `@igrp/framework-next-types`
- **Files:** `packages/framework/next-types/src/types/igrp.ts:10` (`appCode: string`), `:21-53` (`apiManagementConfig` credential fields required); runtime contradicts at `next/src/lib/build.ts:11-13` (schema `.optional()`), `:133` (`typeof config.appCode === 'string'` guard), `next-ui` sidebar-data-provider throw on `!appCode`, `build.test.ts` `as unknown as IGRPConfigArgs` cast
- **Problem:** The declared type asserts more than the runtime honors (the schema and code comments admit it). Consumers get no compiler help for the genuinely-conditional fields, and the framework re-validates + casts everywhere.
- **Impact:** "Optional-everything in disguise": the public type over-promises; templates author configs that don't satisfy the declared shape.
- **Fix:** Model the real invariant — a discriminated union on the sync/preview gates (a `baseUrl`-only variant vs a sync-enabled variant carrying `serviceId`/`m2mClient*`); type `appCode` as `string` only on the *post-`igrpBuildConfig`* type while the input allows `string | undefined`. Minimum: make the credential fields optional so the type matches the schema. (Distinct from prior item #10, which fixed `IGRPMenuItemArgs.id`.)
- **Acceptance:** a config omitting AM credentials with `syncAccess` off type-checks without casts; one omitting them with sync **on** is a type error (or clearly runtime-guarded). `pnpm build:next-types && pnpm build:framework` green. Also align the `serviceId` JSDoc (`igrp.ts:28-29`) with its case-insensitive regex while here.
- **Changeset:** `@igrp/framework-next-types` (patch).

## 16. Mappers launder external DTO enums into closed unions via unchecked `as`

- **Severity:** Medium · **Verdict:** PLAUSIBLE (trigger = AM returns an out-of-union value) · **Cluster:** types · **Package:** `@igrp/framework-next`
- **Files:** `packages/framework/next/src/mappers/menus-mapper.ts:9-23` (`as IGRPMenuType`/`as IGRPStatus`/`as IGRPTargetType`), `applications-mapper.ts:4-20` (`as` casts; also `id as number` although `ApplicationDTO.id` is `number | undefined`)
- **Problem:** The AM client's open enums are cast straight into IGRP's closed unions with no membership check. If AM returns a value IGRP doesn't model, the object is *typed* as the union but *holds* an outside value, and downstream exhaustiveness logic mis-handles it silently. (Prior item #10 removed only the `id as number` cast in one place.)
- **Impact:** Soundness hole at the external trust boundary; a new AM menu type/status silently mis-renders.
- **Fix:** Validate at the mapper boundary — a small membership guard (`isIGRPMenuType(x) ? x : 'MENU_PAGE'` or throw `IgrpLayoutDataError`) and `id: app.id ?? 0` (or make `id` optional). A Zod parse or `satisfies`-backed check at the boundary.
- **Acceptance:** an AM payload with an unknown `type`/`status` is coerced to a safe default or throws a typed error (not silently mistyped); tests cover both. `pnpm build:next` green.
- **Changeset:** `@igrp/framework-next` (patch).

## 17. Read hooks construct the AM client inline, bypassing the guarded `igrpGetAccessClient` (regression from #4)

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/framework-next`
- **Files:** `packages/framework/next/src/hooks/use-user.ts:21-26`, `use-menus.ts:15-20`, `use-applications.ts:12-17` & `:23-28` (inline `AccessManagementClient.create({…})`); canonical guarded builder at `api-client.ts:11-15` (`if (!baseUrl || !token) throw`, configured timeout)
- **Problem:** The item-#4 rewrite (token-out-of-cache-key) left each read hook constructing its own client inline — hardcoding `timeout: 10_000` and **skipping** the empty-credential guard that `igrpGetAccessClient` enforces. So a hook invoked with an unset store builds `Authorization: Bearer ` and only fails as a 401 round-trip. Five+ copies of the construction policy.
- **Impact:** Latent inconsistency + missing guard introduced as a side effect of #4; a config/timeout change must be made in many places.
- **Fix:** Route all read hooks through `igrpGetAccessClient()` (it already reads per-request config and enforces the guard), or extract one internal `createAmClientFromConfig()` used everywhere including `igrpGetAccessClient`.
- **Acceptance:** no hook calls `AccessManagementClient.create` directly (grep); an unset store surfaces the guard's error, not a blind 401. `pnpm build:next` green.
- **Changeset:** `@igrp/framework-next` (patch).

## 18. Breadcrumb collapse trigger removes focus outline with no visible replacement

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** a11y · **Package:** `@igrp/framework-next-ui`
- **Files:** `packages/framework/next-ui/src/components/templates/breadcrumbs.tsx:183` (`DropdownMenuTrigger className="… focus:outline-none"`, no `focus-visible:ring`)
- **Problem:** `focus:outline-none` with no focus-visible replacement on the collapsed-breadcrumb ellipsis; a keyboard user gets no visible focus indicator. `command-search.tsx:77` already does this correctly.
- **Impact:** Keyboard users can't see focus on the ellipsis menu.
- **Fix:** Replace with `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (or drop `focus:outline-none`).
- **Acceptance:** keyboard focus on the ellipsis shows a visible ring; Storybook/axe passes. `pnpm build:next-ui` green.
- **Changeset:** `@igrp/framework-next-ui` (patch).

## 19. `IGRPTemplateThemeSelector` throws when mounted outside `IGRPActiveThemeProvider`

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** errors · **Package:** `@igrp/framework-next-ui`
- **Files:** `packages/framework/next-ui/src/components/templates/theme-selector.tsx` (calls `useIGRPThemeConfig()`); provider in `providers/nested.tsx:36`
- **Problem:** The selector is exported (`index.ts:78`) but `useIGRPThemeConfig()` throws unless wrapped in `IGRPActiveThemeProvider`. A consumer composing providers manually (the package ships separable pieces) can mount it and crash the tree. (Prior item #25 only memoized the provider value; it didn't make the consumer tolerant.)
- **Impact:** A public component crashes depending on invisible provider wiring.
- **Fix:** Make `useIGRPThemeConfig` degrade gracefully (return a no-op `setActiveTheme` + default when context is undefined) so the selector renders inertly, or clearly document the provider dependency on the export.
- **Acceptance:** mounting `IGRPTemplateThemeSelector` without the provider renders without throwing (or is documented as requiring it); `pnpm build:next-ui` green.
- **Changeset:** `@igrp/framework-next-ui` (patch).

## 20. Error-boundary retry uses an uncleaned `setTimeout` + an artificial delay

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** errors · **Package:** `@igrp/framework-next-ui`
- **Files:** `packages/framework/next-ui/src/components/errors/global.tsx:67-73` (`RESET_DELAY_MS` ~1000ms), `segment.tsx:94-100` (~400ms)
- **Problem:** `handleReset` schedules `reset()` + `setIsResetting(false)` via `setTimeout` with no stored id and no cleanup; if the boundary unmounts during the delay, it sets state on an unmounted component. The artificial pre-`reset()` delay is pure latency. (The effect-timer at `:61` *is* cleaned; the handler timer isn't.)
- **Impact:** setState-after-unmount risk; up to a second of dead time before recovery.
- **Fix:** Call `reset()` immediately (let the spinner show only if `reset` is async), or store the id and `clearTimeout` on unmount (the session-watcher already models this).
- **Acceptance:** no setState-after-unmount path; recovery isn't artificially delayed. `pnpm build:next-ui` green.
- **Changeset:** `@igrp/framework-next-ui` (patch).

## 21. `IGRPLayoutErrorBoundary` has no reset, no logging, no `componentDidCatch`

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** errors · **Package:** `@igrp/framework-next-ui`
- **Files:** `packages/framework/next-ui/src/components/templates/layout-error-boundary.tsx:15-26`
- **Problem:** The class implements only `getDerivedStateFromError` → render `fallback`. No `componentDidCatch` (the error is never logged), and `hasError` latches forever with no reset — unlike `IGRPSegmentError`/`IGRPGlobalError`, which offer retry.
- **Impact:** A chrome failure becomes permanent for the page lifetime with zero observability.
- **Fix:** Add `componentDidCatch(error, info)` calling an optional `onError` prop (+ `console.error` in dev) and expose a reset path (`fallback` as a render-prop receiving `reset`).
- **Acceptance:** an error in the boundary is logged and recoverable via the fallback. `pnpm build:next-ui` green.
- **Changeset:** `@igrp/framework-next-ui` (patch).

## 22. `useFormField` reads context before its own null guard (dead guard)

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/primitives/form.tsx:47-53`
- **Problem:** `fieldContext.name` is read at `:50` before the `if (!fieldContext) throw` at `:53`; the default context is `{}`, so the throw is unreachable and a genuine null would throw a worse error first. File is stamped "CHANGED FROM THE ORIGINAL", so fair game.
- **Impact:** Misleading guard; low runtime impact.
- **Fix:** Move the check above first use; type the default context as nullable (or assert).
- **Acceptance:** the guard fires before any `.name` access; existing form tests/stories unaffected. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 23. `IGRPDataTable` redundant pagination/server-mode booleans

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/data-table/index.tsx:56-114` (`isNumericPagination`, `isServerSide`), `:325-328` (manual* derived from `onQueryChange`), `:500` (`isNumericPagination || pagination?.type === "numeric"`)
- **Problem:** `isNumericPagination` overlaps `pagination.type`, and `isServerSide` is redundant with `onQueryChange` (the table already derives `manual*` from it). Two switches per concept invite ambiguous precedence and drift (`isServerSide` true with no `onQueryChange`).
- **Impact:** Combinatorial/ambiguous public API on the most-used component.
- **Fix:** Deprecate `isNumericPagination` in favor of `pagination.type`; derive server mode solely from `onQueryChange` and deprecate `isServerSide` (or assert agreement). Keep back-compat with deprecation JSDoc.
- **Acceptance:** redundant props are `@deprecated` with documented precedence; behavior unchanged for existing callers. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 24. DataTable sortable header: `aria-sort` on the wrong element, not keyboard-correct

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** a11y · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/data-table/header.tsx:46-74` (`aria-sort`/`aria-label` on the outer `<div>`; interactive control is the inner `<Button>`), `:91` (dropdown variant: `aria-label` on a `<div>`, no `aria-sort`); `index.tsx:428` (`<TableHead>` has no `scope="col"`/`aria-sort`)
- **Problem:** Sort state lives on a nested non-interactive `<div>` instead of the column-header cell; assistive tech doesn't associate sort direction with the column, and the accessible name isn't on the operable control.
- **Impact:** Sort direction is not reliably announced.
- **Fix:** Move `aria-sort` onto `<TableHead>` (compute from `header.column.getIsSorted()`), add `scope="col"`, keep the accessible name on the `<Button>`, remove the redundant div-level `aria-label`.
- **Acceptance:** `<th>` carries correct `aria-sort` + `scope="col"`; SR announces sort direction; Storybook a11y passes. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 25. `IGRPSelect` mirrors RHF state into a local reducer (stale label after reset)

- **Severity:** Medium · **Verdict:** CONFIRMED (mechanism) / PLAUSIBLE (stale-after-reset path) · **Cluster:** dx · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/input/select.tsx:175-206` (internal `useReducer selected`), `:189-196` (`selectedLabel` reads non-reactive `getValues()` in the form branch), `:271-276` (`onChange` writes both `field.onChange` and the reducer)
- **Problem:** In the form branch the label derives from `getValues()` (not reactive) with deps on `state.selected`; a programmatic `form.setValue`/`reset` won't update `state.selected`, so the trigger can show a stale label after reset. One value, two owners.
- **Impact:** "Controlled value didn't update" class of bug after form reset.
- **Fix:** In the form branch drive the trigger purely from `field.value`; keep the reducer only for the standalone (non-form) branch.
- **Acceptance:** after `form.reset()`/`setValue`, the Select trigger reflects the new value; standalone usage unchanged. Storybook interaction confirms. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 26. Template rebuilds full config in both layouts (`createConfig` not memoized) — extends #19

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** template · **Package:** `templates/demo-v1` (no changeset)
- **Files:** `templates/demo-v1/src/app/layout.tsx:27-30`, `src/app/(igrp)/layout.tsx:19-20` (both `await createConfig(layoutConfig)`); builder `igrp.template.config.ts:16`
- **Problem:** Prior item #19 / migration-23 memoized `getLayoutConfig` (so `configLayout`/`serverSession` run once), but `createConfig` itself is not `cache()`-wrapped and runs in both layouts on every authenticated navigation, re-allocating the config + mock-data closures (the `getRoutes` disk read is separately amortized).
- **Impact:** Duplicated hot-path work; ambiguous for a reference (is building twice intentional?).
- **Fix:** Wrap `createConfig` in `cache()` (same pattern as `getLayoutConfig`) so both layouts share one config object — or split a lighter root-config builder from the full `(igrp)` one. Verify the `after()` sync still fires exactly once.
- **Acceptance:** `createConfig` runs once per request across both layouts; the AM `after()` sync still fires once. Dev smoke green.
- **Changeset:** none (template is changeset-ignored).

## 27. Middleware comment claims "page routes only" but the matcher includes `/api`

- **Severity:** Medium · **Verdict:** CONFIRMED (stale comment only) · **Cluster:** template · **Package:** `templates/demo-v1` (no changeset)
- **Files:** `templates/demo-v1/src/middleware.ts:136-137` (`// Matcher: page routes only (legacy template)`, then `export const { config } = auth`); framework default at `next-auth/config.ts:110` (`DEFAULT_MATCHER` includes `/api/:path*`)
- **Problem:** The inherited matcher *does* run on API routes; the comment misinforms anyone reasoning about edge behavior. (The earlier "matcher hardcodes `apps`" concern was a mischaracterization — the matcher derives from the framework `auth` object, not a hardcoded literal here; only the stale comment is a real template defect.)
- **Impact:** Misleading documentation in the canonical middleware example.
- **Fix:** Correct the comment to state that API routes are matched (and `/api/auth/*` is allowed through via `isPublicPath`). No behavior change.
- **Acceptance:** comment matches the actual matcher. No code change.
- **Changeset:** none (template is changeset-ignored).

## 28. Changeset `baseBranch` is `main`, but the default branch is `dev`

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** release · **Package:** repo root (no changeset)
- **Files:** `.changeset/config.json:8` (`"baseBranch": "main"`); `origin/HEAD` → `dev`
- **Problem:** `changeset version`/`status` diff against `baseBranch` to find changed packages and changelog provenance; pointing at a `main` that isn't the integration branch yields wrong "changed since base" results. `CLAUDE.md`/`commands.md` also say `main`, so the docs agree with the wrong config.
- **Impact:** Misattributed changelogs / wrong changed-package detection.
- **Fix:** Set `"baseBranch": "dev"` and update the `CLAUDE.md`/`commands.md` mentions. If `main` is intended as a future release branch, document that explicitly.
- **Acceptance:** `baseBranch` is `dev`; `changeset status` reports correct changed packages on a `dev` working tree.
- **Changeset:** none (repo tooling).

## 29. Drift gate `staleDelete` is a soft warning — a forgotten template deletion passes

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/template-migrator`
- **Files:** `packages/template-migrator/scripts/check-drift.ts:197-201` (`staleDelete` printed as `⚠`, not counted), `:204-205` (`failed` tally excludes it)
- **Problem:** The gate's purpose is to catch template/migration divergence, but a migration that **deletes** a path while the live template still ships it is downgraded to a non-failing warning — exactly the divergence (new-app zip vs upgraded-app migrator) the gate exists to block.
- **Impact:** A delete-vs-present divergence ships green.
- **Fix:** Promote `staleDelete` to a hard failure (add to `failed`), or gate legitimate cases behind an explicit allowlist with a documented rationale.
- **Acceptance:** a migration deleting a still-present template file fails `check:drift`; legitimate allowlisted cases pass. `pnpm --filter @igrp/template-migrator check:drift` behaves accordingly; tests cover it.
- **Changeset:** `@igrp/template-migrator` (patch).

## 30. `env.add` rollback loses doc/`required_if` metadata and orphans comment lines — extends #15

- **Severity:** Medium · **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/template-migrator`
- **Files:** `packages/template-migrator/src/apply.ts:87-104` (`env.remove` undo builds `{ doc: "", default: … }`; strips only the `KEY=` line, not the preceding `# doc` / `# Required if:` lines)
- **Problem:** Prior item #15 added `env.remove` + line-anchored idempotency, but its acceptance never checked the doc round-trip. On add→rollback the key's value survives but the doc/`Required if:` annotation is lost, and rollback leaves **orphaned comment lines** in the consumer's `.env`.
- **Impact:** A rollback (or rollback→reapply) silently degrades the consumer's `.env` documentation and leaves dangling comments.
- **Fix:** On `env.remove`, also consume the immediately-preceding comment block; store enough metadata to reconstruct the doc on re-add (or accept lossy doc but never orphan comments).
- **Acceptance:** new test asserts the `.env` is byte-clean after add→rollback (no orphan comments) and the doc/`Required if:` round-trips on add→rollback→add. `pnpm --filter @igrp/template-migrator test` green.
- **Changeset:** `@igrp/template-migrator` (patch).

---

# Band P3 — Low

> Polish, correctness nits, i18n, and dead code. Land in one or two cleanup changesets per package. Grouped where trivially related.

## 31. DS form-field class typos — `bg-backsground`, `fielName`
- **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/igrp-framework-react-design-system`
- `input/checkbox.tsx:102`, `input/switch.tsx:101` ship `cn("bg-backsground", …)` — not a class (typo for `bg-background`), emits nothing; `switch.tsx` also has `fielName` misspelled throughout. **Fix:** correct/remove; rename the variable. **Acceptance:** grep finds no `backsground`/`fielName`. `Changeset:` DS (patch).

## 32. `IGRPStatusBanner` ships placeholder default copy + `size-*` nit
- **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/igrp-framework-react-design-system`
- `custom/status-banner.tsx:42-44` defaults `text="Insert our Text here"`, `badgeText="Badge Text"` (render in prod if a prop is forgotten); `:57` `h-3 w-3` should be `size-3`. **Fix:** make `text`/`badgeText` required or default to empty/null; `size-3`. `Changeset:` DS (patch).

## 33. DS barrel re-exports third-party types into the public API
- **Verdict:** CONFIRMED · **Cluster:** types · **Package:** `@igrp/igrp-framework-react-design-system`
- `src/index.ts:877-892` re-exports `@tanstack/react-table` and `react-day-picker` types. They're hard peers, so keep-and-document as pass-throughs, or drop and let consumers import upstream directly. **needs confirmation** whether templates rely on these today. `Changeset:` DS (patch).

## 34. `use-meta-color` hardcoded hex (legit exception, undocumented)
- **Verdict:** CONFIRMED · **Cluster:** tokens · **Package:** `@igrp/igrp-framework-react-design-system`
- `hooks/use-meta-color.ts:7-10` hardcodes `#ffffff`/`#09090b` for `<meta name="theme-color">` (can't use CSS vars — legit), but duplicates `--background` and is already slightly out of sync (`#09090b` is zinc-950). **Fix:** comment that these mirror `--background` and must change together, or read the computed token at runtime. `Changeset:` DS (patch).

## 35. Inconsistent `"use client"` across the Custom layer
- **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/igrp-framework-react-design-system`
- Only `custom/stats-card-mini.tsx:1` has `"use client"`; the other three custom files don't (safe today via the barrel boundary, latent trap). **Fix:** add `"use client"` to all four for defense-in-depth. `Changeset:` DS (patch).

## 36. `IGRPAlertDialog` builds hover classes by string-concat, bypassing `cn()`
- **Verdict:** CONFIRMED · **Cluster:** tokens · **Package:** `@igrp/igrp-framework-react-design-system`
- `horizon/alert-dialog.tsx:99` builds `` `${strongColors.bg} hover:${strongColors.bg}` `` (yielding duplicated/conflicting hover utilities) and `:112` wraps `<AlertDialog>` in `<Slot id>`. **Fix:** use `cn(strongColors.bg)` (it already includes the hover); drop the manual `hover:` concat. `Changeset:` DS (patch).

## 37. DataTable numeric pagination `Select` uses a static colliding `id`
- **Verdict:** CONFIRMED · **Cluster:** a11y · **Package:** `@igrp/igrp-framework-react-design-system`
- `data-table/pagination.tsx:233` hardcodes `id="results-per-page"` (collides across two tables on one page); the `useId()` is already computed at `:151`. **Fix:** use the `useId()` value. `Changeset:` DS (patch).

## 38. Charts lack an empty/no-data state (only Pie has a fallback)
- **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/igrp-framework-react-design-system`
- `charts/pie.tsx:14-27` lazy-loads with a skeleton; area/line/bar/radar/radial render an empty plot for `data: []` (and `getChartHeight` collapses to `minHeight`). **Fix:** shared "Sem dados" empty-state guard across wrappers (pt-PT default). `Changeset:` DS (patch).

## 39. `IgrpErrorCode` union vs `code: string` defeats discrimination
- **Verdict:** CONFIRMED · **Cluster:** types · **Package:** `@igrp/framework-next`
- `errors.ts:31-38` declares the union but `:59` types `readonly code: string` and constructors accept `IgrpErrorCode | (string & {})`; `IGRP_LAYOUT_DATA_FAILED` is never thrown while `IGRP_APP_CODE_MISSING` is thrown (`next-ui` sidebar-data-provider). **Fix:** type base `code` as `IgrpErrorCode` (or make `IgrpError<C extends string = IgrpErrorCode>`); reconcile the union with thrown codes. `Changeset:` next (patch).

## 40. Dead `igrpSafeAwait` would swallow `NEXT_REDIRECT`
- **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/framework-next`
- `lib/safe-await.ts` is defined, never imported/exported. Its `catch → [null, …]` would trap Next navigation signals if adopted. **Fix:** delete it, or export it with `unstable_rethrow(error)` before the tuple conversion. `Changeset:` next (patch).

## 41. `sync-routes` parses structured data with a hand-rolled regex
- **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/framework-next`
- `lib/sync-routes.ts:28-39` uses `/"([^"]+)"\s*:\s*(\{[\s\S]*?});?/g` to detect empty `{}` param objects — breaks on nested objects/comments/trailing commas, runs inside `after()` so a mis-parse silently mis-syncs AM resources. **Fix:** `JSON.parse` (or have the template emit a JSON sidecar) and inspect `Object.keys(...).length === 0`. `Changeset:` next (patch).

## 42. `IGRPGlobalLoading` magic `'IGRP'` string + un-i18n'd loading copy
- **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/framework-next`
- `components/global-loading.tsx:4` branches on the magic `'IGRP'` app code; `Loading {app?.name}...` is English while the framework defaults to pt-PT. **Fix:** extract `const IGRP_SYSTEM_APP_CODE = 'IGRP'`; localize or make the loading copy an overridable pt-PT prop. `Changeset:` next (patch).

## 43. `next-auth` low-risk hardening notes
- **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/framework-next-auth`
- `session.ts:19-21` `hasAccessToken` uses `as any` (use `(s as object)`); `claims.ts` performs no JWS verification — keep the invariant that `claimsAllow` never gates a server-side decision on an unverified token (add a comment/guard); `index.ts` barrel is intentionally partial (confirm-only). **Fix:** the `as any` cleanup + the claims invariant comment; the cookie/barrel items are notes. `Changeset:` next-auth (patch).

## 44. `nav-user` hardcodes `/logout` while siblings are props (item #9 left this)
- **Verdict:** CONFIRMED · **Cluster:** template/dx · **Package:** `@igrp/framework-next-ui`
- `components/templates/nav-user.tsx:152` `<Link href="/logout">`; profile/notifications/settings became basePath-relative props in prior item #9 / commit `3b91dc2e`, but logout was left hardcoded (breaks under basePath). **Fix:** add `logoutUrl?: string` defaulting to `'/logout'`. `Changeset:` next-ui (patch).

## 45. Notifications use locale-default `.toLocaleString()` + assume a live `Date`
- **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/framework-next-ui`
- `components/templates/notifications.tsx:73` renders `notification.timestamp.toLocaleString()` (browser locale, unstable format; RSC `Date`-serialization hazard). **Fix:** memoized `Intl.DateTimeFormat` (pt-PT default, overridable); type `timestamp` as ISO `string | number`, construct `Date` client-side. `Changeset:` next-ui (patch).

## 46. `IGRPSectionPermissions` freezes seeded claims at mount
- **Verdict:** PLAUSIBLE (intentional per JSDoc) · **Cluster:** dx · **Package:** `@igrp/framework-next-ui`
- `permissions/section-permissions.tsx:25` `useState(initialState)` ignores later `initialState` prop changes. JSDoc suggests updates come via `setState` (Phase-2 role switch), so likely intentional. **Fix (if prop should track):** `useEffect(() => setState(initialState), [initialState])`, or rename the prop to `initialState` to signal mount-once. **needs confirmation.** `Changeset:` next-ui (patch).

## 47. Collapsed-sidebar sub-item `onSelect` `preventDefault` may disable keyboard activation
- **Verdict:** PLAUSIBLE · **Cluster:** a11y · **Package:** `@igrp/framework-next-ui`
- `components/templates/menus/sub-leaf-link.tsx:45` `onSelect={(e) => e.preventDefault()}` on a `DropdownMenuItem asChild` wrapping a `Link` — may block Enter-to-activate/close in the collapsed folder dropdown. **Fix:** verify keyboard activation; drop `preventDefault` if the `Link` handles navigation, or close explicitly. **needs confirmation** (manual keyboard test). `Changeset:` next-ui (patch).

## 48. Login carousel + button copy is English amid a pt-PT template
- **Verdict:** CONFIRMED · **Cluster:** template · **Package:** `templates/demo-v1` (no changeset)
- `config/login.ts:17-35` (`carouselItems` titles/descriptions) and `:6` (`loginButton: "Login Now"`) are English while the rest is pt-PT. (Carousel colors/gap were already fixed by prior item #26.) **Fix:** translate to pt-PT (copy-only; already externalized). `Changeset:` none.

## 49. `themes.css` re-declares `body` background as transparent (undocumented)
- **Verdict:** CONFIRMED · **Cluster:** template · **Package:** `templates/demo-v1` (no changeset)
- `styles/themes.css:1-3` `body { @apply … bg-transparent }` (unlayered, imported after `globals.css`'s `@layer base body { bg-background }`); the visible bg comes from `IGRPRootLayout`'s `<body className="bg-background">`. Confusing triple declaration. **Fix:** add a one-line comment that `bg-transparent` is deliberate (framework owns the body bg), or consolidate to one source. `Changeset:` none.

## 50. Document the template's intentional divergence from `igrp-module-architecture`
- **Verdict:** CONFIRMED (doc gap) · **Cluster:** template · **Package:** `templates/demo-v1` (no changeset)
- The template uses `(igrp)/(demo)/<route>/page.tsx` with logic-in-page and `src/actions/igrp/` rather than the skill's `(generated)`→`_features`→`src/actions/simple` layout — defensible for a *framework-consumption* demo. **Fix:** add a note in `templates/demo-v1/CLAUDE.md`/README that `(demo)` pages are wiring demos and real features should follow the module architecture. No code change. `Changeset:` none.

## 51. Migrator UX/robustness nits
- **Verdict:** CONFIRMED · **Cluster:** dx · **Package:** `@igrp/template-migrator`
- (a) Interactive decline of a migration leaves later ones to apply on a missing base — once #11 lands a toposort, treat a decline as "abort the run" or warn (`commands/apply.ts:46-49`). (b) `manifest.template` self-heal isn't persisted on no-op `apply`/`rollback` paths (`commands/apply.ts:26`) — write the lock on no-op paths or drop the in-memory assignment. (c) `deps.bump` undo is unfaithful when a dep is in both `dependencies` and `devDependencies` (`apply.ts:111-119`) — handle/record both buckets or error clearly. **Fix:** as noted; tests for each. `Changeset:` template-migrator (patch).

## 52. Migrator build/version bookkeeping
- **Verdict:** CONFIRMED · **Cluster:** release/dx · **Package:** `@igrp/template-migrator`
- (a) `tsconfig.build.json` excludes `src/**/__tests__/**` but not `src/**/*.test.ts` (which `vitest.config.ts` picks up) — align the exclude so a stray test file can't be type-emitted to `dist`. (b) The migrator's published version line should be reconciled/decided (independent vs framework `0.1.0-beta.*`); going forward, `patch`-only changesets keep it on its line. **needs confirmation** of the intended baseline. **Fix:** align the `tsc` exclude; record the version-line decision. `Changeset:` template-migrator (patch) if the tsconfig ships.

---

## Candidates dropped (considered, not specced)

- **H2 — `revalidateMenusAction`/`revalidateAppsAction` no-op** (`next/actions/index.ts:60-66`): already a documented deferred follow-up (P2-medium plan, ~line 948). If you want the dead tags removed, fold into that existing follow-up rather than re-filing.
- **M1 — redirect callback `${baseUrl}${safe}` concat** (`next-auth/config.ts:668`): this concat is the **intended** design of prior item #1 (`safe` is pre-sanitized and starts with `/`; `baseUrl` is re-prefixed to avoid basePath duplication). The open-redirect is closed. Only worth a cosmetic `new URL()` hardening — out of scope.
- **Carousel colors / `flex gap`** (`next-ui` auth carousel): already fixed by prior item #26 / commit `689b5ac4`. Only the unrelated login-page English copy remains (item 48).

## Net-new counts

| Band | Items |
|---|---|
| P0 Critical | 2 |
| P1 High | 10 (incl. 1 doc-only, 1 `extends #18`; #7 withdrawn) |
| P2 Medium | 17 (incl. 2 `extends #15`/`#19`) |
| P3 Low | 22 |
| **Total** | **51** (item 7 withdrawn) |

Cluster distribution (net-new, primary tag): **dx** ×19, **template** ×9, **a11y** ×8, **types** ×4, **tokens** ×4, **errors** ×3, **release** ×2, **perf** ×1, **docs** ×1 (item 7 withdrawn).

## Next step

Per the superpowers workflow this spec feeds **R2 band plans** (`docs/superpowers/plans/2026-06-29-r2-p0-critical.md`, `…-p1-high.md`, `…-p2-medium.md`, `…-p3-low.md`), each turning its band's items into TDD steps + full code. Schedule top-down: P0 → P1 → P2 → P3; do not open a band until the one above is merged + (for publishable packages) changesets staged.
