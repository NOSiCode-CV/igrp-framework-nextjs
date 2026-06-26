# Monorepo Deep-Review Remediation — Design Spec

**Date:** 2026-06-26
**Scope:** repo-wide (`next-auth`, `next-types`, `design-system`, `next-ui`, `next`, `template-migrator`, `templates/demo-v1`)
**Approach:** Surgical fixes only — no architecture rewrites. Each item is an independent change with its own `patch` changeset (publishable packages) and acceptance criteria.
**Source:** multi-agent deep review of 2026-06-26 (7 package finders → adversarial verify → cross-cutting synthesis). 42 candidates → 31 survived (CONFIRMED/PLAUSIBLE), consolidated here into 26 work items.

---

## How to read this spec

- Items are numbered **1 → 26, highest severity first**. Fix top-down; do not start a lower band until the band above is merged.
- **Verdict** is from adversarial verification: **CONFIRMED** = trigger + wrong output proven in current code; **PLAUSIBLE** = mechanism real but trigger depends on something not observable in-repo (backend behavior, future input, non-conforming IdP) — each PLAUSIBLE item names the decision that turns it into a fix or a no-op.
- Each item lists **exact files**, the **problem**, the **impact**, the **fix direction**, **acceptance criteria**, and the **changeset** package. This is a spec, not a step-by-step plan — implementation detail (TDD steps, full code) is produced per-package when the work is scheduled.

## Global constraints (apply to every item)

Copied verbatim from `.claude/shared/hard-rules.md` and `dependency-order.md` — every task's requirements implicitly include these:

- **pnpm only**, `engines.node >= 22`. Internal deps use `workspace:*`.
- **Never edit `dist/`.** Source is always under `src/`. Never import package internals (`@igrp/*/dist/...`) — use documented subpath exports.
- **One `patch` changeset per user-visible change** to a publishable package (`pnpm changeset`). **Never `major`/`minor`** — repo is in pre-release `beta` mode; `patch` increments the beta counter only.
- **Build in dependency order:** `next-auth → next-types → design-system → next-ui → next`. After any public-API change to a framework package, run `pnpm build:framework` before consuming downstream.
- **Lint is package-specific:** framework packages = ESLint + Prettier; `templates/demo-v1` = Biome. Do not cross-apply.
- **No publish without explicit per-task authorization.** This spec stages code + changesets only; versioning/publishing is a separate, authorized step using each package's `release` script (never `changeset publish`).

## Cross-package sequencing note

Items **1 and 2 share a fix** and must land together: harden the sanitizer in `next-auth` (item 1), then make the `next` hooks consume it (item 2). Because `next` depends on `next-auth`, rebuild `next-auth` before `next`. Items touching only one package have no cross-package ordering.

---

# Band P1 — High (security floor / data-integrity)

> Theme: the redirect/`callbackUrl` sanitization every consumer needs is correct in the **template** but weaker or absent in the **framework packages that ship to all consumers**. Items 1–2 move the security floor down to where it belongs.

## 1. Harden `next-auth` redirect sanitization (backslash open-redirect + query `..` + de-duplicate)

- **Severity:** High · **Verdict:** CONFIRMED · **Package:** `@igrp/framework-next-auth`
- **Files:**
  - `packages/framework/next-auth/src/sanitize.ts:32` (relative-path guard), `:33-35` (`..` scan)
  - `packages/framework/next-auth/src/config.ts:644-671` (redirect callback — inline reimplementation), `:661` (the backslash-vulnerable branch)
- **Problem:** Both the exported `sanitizeRedirectUrl` and the NextAuth `redirect` callback use `url.startsWith('/') && !url.startsWith('//')`. A `callbackUrl` of `/\evil.com` passes (char[1] is `\`, not `/`); browsers normalize leading `/\` to `//`, yielding a protocol-relative off-origin redirect after sign-in. Two secondary facets in the same code: (a) the `..` traversal check at `sanitize.ts:33` scans only the pre-`?` segment yet returns the full URL including a `..`-bearing query; (b) `config.ts:644` hand-rolls the same-origin/relative logic that the already-imported `sanitizeRedirectUrl` provides (`config.ts:44` imports it but uses it only for the `home` fallback at `:654`).
- **Impact:** Open redirect from the framework's own auth layer. The template (`templates/demo-v1/src/lib/utils.ts:68`) already rejects backslashes and re-checks after `decodeURIComponent` — so any consumer wiring its own login flow on the framework primitives inherits a hole the template proved is real.
- **Fix:**
  - In `sanitizeRedirectUrl`: reject when the value contains a backslash (check the raw input **and** a `decodeURIComponent`-normalized pass, to also catch `/%5Cevil.com`); scan the **whole** trimmed string for `..`, not just the path segment.
  - In the `config.ts` redirect callback: delete the inline relative/absolute branches (`:657-671`) and delegate to the hardened `sanitizeRedirectUrl(url, baseUrl, fallback)`. Confirm the returned value's query/hash handling matches the previous same-origin behavior before swapping (the helper drops query/hash via `pathname + search`; verify that is acceptable, otherwise widen the helper).
- **Acceptance:** unit tests in `config.test.ts` / a new `sanitize.test.ts` covering `/\evil.com`, `/%5Cevil.com`, `//evil.com`, `/safe?next=../../admin`, and a legit `/dashboard?tab=1` all return same-origin/relative or the fallback. `pnpm build:auth` green.
- **Changeset:** `@igrp/framework-next-auth` (patch).

## 2. Sanitize `x-current-path` before reflecting into the `/login?callbackUrl=` redirect (framework hooks)

- **Severity:** High · **Verdict:** CONFIRMED · **Package:** `@igrp/framework-next`
- **Files:**
  - `packages/framework/next/src/hooks/use-menus.ts:54-55`
  - `packages/framework/next/src/hooks/use-applications.ts:69-70` and `:88-89`
  - `packages/framework/next/src/hooks/use-user.ts:35-36`
- **Problem:** All three hooks read the client-controlled `x-current-path` header and build `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` with **no** same-origin/relative validation. `encodeURIComponent` round-trips on decode, so an absolute or scheme-relative target survives. The template routes the identical header through `sanitizeCallbackUrl` first (`templates/demo-v1/src/lib/dal.ts:28`), and `demo-v1/CLAUDE.md` states the rule: *"Any new code that consumes `callbackUrl` must go through this helper."* The framework hooks violate it.
- **Impact:** Defense-in-depth open-redirect gap shipped to every consumer (mitigated only if the consumer's login page re-sanitizes — the demo's does, so end-to-end exploit is blocked there; a naive consumer login is exposed).
- **Fix:** Route the header value through the hardened `sanitizeRedirectUrl` from item 1 (already a dependency) before composing the redirect, in all three hooks. Falsy/invalid → bare `/login`.
- **Acceptance:** the three hooks call the sanitizer; a test feeds `x-current-path: https://evil.com` and asserts the redirect is `/login` (no `callbackUrl`) or a same-origin path only. Requires item 1 merged + `next-auth` rebuilt first. `pnpm build:next` green.
- **Changeset:** `@igrp/framework-next` (patch).

## 3. `template-migrator`: partial application is irreversible

- **Severity:** High · **Verdict:** CONFIRMED · **Package:** `@igrp/template-migrator`
- **Files:** `packages/template-migrator/src/commands/apply.ts` (step loop, catch at `:77-80`, lock write at `:90-93`, undo-baseline capture at `:64-71`); `packages/template-migrator/src/apply.ts` (`executeStep` mutates disk per step — `copyFileSync`/`writeFileSync`/`rmSync`)
- **Problem:** `executeStep` mutates disk immediately per step, but the lock entry (including `undoPayloads`) is persisted only **after** the full loop. A mid-loop failure on step B leaves step A's file overwritten with **no lock entry and no unwind**. The catch only logs *"Run again to resume"* and returns. A re-run restarts the migration from step 0 and re-captures A's "pre-migration original" from the now-modified disk — so the persisted undo baseline is the *migrated* content, and a later rollback restores A to the wrong state, silently (the rollback refusal gate sees a present payload and does not warn).
- **Impact:** Partial application corrupts the undo baseline → rollback is silently wrong → irreversible consumer-app state. No git snapshot or pre-apply backup exists to mitigate.
- **Fix (pick one, decide at implementation):** (a) capture **all** `undoPayloads` for the migration's steps up front, before any mutation, and persist the lock entry transactionally; **or** (b) on catch, unwind the steps already executed this run (restore from the in-memory `undoSteps`) before returning. Either way: never re-capture a baseline from disk that a prior aborted run may have modified — detect an in-progress/aborted migration and refuse to silently re-baseline.
- **Acceptance:** new test in `src/__tests__/apply-command.test.ts`: a 2-step migration whose 2nd step throws leaves the app either fully unwound (option b) or with a correct undo baseline that rolls back to the true original (option a); a subsequent rollback restores byte-identical original content. `pnpm --filter @igrp/template-migrator test` green.
- **Changeset:** `@igrp/template-migrator` (patch).

---

# Band P2 — Medium

## 4. Access token embedded in `unstable_cache` key (two sibling hooks)

- **Severity:** Medium · **Verdict:** CONFIRMED · **Package:** `@igrp/framework-next`
- **Files:** `packages/framework/next/src/hooks/use-menus.ts:38` (and call at `:50`); `packages/framework/next/src/hooks/use-applications.ts:31`, `:53`, calls at `:65`/`:84`
- **Problem:** `unstable_cache` serializes function args into the cache key. Both hooks pass `token` as an argument to the cached fn, so the bearer token lands in the cross-request key. The sibling `use-user.ts:9-17` documents this exact bug and the fix it already adopted (React `cache()` + read token from `igrpGetAccessClientConfig()` inside the fn) — the other two were never updated.
- **Impact:** After a token refresh, the stale per-token entry is background-revalidated with the **expired** token → 401s in logs; per-user/per-token key divergence drives the cross-request cache hit-rate toward zero.
- **Fix:** Mirror `use-user.ts` — keep `token` out of the cached fn's arguments; read it from `igrpGetAccessClientConfig()` inside. Preserve the `igrp-menus-${appCode}` / `igrp-app-${appCode}` revalidation tags (the stated reason `unstable_cache` was kept).
- **Acceptance:** neither hook passes `token` into the cached fn's args (grep); revalidation tags unchanged; `pnpm build:next` green.
- **Changeset:** `@igrp/framework-next` (patch). *(Combine with items 2 and 5 into one `next` changeset if landed together.)*

## 5. Data hooks swallow non-401/403 errors and render an empty layout

- **Severity:** Medium · **Verdict:** CONFIRMED · **Package:** `@igrp/framework-next`
- **Files:** `packages/framework/next/src/hooks/use-menus.ts:52-58`; `use-applications.ts:67-73`, `:86-92`; `use-user.ts:33-39`. Consumer: `packages/framework/next-ui/src/...` sidebar-data-provider (awaits `fetchMenus` in `Promise.all`).
- **Problem:** All three share `if (error instanceof ApiClientError && (status===401||403)) redirect(...)` then unconditionally `logger.error(...); return []` (or `null`). A 10s `AbortSignal` timeout, network failure, or AM 5xx returns an empty **success** value.
- **Impact:** A transient backend outage renders an empty menu/app list with no error boundary — indistinguishable from a user who legitimately has zero permissions. (Note: `unstable_cache` does **not** cache thrown errors, so the empty result is not persisted — it's a per-request mis-render, retried next request.)
- **Fix:** Adopt one consistent policy across all three: on non-auth failures (timeout/network/5xx), **throw** (or return a typed error result) so the layout's error boundary engages; reserve empty `[]`/`null` for a genuine empty success. Apply identically to all three to avoid re-introducing the divergence.
- **Acceptance:** a simulated 500 / timeout from one hook propagates to an error state rather than an empty render; 401/403 still redirects to `/login`; genuine-empty still renders empty. `pnpm build:next` green.
- **Changeset:** `@igrp/framework-next` (patch).

## 6. `patch`-mode `file.write` crashes the migrator

- **Severity:** Medium · **Verdict:** CONFIRMED · **Package:** `@igrp/template-migrator`
- **Files:** `packages/template-migrator/src/apply.ts:22-26` (`step.from!.startsWith('payload/')`); `src/types.ts:9` (declares `mode: 'replace' | 'patch'`, `from?`); `scripts/check-drift.ts` (~`:104-109` tolerates a `from`-less `file.write` as patch)
- **Problem:** `executeStep` unconditionally dereferences `step.from!` for `file.write`, but a `mode: 'patch'` step has no `from` (it carries `patch?`). The type union **and** the release-time drift gate both permit patch-mode migrations, yet authoring one throws `TypeError: Cannot read properties of undefined (reading 'startsWith')`, aborting the whole apply. No code path consumes `patch`.
- **Impact:** A migration variant the type system and drift gate advertise as valid is a guaranteed runtime crash.
- **Fix (decide):** either (a) implement patch mode (apply `step.patch`), or (b) if patch mode is not yet supported, make that explicit — guard `from` and throw a clear "patch mode not implemented" error, and tighten `types.ts` / `check-drift.ts` so the gate rejects what apply can't execute. Do not leave a `!` assertion that lies.
- **Acceptance:** a `file.write` step with `mode:'patch'` and no `from` either applies the patch (option a) or fails with a clear, tested error (option b) — never a raw `TypeError`. Test in `src/__tests__/apply.test.ts`. `pnpm --filter @igrp/template-migrator test` green.
- **Changeset:** `@igrp/template-migrator` (patch).

## 7. DataTable "Clear filters" button never appears (frozen `isFiltered`)

- **Severity:** Medium · **Verdict:** CONFIRMED · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/data-table/hooks/use-filter-state.ts:10`; consumer `.../filters/client-filter.tsx:55`
- **Problem:** `const isFiltered = useMemo(() => table.getState().columnFilters.length > 0, [table])`. The TanStack `table` instance is a stable reference (the file carries `"use no memo"`, so the React Compiler does not rewrite the memo), so the memo never recomputes. `isFiltered` is pinned to its mount value (`false`).
- **Impact:** After the user applies a column filter, `{isFiltered && (...)}` keeps the Clear-filters button hidden — it never renders.
- **Fix:** Derive `isFiltered` from `table.getState().columnFilters.length` **without** `useMemo` (the value is already cheap and read each render), or key the memo on the filter-state value rather than `[table]`.
- **Acceptance:** Storybook interaction (`packages/design-system-storybook`) — applying a filter shows the Clear button; clearing hides it. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 8. `IGRPCombobox` uncontrolled mode is dead (`value = ""` default)

- **Severity:** Medium · **Verdict:** CONFIRMED · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/input/combobox.tsx:225` (default `value = ""`), `:253` (`displayValue = value !== undefined ? value : localValue`), `:425` (unreachable `if (value === undefined)`)
- **Problem:** Defaulting `value` to `""` means it is never `undefined`, so the controlled/uncontrolled ternary always picks `value`; `localValue` state and the `value === undefined` write are dead code.
- **Impact:** A standalone `<IGRPCombobox options={...} />` (no `value`, no form context) never reflects its selection — clicking an option fires `onChange` but the trigger stays on the placeholder. (Form-context and explicitly-controlled modes are unaffected.)
- **Fix:** Default `value` to `undefined` (not `""`) so the uncontrolled path drives `localValue`.
- **Acceptance:** Storybook story for standalone uncontrolled combobox shows the selected label after a click. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 9. `next-ui` chrome builds `next/link` hrefs from `window.location.origin`

- **Severity:** Medium · **Verdict:** CONFIRMED · **Package:** `@igrp/framework-next-ui`
- **Files:** `packages/framework/next-ui/src/components/templates/nav-user.tsx:51-64`; `.../templates/notifications.tsx:35-36`; helper `.../utils.ts` (`getLocationOriginURL`)
- **Problem:** `getLocationOriginURL()` returns `''` on the server and `window.location.origin` on the client; the result is concatenated (`${origin}/profile`) and passed straight into `next/link`. Reached **by default** — `sidebar.tsx` renders `IGRPTemplateNavUser` with no url props, and the template wires `process.env.NEXT_PUBLIC_*_URL || ''` whose empty-string fallback re-triggers the origin path.
- **Impact:** (a) SSR renders `/profile`, CSR renders `https://host/profile` → hydration mismatch; (b) `next/link` treats the absolute URL as external → hard document reload instead of client routing; (c) `origin` omits `NEXT_PUBLIC_BASE_PATH` → 404 under subpath deployments.
- **Fix:** Emit **basePath-relative** paths (`/profile`, `/notifications`, `/settings`) and stop using `window.location.origin` inside `next/link`. If an absolute external URL is genuinely needed, render a plain `<a>` not `next/link`. Fix both components (same root cause).
- **Acceptance:** rendered href is relative; no hydration warning; client-side navigation (no full reload); works under a `NEXT_PUBLIC_BASE_PATH`. `pnpm build:next-ui` green.
- **Changeset:** `@igrp/framework-next-ui` (patch).

## 10. `IGRPMenuItemArgs.id` declared required but the AM DTO is optional

- **Severity:** Medium · **Verdict:** PLAUSIBLE · **Package:** `@igrp/framework-next-types` (+ `next`, `next-ui`)
- **Files:** `packages/framework/next-types/src/types/access-management.ts:38` (`id: number`); `packages/framework/next/src/mappers/menus-mapper.ts:10` (`id: menu.id as number`); `next-ui` key sites `.../section-group.tsx:29/31`, `.../folder-menu-item.tsx:51/89` (unguarded) vs `.../search-results.tsx:120` (guarded `id != null`)
- **Problem:** Type says `id: number`; the runtime source `MenuEntryDTO.id` is `id?: number`. The optionality is erased by an unsafe `as number` cast in the mapper, so downstream consumers see an always-present `id` that can be `undefined` at runtime; some key sites guard, some don't.
- **Impact (if triggered):** an id-less menu entry collides on `folder-undefined`/`leaf-undefined` React keys with no compile-time warning.
- **Decision that confirms/voids:** does the AM **read** path (`getCurrentUserApplicationMenus`) ever return an entry without `id`? If yes → fix; if `id` is a server-assigned unique key always present on read → the cast is benign and this becomes "remove the lie" cleanup only.
- **Fix:** make `IGRPMenuItemArgs.id` optional (`id?: number`) to match the DTO, remove the `as number` cast, and add `id != null` guards (or a stable fallback key) at the unguarded `next-ui` sites.
- **Acceptance:** no `as number` cast on `menu.id`; all menu key sites handle missing `id`; `pnpm build:next-types && pnpm build:framework` green.
- **Changeset:** `@igrp/framework-next-types` + `@igrp/framework-next` + `@igrp/framework-next-ui` (patch each; coordinate — type change cascades downstream).

## 11. `demo-v1` session-refetch gated on `isPreviewMode()` instead of `isAuthBypass()`

- **Severity:** Medium · **Verdict:** CONFIRMED (conventions) · **Package:** `@igrp/framework-next-template` (template — no registry publish)
- **Files:** `templates/demo-v1/src/lib/config/get-session-args.ts:1` (import), `:19` (the branch)
- **Problem:** The disable-refetch branch checks `isPreviewMode()` alone. Under `AUTH_PROVIDER=none` with `IGRP_PREVIEW_MODE` unset, `isPreviewMode()` is false but `isAuthBypass()` is true, so the function falls through to `refetchInterval=600` + `refetchOnWindowFocus=true`.
- **Impact:** Under that bypass mode, `SessionProvider` polls `/api/auth/session` every 10 min and on focus, even though middleware redirects `/api/auth/*` to `/`. Violates `preview-mode.md` ("bypass disables session refetch") and `demo-v1/CLAUDE.md` ("every auth-aware code path must use `isAuthBypass()`"). The sibling `igrp.template.config.ts` already uses `isAuthBypass()` correctly — this file is the lone outlier.
- **Fix:** `import { isAuthBypass } from "../utils"` and gate line 19 on `isAuthBypass()`.
- **Acceptance:** with `AUTH_PROVIDER=none` (no `IGRP_PREVIEW_MODE`), refetch is disabled (`refetchInterval=0`). Verify template builds with bypass on and off. Biome format. Ship as a **template-migrator migration** (per `project_template_migration_rule`) so consumer apps get the fix.
- **Changeset:** none for the template itself; **add a `template-migrator` migration** + its `patch` changeset.

---

# Band P3 — Low (correctness nits, cleanup, latent risks)

## 12. DataTable date-range filter silently drops rows on unparseable dates

- **Severity:** Low · **Verdict:** CONFIRMED · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/data-table/lib/filters-utils.ts:14-25` (`new Date(cellValue)`, comparisons at `:22`/`:24`)
- **Problem:** No `isNaN(date.getTime())` guard. An unparseable cell string (e.g. `dd/mm/yyyy`) yields `Invalid Date`; `>=`/`<=` against it are both false, so the row is filtered out.
- **Impact:** Applying a date-range filter to a column of locale-formatted date strings makes every row vanish, no error.
- **Fix:** add a validity guard and decide explicit include/exclude semantics for invalid cell values (recommend: treat invalid as non-matching-but-surface, or document parse expectations).
- **Acceptance:** Storybook/test — range filter over `Invalid Date` cells does not silently empty the table. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch).

## 13. `formatChartValue` does not abbreviate negative magnitudes

- **Severity:** Low · **Verdict:** CONFIRMED · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/charts/lib.ts:14-19`
- **Problem:** Guards are `value >= 1000000` / `value >= 1000`; negatives fall through. `formatChartValue(-2500000)` → `"-2500000"` while `+2500000` → `"2.5M"`. Negatives are a supported case (`hasNegativeValues` exists in the same file).
- **Impact:** Inconsistent axis/label formatting on charts with negative series.
- **Fix:** branch on `Math.abs(value)` and re-apply the sign.
- **Acceptance:** unit test `formatChartValue(-2500000) === "-2.5M"`. `pnpm build:ds` green.
- **Changeset:** `@igrp/igrp-framework-react-design-system` (patch). *(Combine with 12 and 14 — same package.)*

## 14. `getChartHeight`/`getChartWidth` identical-branch dead ternaries

- **Severity:** Low · **Verdict:** CONFIRMED (cleanup) · **Package:** `@igrp/igrp-framework-react-design-system`
- **Files:** `packages/design-system/src/components/horizon/charts/lib.ts:27`, `:39`
- **Problem:** `if (height) return typeof height === "number" ? height : height` — both ternary branches return the same expression; the `typeof` check is dead. Also `if (height)` treats `0` as falsy.
- **Impact:** Pure cleanup (no behavior bug); minor readability/foot-gun.
- **Fix:** replace with `if (height != null) return height` (and same for width).
- **Acceptance:** simplified; `pnpm build:ds` green.
- **Changeset:** folded into the item-13 design-system changeset.

## 15. `template-migrator` `env.add`: naive idempotency + no-op undo + no `env.remove`

- **Severity:** Low · **Verdict:** CONFIRMED · **Package:** `@igrp/template-migrator`
- **Files:** `packages/template-migrator/src/apply.ts:43-44` (substring idempotency), `:39`/`:54` (undo step re-runs `env.add`); `src/types.ts:7-12` (no `env.remove` in the union); `src/commands/rollback.ts:84` (re-executes the step)
- **Problem:** (a) `existing.includes(\`${key}=\`)` is an unanchored substring test over the whole `.env` — a commented `# AUTH_PROVIDER=` or a different key `NEXT_AUTH_PROVIDER=` falsely suppresses the real add. (b) The `env.add` undo step is itself an `env.add`; on rollback it hits the idempotency guard and removes nothing — added keys persist after rollback. (c) There is no `env.remove` variant at all.
- **Impact:** silent env no-op (app runs without a var the migration meant to add); rollback leaves env keys behind, contradicting the rollback contract.
- **Fix:** line-anchored per-line match (`^\s*KEY=`); add an `env.remove` step type and make `env.add`'s undo actually remove the keys it added.
- **Acceptance:** tests in `src/__tests__/` — commented/prefixed key does not suppress the add; rollback of an `env.add` removes exactly the added keys. `pnpm --filter @igrp/template-migrator test` green.
- **Changeset:** `@igrp/template-migrator` (patch). *(Combine with items 3, 6, 16 — same package.)*

## 16. `template-migrator` no path-containment guard before write/recursive-delete

- **Severity:** Low · **Verdict:** CONFIRMED (defense-in-depth; input is trusted/maintainer-authored) · **Package:** `@igrp/template-migrator`
- **Files:** `packages/template-migrator/src/apply.ts:23` (`join(appRoot, step.path)`), `:35-36` (`rmSync(target, { recursive: true, force: true })`)
- **Problem:** No check that the resolved path stays within `appRoot`. A migration `path: "../../something"` would write/recursively-force-delete outside the consumer app. `step.path` comes from maintainer-authored manifests, so this is robustness, not an exploit.
- **Impact:** a maintainer typo (`..`, empty path) silently clobbers files outside the target app, amplified by recursive force-delete.
- **Fix:** add `if (!resolve(dest).startsWith(resolve(appRoot) + sep)) throw` guard in `executeStep` for create/write/delete.
- **Acceptance:** test — a `..`-escaping path is rejected before any fs mutation. `pnpm --filter @igrp/template-migrator test` green.
- **Changeset:** `@igrp/template-migrator` (patch).

## 17. `template-migrator` migration ordering relies on lexicographic filename sort

- **Severity:** Low · **Verdict:** PLAUSIBLE (latent — no triggering filename exists today) · **Package:** `@igrp/template-migrator`
- **Files:** `packages/template-migrator/scripts/pack.ts:61-63` (`.sort()`); `scripts/check-drift.ts:78-80` (same order)
- **Problem:** Order comes from a lexicographic string `.sort()` on filenames matching `/^\d+\.MIGRATIONS.*\.md$/` — the regex accepts any digit count. Today all 20 files are 2-digit zero-padded so order == numeric; the first unpadded (`9.MIGRATIONS`) or 3-digit (`100.MIGRATIONS`) file reorders the manifest, applying migrations out of authored sequence with no error. The drift gate sorts the same wrong way, so it won't catch it.
- **Decision that confirms/voids:** will migration count ever exceed 99, or could an unpadded prefix be committed? If the team commits to strict 2-digit (then 3-digit) zero-padding by lint, this stays latent.
- **Fix:** sort by a numeric prefix comparator (parse the leading integer), or enforce zero-padding via a CI/lint check in `pack.ts`.
- **Acceptance:** test — `['9.MIGRATIONS...','10.MIGRATIONS...','100.MIGRATIONS...']` orders 9 < 10 < 100. `pnpm --filter @igrp/template-migrator test` green.
- **Changeset:** `@igrp/template-migrator` (patch).

## 18. `template-migrator` `requires` prerequisites are packed but never enforced

- **Severity:** Low · **Verdict:** PLAUSIBLE (not reachable via the CLI today — chain is strictly linear) · **Package:** `@igrp/template-migrator`
- **Files:** `packages/template-migrator/src/commands/apply.ts:28-32` (computes `pending`, `--to` slice); `src/types.ts:17` + `scripts/pack.ts:74` (`requires`)
- **Problem:** Each migration's `requires: string[]` is packed into the manifest but never read at apply time; `--to` applies the contiguous prefix in filename order. Works today only because `requires` is a strict linear chain (each requires its immediate predecessor) and the CLI can't produce an out-of-order applied set.
- **Decision that confirms/voids:** will there ever be a non-linear `requires` graph (a migration depending on a non-adjacent ancestor)? If migrations stay strictly linear, enforcement is optional hardening.
- **Fix:** before applying each migration, assert its `requires` are all in the applied set; refuse otherwise with a clear message.
- **Acceptance:** test — `apply --to X` where X requires an unapplied non-adjacent migration is refused. `pnpm --filter @igrp/template-migrator test` green.
- **Changeset:** `@igrp/template-migrator` (patch).

## 19. `demo-v1` `getLayoutConfig = cache(configLayout)` is dead code

- **Severity:** Low · **Verdict:** CONFIRMED · **Package:** template
- **Files:** `templates/demo-v1/src/lib/dal.ts:43` (defined, zero importers); callers `templates/demo-v1/src/app/layout.tsx:27` and `src/app/(igrp)/layout.tsx:20` both call raw `configLayout()`
- **Problem:** The per-request-dedupe `cache()` wrapper is never imported; both layouts call the un-cached action, so `serverSession()` (NextAuth JWT decode + cookie read) runs twice per navigation. The wrapper's own doc comment promises the opposite.
- **Impact:** duplicated auth+cookie work per navigation; misleading dead code.
- **Fix:** use `getLayoutConfig` in both layouts, **or** delete it. (Recommend: use it — it's the documented intent.)
- **Acceptance:** `configLayout` runs once per request; template builds bypass on/off. Ship as a **template-migrator migration**.
- **Changeset:** `template-migrator` migration + its `patch` changeset.

## 20. `demo-v1` `getRoutes()` does a sync `readFileSync` + regex per layout render

- **Severity:** Low · **Verdict:** CONFIRMED · **Package:** template
- **Files:** `templates/demo-v1/src/lib/config/get-routes.ts:7` (`fs.readFileSync`), `:9-11`/`:22` (regex); called from `src/igrp.template.config.ts:23` → both layouts per request
- **Problem:** A build-time-stable file (`.next/types/routes.d.ts`) is read synchronously and regex-parsed on every layout render, on the server request hot path.
- **Impact:** blocking disk I/O + parsing per navigation.
- **Fix:** memoize once — module-level cache or React `cache()`.
- **Acceptance:** file read at most once per process/request; template builds. Ship as a **template-migrator migration**.
- **Changeset:** `template-migrator` migration + its `patch` changeset.

## 21. `next-auth` `NEXTAUTH_URL_INTERNAL` home built by raw string concat

- **Severity:** Low · **Verdict:** CONFIRMED (env-only, not attacker-controlled) · **Package:** `@igrp/framework-next-auth`
- **Files:** `packages/framework/next-auth/src/config.ts:652-654`
- **Problem:** `home = \`${nextInternalUrl}${igrpAppHomeSlug}\`` with no separator handling and no `sanitizeRedirectUrl`. A missing leading slash on the slug or trailing slash on the URL yields `https://hostapps/x` or a double slash. The sanitized branch is taken only when `nextInternalUrl` is empty.
- **Impact:** misconfigured operator env silently breaks the post-login landing URL. The `config.test.ts:327-328` cases only cover `slug='/'`, so this is uncovered.
- **Fix:** normalize the join (single slash) and/or route through `sanitizeRedirectUrl`.
- **Acceptance:** test — URL with trailing slash + slug without leading slash (and vice-versa) yields a single-slash URL. `pnpm build:auth` green.
- **Changeset:** `@igrp/framework-next-auth` (patch). *(Combine with item 1 + 22 — same package.)*

## 22. `next-auth` refresh `expires_in` trusted without numeric validation

- **Severity:** Low · **Verdict:** PLAUSIBLE (needs a non-conforming IdP) · **Package:** `@igrp/framework-next-auth`
- **Files:** `packages/framework/next-auth/src/oidc.ts:340`
- **Problem:** `expiresAt: Date.now() + (refreshedToken.expires_in ?? 3600) * 1000`. `??` only catches null/undefined; a present non-numeric value yields `NaN`. `NaN` survives both consumer guards (`typeof NaN === 'number'`; `NaN <= x` is false), so the token is treated as never-proactively-expiring (an eventual 401 still recovers it).
- **Decision that confirms/voids:** can the configured IdP (Spring Authorization Server) emit a present, non-numeric `expires_in`? RFC 6749 says it's a number, so conformant IdPs are safe.
- **Fix:** coerce with `Number(...)` and fall back to `3600` when not `Number.isFinite`.
- **Acceptance:** test — `expires_in: "abc"` (and object) produces a finite `expiresAt`. `pnpm build:auth` green.
- **Changeset:** `@igrp/framework-next-auth` (patch).

## 23. `next` `igrpGetAccessClient` validates `baseUrl` but not `token`

- **Severity:** Low · **Verdict:** PLAUSIBLE · **Package:** `@igrp/framework-next`
- **Files:** `packages/framework/next/src/lib/api-client.ts:6` (guard), `:14` (`Authorization: Bearer ${token}`)
- **Problem:** Only `baseUrl` is guarded; with `baseUrl` set and `token=''`, the client sends `Authorization: Bearer ` (empty). A reachable trigger: `igrp-layout-full.tsx:35-39` sets `token: session?.accessToken || ''` whenever `apiManagementConfig?.baseUrl` is truthy — a session without `accessToken` passes the guard.
- **Decision that confirms/voids:** can a session reach `IGRPLayoutFull` with a truthy `apiManagementConfig.baseUrl` but no/empty `accessToken`? Depends on auth/session config.
- **Impact:** a confusing 401 ("Bearer ") instead of a clear "client not configured" error.
- **Fix:** validate `token` alongside `baseUrl` and throw the clear not-configured error when empty.
- **Acceptance:** test — empty token + set baseUrl throws the configured "not configured" error, not a 401. `pnpm build:next` green.
- **Changeset:** `@igrp/framework-next` (patch).

## 24. `next` `fetchAppByCode` takes `getApplications({code})[0]` (assumes exact + ordered)

- **Severity:** Low · **Verdict:** PLAUSIBLE · **Package:** `@igrp/framework-next`
- **Files:** `packages/framework/next/src/hooks/use-applications.ts:26-27`
- **Problem:** Uses the list endpoint `getApplications({ code })` then blindly takes `[0]`, with no assertion the returned record's `code` equals the request. A dedicated exact endpoint `getApplicationByCode` exists and is unused.
- **Decision that confirms/voids:** does the AM backend treat `?code=` as exact-unique, or as prefix/contains with unspecified order? If exact-unique, `[0]` is correct.
- **Impact (if prefix/multi-match):** wrong application's data rendered for the app context.
- **Fix:** call `getApplicationByCode(appCode)` (exact), or post-filter `find(a => a.code === appCode)`.
- **Acceptance:** by-code lookup returns only the exact match. `pnpm build:next` green.
- **Changeset:** `@igrp/framework-next` (patch).

## 25. `next-ui` `ActiveThemeProvider` context value is a fresh object each render

- **Severity:** Low · **Verdict:** PLAUSIBLE (low value — provider sits at root, only its own state changes) · **Package:** `@igrp/framework-next-ui`
- **Files:** `packages/framework/next-ui/src/components/providers/active-theme.tsx:45`
- **Problem:** `value={{ activeTheme, setActiveTheme }}` is a new object literal per render (the React Compiler skips this file — `babel.config.cjs` `skipPatterns` includes `provider`/`context`). Unmemoized context value.
- **Impact:** consumer re-renders only when the root provider tree re-renders for unrelated reasons — infrequent at this depth, unproven. Micro-optimization, no correctness bug.
- **Fix:** wrap in `useMemo` keyed on `activeTheme` (cheap, harmless).
- **Acceptance:** value is memoized; `pnpm build:next-ui` green.
- **Changeset:** `@igrp/framework-next-ui` (patch). *(Optional — lowest priority; fold into item 9's `next-ui` changeset if done.)*

## 26. `next-ui` auth carousel uses raw Tailwind colors instead of semantic tokens

- **Severity:** Low · **Verdict:** CONFIRMED (conventions) · **Package:** `@igrp/framework-next-ui`
- **Files:** `packages/framework/next-ui/src/components/auths/carousel.tsx:46` (`bg-slate-900`), `:65` (`bg-black/40`), `:67` (`text-white`), `:69` (`text-slate-200`), `:78-79` (`bg-white/50`, `bg-white`); also `:71` `space-x-2`
- **Problem:** Violates `ui-rules.md`: *"Only semantic tokens (`bg-background`, `text-foreground`…). Never raw Tailwind colors."* and *"`flex gap-*` for spacing, not `space-x-*`."*
- **Impact:** carousel ignores theme tokens + dark-mode cascade; breaks integrator theme overrides; inconsistent chrome.
- **Fix:** map raw palette classes to semantic tokens; replace `space-x-2` with `flex gap-2`.
- **Acceptance:** no raw color classes in the file (grep); Storybook visual check across themes/dark. `pnpm build:next-ui` green.
- **Changeset:** `@igrp/framework-next-ui` (patch).

---

## Changeset / build summary

| Package | Items | Changeset(s) |
| --- | --- | --- |
| `@igrp/framework-next-auth` | 1, 21, 22 | 1 patch (or per-item) |
| `@igrp/framework-next-types` | 10 | 1 patch (coordinated cascade) |
| `@igrp/igrp-framework-react-design-system` | 7, 8, 12, 13, 14 | 1–2 patch |
| `@igrp/framework-next-ui` | 9, 10, 25, 26 | 1 patch |
| `@igrp/framework-next` | 2, 4, 5, 10, 23, 24 | 1 patch |
| `@igrp/template-migrator` | 3, 6, 15, 16, 17, 18 | 1 patch |
| `templates/demo-v1` (via migrations) | 11, 19, 20 | template-migrator migration(s) + patch |

Build order after edits: `pnpm build:framework` (auth → types → ds → next-ui → next), then `pnpm build:demo`. Verify: `pnpm --filter @igrp/template-migrator test`, Storybook snapshots for design-system items, template runs with `IGRP_PREVIEW_MODE`/`AUTH_PROVIDER=none` on **and** off.

## Out of scope

- **Access-management permission gating** — the framework/template never call permission/authorize APIs and there are no guard helpers. This is a feature gap, already tracked in `docs/superpowers/specs/2026-06-24-igrp-permission-gating-design.md`, not a remediation item here.
- Architectural rewrites (refactoring the data-hook caching layer wholesale, an OIDC class, a migrator transaction engine). Items above are surgical.
- Versioning/publishing — separate authorized step per the global constraints.
- The 11 candidates refuted during verification (e.g. the claim that consolidating the redirect logic would fix the backslash bug — it would not; both paths share the identical weak check, addressed directly in item 1).
