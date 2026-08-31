# Design & Spec: Permissions Hardening (token-claims gating)

| | |
|---|---|
| **Status** | Draft — awaiting approval |
| **Author** | Fidel da Luz |
| **Date** | 2026-08-31 |
| **Scope** | Two **additive** framework changes (`@igrp/framework-next`, `@igrp/framework-next-ui`) + template prose/comment corrections. No template migration required — see §8. |
| **Affects** | `@igrp/framework-next`, `@igrp/framework-next-ui`, `@igrp/framework-next-template` consumers, igrp-studio generated apps |
| **Risk** | Low — every change is constrained to states that are **broken today** (see §7, additive proof per finding). |
| **Origin** | Deep review of permission usage in `templates/demo-v1`, 2026-08-31. Finding F1 confirmed by execution, not by reading (§4.1). |
| **Companion** | [`docs/PERMISSIONS.md`](../docs/PERMISSIONS.md) is the user-facing guide this spec corrects. |

---

## 1. Executive summary

The token-claims gating layer (`igrpGetClaims` / `igrpAuthorize` / `igrpAssertAuthorize` / `IGRPSectionPermissions` / `<IGRPAuthorization>`) is well designed and correctly wired in `templates/demo-v1`. Two defects sit in it, one confirmed by execution:

1. **F1 — the documented server-action gate denies everyone.** `igrpAuthorize` reads the access token from `AsyncLocalStorage`. A server action is a fresh async context with no store, so the token is unreachable, `igrpGetClaims` returns `{status:'error'}`, and `igrpAuthorize` returns `false` **for every user including super-admins**. The snippet at [`docs/PERMISSIONS.md`](../docs/PERMISSIONS.md) §"Gating a server action" does not seed the token, so following the documentation produces a gate that always denies.

2. **F2 — client claims are frozen for the whole page load.** `IGRPSectionPermissions` stores claims in `useState(initialState)` and never resyncs. The root cause is deeper than a missing effect: **no fresh `claims` prop ever arrives** — token rotation goes through `getSession()` with no `router.refresh()`, and shared layouts do not re-render on client navigation. So the server gate is fresh while client gating answers from login-time claims until a full reload.

Plus three prose/diagnostic corrections (F3–F5) where the documentation currently overstates what is enforced.

**Key properties**

- **Additive only.** Neither framework change can regress a working caller: F1's fallback fires only where the current code is guaranteed to fail, and F2's live decode degrades to today's exact behavior when no `SessionProvider` is present.
- **No new dependency, no dependency-order change.** `framework-next` already depends on `@igrp/framework-next-auth`; `next-auth/react` already exports `SessionContext`.
- **Preview mode stays intact.** The live decode is gated on the token being JWT-shaped, so the bypass `preview-token` never reaches the decoder.
- **No default-deny.** This is a deliberate, permanent stance (§6), not an omission — enforcement of "every page declares a permission" belongs to codegen, not to the framework.

**Estimated effort:** ~0.5 day implementation + tests, ~0.25 day prose corrections + ordered build, plus release authorization (§9). No migration authoring — see §8.

---

## 2. How gating works today (verified)

Gating reads **access-token JWT claims — zero network**. The Access-Management API remains the real enforcement on every data call.

| Layer | Code | Notes |
|---|---|---|
| Decode / match | [`claims.ts`](../../../packages/framework/next-auth/src/claims.ts) — `decodeIgrpClaims`, `claimsAllow` | Pure, runtime-agnostic (`atob` + `TextDecoder`, no `Buffer`) so it runs on Node, Edge, **and in the browser**. No signature verification by design. |
| Server resolve | `igrpGetClaims()` — [`permissions.ts:36`](../../../packages/framework/next/src/lib/permissions.ts) | `React.cache` per request; bypass → super-admin mock; decode failure → distinguishable `{status:'error'}`. Reads the token from `igrpGetAccessClientConfig()`. |
| Server gate | `igrpAuthorize` (bool) / `igrpAssertAuthorize` → `forbidden()` | An error state **throws** rather than 403, so an outage is never mislabeled as a denial. |
| Token transport | `AsyncLocalStorage` in [`api-config.ts`](../../../packages/framework/next/src/lib/api-config.ts) | Correct choice: `React.cache` alone does not survive into Server Actions. Seeded only by `serverSession()` / `getSession()` in [`src/lib/auth.ts`](../src/lib/auth.ts) and by `IGRPLayoutFull` during render. |
| Client provider | `IGRPSectionPermissions`, seeded in [`src/app/(igrp)/layout.tsx`](../src/app/(igrp)/layout.tsx) after `verifySession()` | Mounted **below** the root layout's `SessionProvider` (`IGRPRootLayout` → `IGRPNestedProviders` → `IGRPSessionProvider`). |
| Client gate | `usePermissions().isAllowed`, `<IGRPAuthorization>`, `<IGRPGuardPage>` | Cosmetic by design. |
| 403 boundary | [`(igrp)/forbidden.tsx`](../src/app/(igrp)/forbidden.tsx) + `experimental.authInterrupts` | Present and correct. |

Matching rule (`claimsAllow`): `is_super_admin` → allow all; a dotted name matches verbatim; a **bare** name is qualified with the active `org` → `` `${org}.${name}` ``; a bare name with no `org` → **deny** (fail-closed).

Template usage is exactly one worked example: [`exemplo-permissao/page.tsx`](<../src/app/(igrp)/(demo)/exemplo-permissao/page.tsx>) and its [`_components/actions.tsx`](<../src/app/(igrp)/(demo)/exemplo-permissao/_components/actions.tsx>). The wiring ships via migrator payloads 21 / 26 / 28 and the baseline covers the demo page, so `check:drift` already guards it.

---

## 3. Constraints this spec accepts

| # | Constraint | Consequence |
|---|---|---|
| C1 | **Additive only.** No change may alter behavior in a state that works today. | Rules out changing any public signature (e.g. `claimsAllow` returning `{allowed, reason}`) and rules out making `SessionProvider` a hard precondition of `IGRPSectionPermissions`. |
| C2 | `claims.ts` stays **pure and runtime-agnostic**. | Diagnostics go in `igrpGetClaims`, not in `claimsAllow`. |
| C3 | Do not touch `@igrp/framework-next-auth`. | It is the root of `next-auth → next-types → design-system → next-ui → next`; touching it drags a full-chain rebuild. Keeps the publish chain to `next-ui → next`. |
| C4 | Preview mode (`IGRP_PREVIEW_MODE` / `AUTH_PROVIDER=none`) must keep passing every gate. | The bypass "token" is the literal string `preview-token`, not a JWT. |
| C5 | `IGRP_PREVIEW_MODE` is **not** `NEXT_PUBLIC_`. | The browser cannot check the bypass flag; any client-side logic must infer safety from the token's shape instead. |

---

## 4. Findings and decisions

### 4.1 F1 — Server-action gate denies everyone (confirmed by execution)

**Evidence.** A probe run in `packages/framework/next` against the **real** `AsyncLocalStorage` (not the mocked `api-config` the existing suite uses), reproducing a server action's fresh async context. Both assertions passed on the first run:

```ts
// no ALS store seeded — exactly a server action's starting state
const state = await igrpGetClaims();
// → { status: 'error', error: 'decodeIgrpClaims: missing access token' }

expect(await igrpAuthorize('manage_access')).toBe(false);          // ✅ passed
await expect(igrpAssertAuthorize('manage_access'))
  .rejects.toThrow(/cannot determine permissions/);                // ✅ passed
```

There is no token to be right about: a super-admin is denied identically to an unprivileged user. The sibling failure is the same root cause — an action that reaches the AM client instead gets `Access Management client is not configured. Call igrpSetAccessClientConfig() first.`

**Decision.** `igrpGetClaims` gains a fallback: when the ALS token is empty, resolve the session via `getServerSession()` (from `@igrp/framework-next-auth/server`, already a dependency of `framework-next`), **and seed the ALS store** with the recovered token before decoding.

Seeding — rather than only decoding — is deliberate: an action that needs claims almost always needs the AM client next, and that fails today for the same reason. One fix, one call site.

```ts
// packages/framework/next/src/lib/permissions.ts — shape, not final code
export const igrpGetClaims = cache(async function igrpGetClaims(): Promise<IGRPClaimsState> {
  if (isIgrpAuthBypass()) return { status: 'ok', claims: { ...SUPER_ADMIN_MOCK } };
  try {
    let { token } = igrpGetAccessClientConfig();
    if (!token) {
      // Fresh async context (Server Action / Route Handler): no ALS store was
      // ever established. Recover the token from the session and seed the store
      // so the AM client works in this same context too.
      const session = await getServerSession();
      token = (session as { accessToken?: string } | null)?.accessToken ?? '';
      if (token) {
        igrpSetAccessClientConfig({ token, baseUrl: resolveAccessBaseUrl() });
      }
    }
    return { status: 'ok', claims: decodeIgrpClaims(token) };
  } catch (error) { /* → { status: 'error', … } as today */ }
});
```

**Open execution risk (must be verified during implementation, not assumed):** `getServerSession` pulls `next/headers` into `permissions.ts`, which is re-exported from the `framework-next` **root** entry. Confirm every current import site of that entry still builds — in particular any Edge or non-request context. If it does not hold, fall back to a lazy `await import()` inside the `if (!token)` branch so the module graph is only widened on the path that is broken today.

**Related decision (F1b).** `igrpAssertAuthorize` is **page-only**. In an action it throws with no `forbidden.tsx` boundary, surfacing as an unhandled action error. Actions use `igrpAuthorize` and return a typed result (`{ok: false, code: 'forbidden'}`), which is already the shape PERMISSIONS.md shows. This is a **documentation + JSDoc** change, not a code change: no `igrpAssertAuthorizeAction` is added.

### 4.2 F2 — Client claims frozen for the page-load lifetime

**Root cause (corrected).** Not merely a missing prop-sync. Prop-sync would be dead code: `IGRPSectionPermissions` never receives a new `claims` prop, because token rotation in [`session-watcher.tsx`](../../../packages/framework/next-ui/src/components/templates/session-watcher.tsx) calls `getSession()` (rotating the cookie client-side) **without** `router.refresh()`, and shared layouts do not re-render on client navigation. The RSC layout therefore renders once per full page load.

**Rejected alternative.** Firing `router.refresh()` on rotation would fix it by re-fetching the RSC tree — but rotation fires on a routine ~45-second lead before expiry, so every rotation would refetch header, sidebar, and page. That is a real performance regression bought for a cosmetic benefit.

**Decision.** `IGRPSectionPermissions` re-decodes claims from the client session, with the server-seeded state as the SSR/initial value. `claims.ts` already runs in the browser (C2's purity is what makes this possible), and the client session carries `accessToken` **by design** — see the SECURITY note in [`config.ts`](../../../packages/framework/next-auth/src/config.ts): *"copies accessToken + idToken onto the client session by design (the browser AM client needs accessToken)"*. No new plumbing, and no new exposure: the full claims object is already serialized into the RSC payload today.

Three guards, each answering a specific failure mode:

| Guard | Rule | Why |
|---|---|---|
| **G1 — provider-optional** | Read `SessionContext` via `useContext` (exported from `next-auth/react`) and treat `null` as "no session available", falling back to the server-seeded state. | **C1.** next-auth **4.24.14**'s `useSession` *throws* `must be wrapped in a <SessionProvider />`. `useSafeSession` does **not** guard this (see Appendix A5). Using either would make a `SessionProvider` a hard precondition of a published component that works standalone today — a breaking change. |
| **G2 — loading** | While the session status is `loading`, keep the server-seeded state. | Mirroring the server exactly would blank every gated control for a frame on every page load — worse than the bug being fixed. Error state is entered **only** when a token is genuinely present and fails to decode. |
| **G3 — JWT-shaped only** | Re-decode only when the token has three dot-separated parts; otherwise leave the seeded state untouched. | **C4 + C5.** The bypass token is `preview-token`; a naive decode would fail, G2 would classify it as a real failure, and **every gate in preview mode would flip to denied**. Shape-checking also avoids sniffing the mock's `{isSuperAdmin, permissions: []}` shape, which a real super-admin holding no direct permissions would trip. |

`IGRPSectionPermissions` keeps its current props exactly; `usePermissions()` keeps its current return shape.

### 4.3 F3 — Menu `roles[]` is enforced nowhere

`roles` is never read anywhere in `packages/framework/next-ui/src` (the only hit for the string is `use-permissions.ts`), yet [`src/temp/menus/menus.ts`](../src/temp/menus/menus.ts) documents it as *"role/department gating; empty array = visible to everyone"*, and PERMISSIONS.md's enforcement table credits menus to "AM server-side scoping". In preview mode every menu renders, including the one commented "role-gated" ([`system/config`](<../src/app/(igrp)/(demo)/system/config/page.tsx>)).

**Decision.** Prose only — no filtering is added. Correct the `menus.ts` comment to state that `roles` is **carried but not enforced client-side**, and correct the enforcement table's Menu row to say menu visibility is whatever AM returns (and, in preview, whatever the mock contains).

### 4.4 F4 — No default-deny, and no rule where codegen would read it

A page without `igrpAssertAuthorize` is fully open and deep-linkable. `(igrp)/(generated)/` — where igrp-studio writes — has zero guards.

**Decision.** No default-deny; this is a permanent, intentional stance. Next's App Router has no good seam for it: a layout cannot know a child page's required permission without a registry, and a registry drifts from the pages immediately. The honest fix is that the **generator** must emit the guard.

PERMISSIONS.md already carries the per-page checklist. The gap is that the template's `AGENTS.md` and `CLAUDE.md` — the files an agent or generator actually reads — say **nothing** about permissions. Add a short rule: every page under `(generated)` either calls `await igrpAssertAuthorize("<perm>")` or explicitly records that it is open to all authenticated users. No `check:guards` script: a gate the framework cannot really enforce would give false assurance.

**`AGENTS.md` is the load-bearing file, not `CLAUDE.md`.** Per [`drift-orphans.ts`](../../../packages/template-migrator/scripts/drift-orphans.ts), `CLAUDE.md` is **zip-excluded — never reaches consumers**, while `AGENTS.md` ships in the template zip as the "AI bridge file". A rule written only into `CLAUDE.md` would be invisible to every generated app. Write it into `AGENTS.md` (the one that ships) and mirror it into `CLAUDE.md` for work inside this repo.

### 4.5 F5 — "Token has no `org`" is indistinguishable from a denial

A bare-name check with no `org` claim denies **everything** ([`claims.ts`](../../../packages/framework/next-auth/src/claims.ts), `claimsAllow`) and looks exactly like a genuine denial.

**Decision.** Warn once per request in `igrpGetClaims` when `!isSuperAdmin && !org`, dev-only. Not in `claimsAllow` (C2: purity; and it would warn once per check). Not via a richer `claimsAllow` return (C1: public signature change). This is the right altitude — "this token cannot satisfy any bare-name permission" is a property of the claims, not of one check.

Also note in PERMISSIONS.md's Limitations that a client-side claims **error** state currently hides every gated control with nothing surfaced to the user, since nothing in the template reads `usePermissions().status` / `.error`.

---

## 5. Acceptance criteria — tests

| # | Test | Package | Asserts |
|---|---|---|---|
| T1 | Server-action path, **real** ALS (no store seeded), session available | `framework-next` | `igrpAuthorize` → `true` for a permitted token; the F1 probe's `false` is now impossible |
| T2 | Server-action path, real ALS, **no** session | `framework-next` | still `{status:'error'}` → `igrpAuthorize` → `false` (fail-closed preserved) |
| T3 | Fallback **seeds** the store | `framework-next` | after `igrpGetClaims`, `igrpGetAccessClientConfig().token` is populated |
| T4 | ALS store already seeded | `framework-next` | `getServerSession` is **not** called (no behavior change on the working path) |
| T5 | `org` missing, not super-admin | `framework-next` | warning emitted once per request, dev only; silent in production |
| T6 | Provider mounted with **no** `SessionContext` | `framework-next-ui` | renders, does not throw, exposes the server-seeded claims (C1 / G1) |
| T7 | Session status `loading` | `framework-next-ui` | server-seeded claims retained, **not** error state (G2) |
| T8 | Non-JWT token (`preview-token`) | `framework-next-ui` | seeded super-admin state untouched; every gate still passes (G3 / C4) |
| T9 | JWT token with different claims than the seed | `framework-next-ui` | `usePermissions()` reflects the **new** claims (F2 fixed) |
| T10 | JWT-shaped token that fails to decode | `framework-next-ui` | error state entered (G2's "genuine failure" branch) |

T1–T5 extend `packages/framework/next/src/lib/__tests__/permissions.test.ts` (it currently mocks `api-config`, so T1–T4 need a sibling file using the real module). T6–T10 are new for `framework-next-ui`.

---

## 6. Out of scope (deliberate)

- **Default-deny** — §4.4. Permanent stance.
- **Menu role filtering** — §4.3. Prose correction only.
- **Active-role switching** — already documented as unwired; the F2 design leaves the `setState` seam intact for it.
- **`next-types` hand-redeclared AM DTOs** — pre-existing drift risk, unrelated to gating.
- **Signature verification of the access token** — deliberate: server-side the token is sealed in the NextAuth cookie, and client-side gating is cosmetic.

---

## 7. Additive proof (C1)

| Change | State it affects today | Therefore |
|---|---|---|
| F1 fallback in `igrpGetClaims` | Only fires when the ALS token is **empty**, which today yields `{status:'error'}` → `igrpAuthorize` = `false` / `igrpAssertAuthorize` throws | No caller that works today takes this branch. T4 pins it. |
| F1 also seeding ALS | Only writes when the store held no token | Cannot overwrite a token a working caller established. |
| F2 live re-decode | Provider currently **never** updates | Making it update cannot regress a caller relying on updates — there are none. |
| G1 `useContext(SessionContext)` | `null` → today's exact behavior (server-seeded, frozen) | Provider-less consumers see no change. Using `useSession`/`useSafeSession` instead **would** break them. |
| G3 JWT-shape check | Non-JWT → seeded state untouched | Preview mode byte-identical. |
| F5 warning | Dev-only log | No behavior change. |
| F3 / F4 | Comments, docs, `AGENTS.md`, `CLAUDE.md` | No behavior change. |

---

## 8. Migration — **not required** (verified)

The original plan assumed the prose fixes would need migration 29 with a `payload/29/` copy of each file. **They do not.** Verified against [`drift-orphans.ts`](../../../packages/template-migrator/scripts/drift-orphans.ts) and `migrations/demo-v1/`:

| Path | Drift-gate status | Migration needed? |
|---|---|---|
| `docs/PERMISSIONS.md` | `docs/` is an **exempt prefix** — ships in the zip, but classified as docs content, not runtime code | No |
| `specs/…` (this file) | `specs/` is an **exempt prefix** | No |
| `AGENTS.md` | **exempt file** (AI bridge file; ships in the zip) | No |
| `CLAUDE.md` | **exempt file — zip-excluded, never reaches consumers** | No — and see §4.4 |
| `src/temp/menus/menus.ts` | **baselined** (grandfathered in `template-baseline.json`); no migration's `steps` manage it | No |
| `README.md` | **baselined**; not migration-managed | No |

No migration is authored, and no framework-side template change is needed either: F2's fix lives entirely inside `IGRPSectionPermissions`, so [`src/app/(igrp)/layout.tsx`](../src/app/(igrp)/layout.tsx) is untouched — which is precisely what makes G1's five lines worth writing.

**Consequence to accept knowingly.** Because none of these files are migration-managed, the corrected prose reaches **newly scaffolded** apps (via the zip) but **not** apps upgraded through `igrp-migrate`. That is the intended semantics of the exempt list ("an upgraded app missing them behaves identically to a scaffolded one") and it holds here: every corrected file is documentation or a comment. If the F4 rule in `AGENTS.md` is judged important enough to reach existing apps, it needs a deliberate `file.write` migration **against** the exemption — a separate decision, not assumed by this spec.

`pnpm --filter @igrp/template-migrator check:drift` must still pass before release, as a check that nothing unintended drifted.

---

## 9. Release order (requires explicit authorization)

Publishing is **not** part of this spec's implementation. Per the repo's hard rules, each step below needs the maintainer's explicit go-ahead at that point:

1. `pnpm changeset` — **`patch` only** (pre-release mode; `major`/`minor` would break the `0.1.0-beta.*` pattern) for `@igrp/framework-next` and `@igrp/framework-next-ui`.
2. `pnpm version:changesets`, commit.
3. Ordered build — `pnpm build:next-ui` then `pnpm build:next` (never reordered; `next` imports from `next-ui`).
4. Publish **both** bumped packages via their own `release` scripts — never `changeset publish` / `pnpm release:publish` (those use `--tag beta`). Both must ship: `workspace:*` pins to the local version at publish time, so skipping one breaks the other's manifest.
5. Verify against the registry: `pnpm view <pkg> version --registry=https://sonatype.nosi.cv/repository/igrp/`.
6. Run `pnpm --filter @igrp/template-migrator check:drift` as a safety check. **No migration is authored** (§8), so `@igrp/template-migrator` is not republished.

**Pre-release manual checklist** (not a gate on implementation — needs a real backend and a user lacking `manage_access`):

- [ ] Preview **off**, de-privileged user → `/exemplo-permissao` renders the 403 in-chrome (`IGRPForbidden`), not a 5xx.
- [ ] The `Eliminar` button renders as the disabled fallback.
- [ ] A server action gated with `igrpAuthorize` **allows** a permitted user (this is the F1 regression, end-to-end).
- [ ] A token with no `org` claim logs the F5 warning exactly once.
- [ ] Preview **on** → every gate still passes, no claims error in the console (G3).

---

## Appendix A — Accepted limitations (seen, decided, not fixed)

| # | Limitation | Disposition |
|---|---|---|
| A1 | `claimsAllow` is exact-match; no wildcard (`DEPT.*`) support | Accepted. No demand yet, and a wildcard grammar is a one-way door — introduce it only with a concrete case. |
| A2 | `forbidden.tsx` exists only under `(igrp)`; a `forbidden()` outside that segment gets Next's default 403 page | Accepted. Every gated route lives under `(igrp)`; a root boundary would be dead code. |
| A3 | `getSession()` and `serverSession()` seed `baseUrl` from two different sources for the same value | Accepted **for this change**. Unifying it touches the auth seeding path that F1's fix depends on; bundling an unrelated refactor there makes a regression harder to bisect. Worth its own commit. |
| A4 | `exemplo-permissao` is in no mock menu, so the worked example is URL-only | Accepted. Adding it would put a permissions demo in every generated app's sidebar. |
| A5 | `useSafeSession` is not safe — it delegates straight to `useSessionBase`, which throws without a `SessionProvider` | Recorded, **not** fixed here. It lives in `@igrp/framework-next-auth`, the root of the dependency chain (C3); fixing it would drag a full `auth → types → ds → next-ui → next` rebuild for no benefit to this work. G1 sidesteps it. |
| A6 | Client-side claims **error** state silently hides every gated control | Documented in PERMISSIONS.md Limitations (F5). Surfacing it in the UI is a separate design question. |
