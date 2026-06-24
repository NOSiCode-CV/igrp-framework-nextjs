# IGRP Permission Gating — Design

**Date:** 2026-06-24
**Status:** Draft (pending user review) — Spike S1 ✅ resolved (see §0); ready for implementation planning
**Scope:** `@igrp/framework-next-auth`, `@igrp/framework-next-types`, `@igrp/framework-next`, `@igrp/framework-next-ui`, `templates/demo-legacy`

---

## 1. Problem

The framework wraps `@igrp/platform-access-management-client-ts` (`0.2.0-beta.11`) only as `igrpGetAccessClient()` and never uses its permission/authorization surface. There is **no permission gating anywhere** in `packages/**` or `templates/demo-legacy/**` — authorization is effectively binary (authenticated vs not). Apps need to gate **pages**, **components**, and **menus** by the current user's permissions.

The IGRP authorization-server access token already carries the authorization data:

```jsonc
{
  "sub": "3a81e0f2-…",
  "org": "DEPT_IGRP",
  "selectedRole": "DEPT_IGRP.superadmin",
  "is_super_admin": true,
  "resource_access": { "igrp-access-management": { "roles": ["DEPT_IGRP.superadmin"] } },
  "permissions": ["DEPT_IGRP.manage_access"],   // all departments; structured `${dept}.${suffix}` — prefix=dept(=org), suffix arbitrary (V3)
  "aud": "igrp-access-management",
  "iat": 1782124035, "exp": 1782124215           // ~180s TTL
}
```

NextAuth stores this token as an **opaque string** in the session (`session.accessToken`); its `jwt`/`session` callbacks copy `accessToken`/`idToken`/`expiresAt` but never decode the claims. Reading `permissions`/`roles`/`selectedRole`/`is_super_admin` = decoding the JWT payload. **Zero network.**

---

## 0. Pre-implementation spike — ✅ RESOLVED (feasible)

**Spike S1 — mid-session active-role switch (gates D10).** Investigated against `next-auth@4.24.14`, `config.ts`, and `oidc.ts`. **Outcome: feasible with a small, targeted change.**

Findings:
- `useSession().update(data)` re-runs the `jwt` callback with `trigger: 'update'` from the `/api/auth/session` **route handler** — cookies are writable there, so a rotated token persists (the RSC-can't-persist constraint does not apply to this path).
- `refreshOidcAccessToken(token, env)` is exported, reusable, and already handles rotation + in-flight dedup + recovery store.
- The only gap: the current `jwt` callback ignores `trigger` and early-returns the still-valid token unchanged ([config.ts:560](../../../packages/framework/next-auth/src/config.ts)), so `update()` mints nothing today.

**Chosen mechanism (D10):**
1. Extend the IGRP `jwt` callback: when `trigger === 'update'` and a sentinel is present (e.g. `session.igrpForceRefresh === true`), **bypass the validity early-return** and call `refreshOidcAccessToken` unconditionally; the AS re-issues the switched `selectedRole`/`permissions` (V2 ✅).
2. `igrpSetActiveRole`: `await setCurrentUserActiveRole` (commit first) → trigger the forced-refresh `update()` → `session` callback copies the new `accessToken` → provider revalidates → `usePermissions` reflects the new role.

**Required refinement:** `refreshOidcAccessToken` returns `{ error, forceLogout: true }` on failure — correct for the *expiry* path, but a *voluntary* role-switch refresh must **not** log the user out on a transient blip. The forced path keeps the old token and surfaces a retryable "switch failed" `ActionResult` instead. The callback extension must distinguish forced-voluntary from expiry-driven refresh.

No other part of the spec depended on S1; D10 now stands as specified.

---

## 2. Decisions (with rationale)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Decoded token claims are the single source of truth** for UI gating (page/component/menu). | Data is already in the token; zero network. The AM API remains the *real* enforcement on every data call. |
| D2 | **No JWKS signature verification** — decode payload only. | Server-side the token is sealed inside NextAuth's `NEXTAUTH_SECRET`-protected session cookie (untamperable); client-side gating is cosmetic; AM enforces for real. JWKS in Edge = crypto+network for zero gain here. |
| D3 | **Server-decoded provider** delivers claims to the client. | One decode location; client never re-parses the JWT; mirrors the `IGRPSessionProvider` pattern. |
| D4 | **Matching = bare name qualified by active department:** `can('manage_access')` matches `` `${org}.manage_access` `` in `permissions[]`; a string already containing `.` is treated as **fully-qualified** and matched as-is (cross-department checks); `is_super_admin` bypasses all. | The permission string is structured `${dept}.${suffix}` — the **prefix is the department** (token `org` = active dept), only the **suffix is arbitrary** (V3 relaxed the suffix, not the prefix). Bare-name + org-prefixing keeps gates **portable across departments** and restores dynamic active-dept scoping; `permissions[]` carries all departments, so prefixing by `org` selects the active one. |
| D5 | **Fail closed, surface error.** Decode failure / missing claims → deny, but expose a distinguishable error state (not a silent empty screen). | Security default without hiding outages from operators. |
| D6 | **Component gating unmounts by default**; `keepMounted` opt-in uses React 19 `<Activity mode="hidden">`. | `<Activity>` keeps denied markup in the DOM (inspectable) — unsafe as the default for an authorization primitive. Opt-in preserves the state/pre-render benefit for non-sensitive cases. |
| D7 | **Page gating is server-side and authoritative** via `igrpAssertCan(perm)` in the RSC; client `<IGRPPageGuard>`/hook is convenience only. | Server enforcement can't be bypassed; runs before content streams (no flash). |
| D8 | **403 via Next 15 `forbidden()` + `forbidden.tsx`** rendering `IGRPForbidden` (requires `experimental.authInterrupts`). **Render-path only** — used by page guards, *not* server actions (see D12). | Idiomatic 403: real status, URL preserved, in-chrome. ⚠️ `authInterrupts` is experimental — confirm the template's pinned Next version supports `forbidden()`; fallback `redirect("/403")` if not. |
| D9 | **Menus:** trust AM's returned set entirely; **no client-side filtering**. | V1 confirmed: `getCurrentUserApplicationMenus` already scopes to the active role server-side. Client narrowing would risk hiding valid menus. |
| D10 | **Active-role switch in scope, minimal:** `igrpSetActiveRole()` → `await setCurrentUserActiveRole` (commit first) → forced-refresh `update()` (jwt-callback extension, S1 ✅) → reseed provider. AS re-issues updated claims on refresh (V2 ✅), so the switch takes effect mid-session. Forced-refresh failure is retryable (does **not** force logout — see §0 refinement). | Required for correctness of active-role scoping without a full role-picker UX. |
| D11 | **Preview / `AUTH_PROVIDER=none`:** claims = `{ isSuperAdmin: true }`. | Matches preview's "everything visible, no backend" intent; overridable later. |
| D12 | **PDP escape hatch (opt-in, server-only):** `igrpAuthorize(resource, action)` + `igrpAssertAuthorized(...)` wrapping `checkAuthorization`. NOT wired into `<IGRPCan>`/`usePermissions`. **`igrpAuthorizeBatch` is dropped** (round-2 finding B): the client's `batchCheckAuthorization` returns a *single* `PermissionCheckResponseDTO` for N requests — no per-request mapping — so batch is unbuildable until the client returns an array. Flag upstream. | Token TTL ~180s → claims can be ~3 min stale; the PDP is the authoritative, always-fresh evaluator (`allowed` + `via_roles` grant-trail, server-cached). Token and PDP are **two views of one policy** (V4). |
| D14 | **Page guard vs action guard return differently.** Page-render assertions call `forbidden()` (render interrupt). **Server-action** assertions return a structured `ActionResult<{ ok:false, code:'forbidden' }>` — they do **not** call `forbidden()` (a render-path interrupt has no clean meaning in an action). | `forbidden()`/`authInterrupts` is designed for the render tree; in an action it can't return a clean 403 to the caller. The template already uses the `ActionResult<T>` shape (`actions/index.ts`). |
| D15 | **PDP helpers require the per-request access-client config to be established in the *same* async context.** A server action calling `igrpAuthorize` must first run `serverSession()` (which calls `igrpSetAccessClientConfig`) in that action — the `AsyncLocalStorage` store seeded during layout render does **not** propagate into a separately-invoked server action. The helper throws a clear error if the token is empty rather than silently 401ing. | `api-config.ts` uses `AsyncLocalStorage`/`enterWith` precisely because actions run outside the render context; the store is per async-chain, not global. |
| D13 | **Type-drift fix (reconcile-then-test):** first **align** the overlapping `next-types` shapes (`IGRPRoleArgs`/`IGRPPermissionArgs`/`IGRPUserArgs`) to the client DTOs (`RoleDTO`/`PermissionDTO`/`IGRPUserDTO`), **then** add the conformance test in `next`'s vitest. The test compares the two type sets (it lives in `next`, which has the client dep — so `next-types` gains no AM-client dependency). | Round-2 finding C: the types **genuinely diverge today** (e.g. `IGRPRoleArgs.permissions: IGRPPermissionArgs[]` vs `RoleDTO.permissions: string[]`), so a blanket conformance test can't go green until they're aligned. The `permissions` field flip is **breaking** — call it out in the changeset. |

---

## 3. Architecture

Dependency order: `next-auth → next-types → design-system → next-ui → next`.

```
next-auth   ./claims  →  decodeIgrpClaims(accessToken): IGRPAccessClaims   (pure, edge-safe)
            config.ts →  jwt-callback: forced refresh on trigger:'update'+sentinel (S1)
next-types            →  type IGRPAccessClaims
next        (server)  →  igrpGetClaims(), igrpCan(), igrpAssertCan()        [token, page/render]
                         igrpAuthorize(), igrpAuthorizeBatch(),
                         igrpAssertAuthorized()                             [PDP, server-action]
                         igrpSetActiveRole()                                [ActionResult]
                         + permissions conformance test (vitest)
next-ui     (client)  →  IGRPPermissionsProvider, usePermissions(),
                         <IGRPCan>, <IGRPPageGuard>, IGRPForbidden,
                         useSetActiveRole()  (commit → update() → revalidate)
template              →  seed provider in (igrp)/layout.tsx;
                         enable experimental.authInterrupts + forbidden.tsx
                           (placed BELOW (igrp)/layout so 403 renders in-chrome — R2-G);
                         one worked example (page guard + <IGRPCan>);
                         preview super-admin mock
```

### 3.1 Claims shape

```ts
interface IGRPAccessClaims {
  permissions: string[];   // `${dept}.${suffix}`, all departments; suffix arbitrary (V3)
  roles: string[];         // resource_access[aud]?.roles ?? []  (aud may be string OR string[] — handle both)
  selectedRole?: string;
  org?: string;            // active department
  isSuperAdmin: boolean;
  sub?: string;
  email?: string;
}
```

`decodeIgrpClaims` is a pure base64url→JSON payload decode. It must be **runtime-agnostic** (Edge has `atob` but no `Buffer`; Node/browser differ) — no `Buffer` dependency. `aud` may be a string or array; `resource_access[aud]` lookup handles both. On malformed/absent token it returns `{ permissions: [], roles: [], isSuperAdmin: false }` and signals the error to callers (D5).

### 3.2 Evaluation

```
canClaim(claims, name):
  if claims.isSuperAdmin: return true
  qualified = name.includes('.') ? name : `${claims.org}.${name}`
  return claims.permissions.includes(qualified)
```

The permission string is `${dept}.${suffix}` — **prefix is the department** (token `org` = active dept), **suffix is arbitrary** (V3). Callers pass the bare suffix; the active dept is applied automatically, keeping gates portable across deployments. A fully-qualified `dept.suffix` argument bypasses prefixing for cross-department checks. `permissions[]` carries all departments — prefixing by `org` selects the active one.

---

## 4. API surface

### `@igrp/framework-next-auth` (new `./claims` export + jwt-callback change)
- `decodeIgrpClaims(accessToken: string): IGRPAccessClaims`
- re-export `IGRPAccessClaims` type
- **`jwt` callback extension (config.ts):** on `trigger === 'update'` + `session.igrpForceRefresh`, force `refreshOidcAccessToken` before the validity early-return (S1 §0). Forced-refresh failure is **non-fatal** (no `forceLogout`) — distinct from the expiry path. This is the only behavioral change to existing auth code; must be covered by config tests and walked through the full login→refresh→logout flow.

### `@igrp/framework-next` (server)
- `igrpGetClaims(): Promise<IGRPClaimsState>` — **branches on `isAuthBypass()` first** → returns super-admin mock without decoding (R2-H: the bypass session's `accessToken:"preview-token"` is not a JWT and would fail to decode → wrongly deny). Otherwise `getSession()` → `decodeIgrpClaims(accessToken)`; React.cache-deduped; decode failure → `{ status:'error' }` (distinct from deny — see §9).
- `igrpCan(name: string): Promise<boolean>`
- `igrpAssertCan(name: string): Promise<void>` — **page/render use** → denies via `forbidden()` (D8).
- `igrpAuthorize(resource, action): Promise<{ allowed: boolean; viaRoles: string[] }>` — PDP via `igrpGetAccessClient().authorize.checkAuthorization`. Returns `via_roles` (grant-trail; semantics unverified — V7). **Requires the access-client config established in the same async context (D15)** — throws a descriptive error if the token is empty.
- ~~`igrpAuthorizeBatch`~~ — **dropped** (B); client batch returns one result for N requests. Re-add once the client returns `PermissionCheckResponseDTO[]`.
- `igrpAssertAuthorized(resource, action): Promise<ActionResult<void>>` — **server-action use** → returns `{ ok:false, code:'forbidden' }` on deny (D14), not a render interrupt.
- `igrpSetActiveRole(role: RoleDepartmentDTO): Promise<ActionResult<void>>` — `await setCurrentUserActiveRole` then force refresh + revalidate. **Mid-session behavior gated on Spike S1 (§0).**

### `@igrp/framework-next-ui` (client)
- `IGRPPermissionsProvider` — seeded with `IGRPAccessClaims` (+ error state) from the server layout; exposes a `revalidate` action for role switch.
- `usePermissions(): { can(name): boolean; permissions; roles; selectedRole; isSuperAdmin; status; error }` — **client-only hook** (reads context). Server components/actions use `igrpGetClaims`/`igrpCan` instead (R2-J).
- `<IGRPCan permission={string|string[]} mode="all"|"any" fallback keepMounted>` — unmount by default; `mode` **defaults to `"all"`** (most restrictive) for an array (R2-I); `keepMounted` → `<Activity mode="hidden">`. ⚠️ Verify `Activity` is a stable export in the pinned React (not `unstable_Activity`); if unstable, ship without `keepMounted` and add it later.
- `<IGRPPageGuard permission>` — client convenience (authoritative gate stays server-side).
- `IGRPForbidden` — 403 UI for `forbidden.tsx`.
- `useSetActiveRole()` — client side of the role switch (S1): calls the `igrpSetActiveRole` server action (commit), then `useSession().update({ igrpForceRefresh: true })` (mint new token), then `revalidate` the permissions provider. Returns `{ switch(role), pending, error }`; surfaces a retryable error without logging out on transient failure.

---

## 4.1 Applying gates to components (DS vs custom)

The design system stays **auth-agnostic** — DS components (Horizon `IGRP*` and primitives) are upstream of `next-ui` in the dependency order and must not import the permission layer. **Never add a `permission` prop to a DS component.** Gating is applied by the consumer:

- **DS component (Horizon/primitive) you can't edit** → wrap with `<IGRPCan>`:
  ```tsx
  <IGRPCan permission="manage_access"><IGRPButton>…</IGRPButton></IGRPCan>
  ```
- **Custom component you own** → wrap with `<IGRPCan>`, or use `usePermissions().can(...)` inside when you need *disabled* vs *hidden*, or to gate a sub-part:
  ```tsx
  const { can } = usePermissions();
  <IGRPButton disabled={!can('read_invoice')}>Ver</IGRPButton>
  ```

Rule of thumb: **wrap with `<IGRPCan>` by default; reach for `usePermissions()` only inside components you own when show/hide isn't granular enough.** Both resolve against the same zero-network token claims.

## 4.2 End-to-end flow (pages, menus, components)

**Shared foundation — once per request:**
```
request → NextAuth session (opaque accessToken)
        → (igrp)/layout.tsx [server]: igrpGetClaims()
            → getSession() → decodeIgrpClaims(session.accessToken)
            → { permissions[], roles[], selectedRole, org, isSuperAdmin }  (super-admin mock in preview)
        → seeds <IGRPPermissionsProvider> (client context)
```
Every scope below reads that one decoded object — zero extra network. `isSuperAdmin` short-circuits every check.

**Pages — server-enforced → 403:**
```tsx
// app/(igrp)/(myapp)/access/page.tsx  [server]
import { igrpAssertCan } from '@igrp/framework-next';
export default async function AccessPage() {
  await igrpAssertCan('manage_access');   // deny → forbidden() → forbidden.tsx → <IGRPForbidden/>
  return <AccessManagementScreen />;
}
```
Runs before content streams; can't be bypassed client-side. `<IGRPPageGuard>` is a client convenience; the server assert is the real gate.

**Menus — AM-filtered, rendered as-is:** `getCurrentUserApplicationMenus(appCode)` returns only the active role's menus (V1). The framework writes **no** menu-filtering code. Menu hiding is navigation UX, **not** enforcement — a deep-linked page still needs its own `igrpAssertCan`.

**Components — client show/hide:** `<IGRPCan permission="…">` (unmount on deny) or `usePermissions().can(…)` for disable-not-hide. Cosmetic — see layering below.

### 4.3 Two vocabularies — the developer holds both

UI/page gating uses **named permissions** (`"delete_invoice"`); the PDP wants **`{resource, action}`**. V4 confirms they're two views of one backend policy, but **the framework does not provide a name→(resource,action) mapping** — the app author supplies each string for its own surface. So a gated control and its authoritative action check look like:
```tsx
<IGRPCan permission="delete_invoice"><DeleteButton/></IGRPCan>   // UI: named permission
// inside the server action:
const res = await igrpAssertAuthorized('invoice', 'delete');     // PDP: resource+action
```
These two strings are **not derived from each other**. If a project wants them coupled, it owns that convention/table. Documented explicitly so nobody assumes the framework bridges them.

## 5. Scopes summary & enforcement layering

| Scope | Default mechanism | Authoritative option |
|---|---|---|
| Component | `<IGRPCan>` (token, unmount) | — (cosmetic by nature) |
| Page | server `igrpAssertCan(perm)` → `forbidden()` (token) | `igrpAssertAuthorized(resource, action)` (PDP) for high-stakes pages |
| Menu | AM-returned set, rendered as-is (V1: AM scopes to active role) | — |
| Server action | — | `igrpAuthorize` / `igrpAssertAuthorized` (PDP, single-check) |

**The load-bearing distinction:** component/menu/page gating shapes *what the user sees*; the **server action** behind a control (and ultimately the AM API on every data call) is *what actually stops an unauthorized operation*.

| Layer | Gate | Strength |
|---|---|---|
| Component | `<IGRPCan>` / `usePermissions` (token, client) | Cosmetic — hide UI |
| Menu | AM server-side scoping (V1) | Server-trusted navigation |
| Page | `igrpAssertCan` → `forbidden()` (token, server) | Enforced render gate |
| Action behind a control | `igrpAssertCan` (token) or `igrpAssertAuthorized` (PDP, fresh) in the server action | **Real enforcement** |

Token-claims gating is fast and convenient; the AM API stays the source of truth for enforcement. A gated button with an *un*gated server action behind it is **not** secure.

---

## 6. Verification items (must confirm against backend before/within implementation)

- **V1:** ✅ **Resolved (user).** `getCurrentUserApplicationMenus` already scopes menus to the active role. No client-side menu filtering (D9).
- **V2:** ✅ **Resolved (user).** The AS re-issues updated `selectedRole`/`permissions` on the refresh-token grant, so `igrpSetActiveRole` takes effect mid-session within ~1 token cycle (D10).
- **V3:** ✅ **Resolved (user, refined R2-A).** Permission strings are structured `${dept}.${suffix}` — the **prefix is the department**, only the **suffix** is arbitrary. Matching qualifies a bare suffix with the active `org`, and accepts fully-qualified strings as-is (D4). ⏳ Sub-verify: confirm the dept prefix is always the first dot-delimited segment (and suffixes never contain a leading dept-like token) so qualification is unambiguous.
- **V4:** ✅ **Resolved (user).** Token named-permissions and PDP `{resource, action}` are **two views of one policy**; `resource_access` key is the `aud` (`igrp-access-management`).
- **V5:** ✅ **Resolved (versions).** Template is Next **15.5.18** → `forbidden()`/`experimental.authInterrupts` available; an `experimental` block already exists in `next.config.ts`. No `redirect("/403")` fallback needed.
- **V6:** ✅ **Resolved (versions).** Template is React **19.2.6** → `Activity` is the stable export (shipped 19.2). `keepMounted` is buildable (still ships as opt-in polish, deferred per §10).
- **S1:** ✅ **Resolved (spike).** Mid-session role-switch refresh is feasible via a `trigger:'update'` jwt-callback extension that forces `refreshOidcAccessToken` from the writable route-handler context (see §0). D10 stands. Implementation must add the forced-vs-expiry failure distinction.
- **V7:** ⏳ Confirm `PermissionCheckResponseDTO.via_roles` semantics (inferred = role codes that granted the checked permission; not documented in the client README). Affects only the diagnostic value surfaced by `igrpAuthorize`.

---

## 7. Non-goals (YAGNI)

- No role CRUD UI; no full role-picker UX (only the minimal `igrpSetActiveRole` helper).
- No caching beyond per-request (`React.cache`).
- PDP helpers are **not** wired into `<IGRPCan>`/`usePermissions` (those stay zero-network).
- Template gets **one** worked example + 403 wiring — not a full app rewrite.

---

## 8. Testing & rollout

- **Type reconciliation + conformance test** (D13, finding C): **first** align `IGRPRoleArgs`/`IGRPPermissionArgs`/`IGRPUserArgs` to the client DTOs (note `RoleArgs.permissions` flips `IGRPPermissionArgs[]`→`string[]` — **breaking**, flag in changeset), **then** add the `next` vitest `*.test-d.ts` asserting structural assignability so future drift red-builds. The test can't go green before reconciliation. Scope-adjacent to gating (which reads token claims), bundled per the original review.
- **Unit:** `decodeIgrpClaims` (valid / malformed / missing token / `aud` as string vs array / Edge runtime without `Buffer`), `canClaim` (super-admin bypass, exact-match hit/miss), preview mock.
- **Build order:** changes touch all four framework packages → `pnpm build:framework` before consuming in the template. Patch changeset per publishable package (pre-release `beta` rules).
- **Preview parity:** verify every gate with `IGRP_PREVIEW_MODE` on and off. ⚠️ Preview = super-admin (D11) means the **default dev loop never shows a denied state** — the template's worked example must also be exercisable with preview off (or via a non-super-admin mock) so denial/403 is actually demonstrable.

---

## 9. Known limitations (accepted, document for consumers)

- **Revocation latency on token-only gates.** Because gating reads token claims (D1), a server-side permission *revocation* is not reflected until the token refreshes (~180s TTL + 60s buffer) or the user re-logs-in. This applies to `<IGRPCan>`, `igrpCan`, **and `igrpAssertCan` page guards**. A page/action that must lock **the instant** access is revoked has to use the PDP path (`igrpAssertAuthorized`), which is always-fresh. State this in consumer docs so nobody assumes `igrpAssertCan` is real-time.
- **Provider reseed depends on the `revalidate` action, not navigation.** Next.js does not re-execute `(igrp)/layout.tsx` on soft navigations within the segment, so the server-seeded claims won't refresh by themselves. `IGRPPermissionsProvider` must therefore (a) accept client-side state updates, not just an initial server prop, and (b) expose the `revalidate` action that `igrpSetActiveRole` calls. Without this, a role switch won't reflect until a hard reload.
- **`igrpAssertCan` is render-only; actions return `ActionResult`.** Consumers must not call the page guard inside a server action expecting a 403 — use `igrpAssertAuthorized`/`igrpAuthorize` and branch on the returned `ActionResult` (D14).
- **Decode-error ≠ deny on pages (R2-D).** A claims **decode error** (malformed token, transient AS issue) is *not* "forbidden". `igrpAssertCan` must distinguish: genuine missing-permission → `forbidden()` (403); decode/`status:'error'` → throw to `error.tsx` (5xx). Routing both to 403 mislabels outages and shows legitimately-permitted users a "not allowed" page during a blip.
- **Token bloat → cookie chunking (R2-E).** `permissions[]` carries **all departments**, and the access token rides inside NextAuth's encrypted session cookie (~4KB/cookie, auto-chunked). A user in many departments / broad roles can inflate every request's cookie and force multi-chunk cookies. Confirm the AS omits `permissions` for `is_super_admin` (the example superadmin lists one), and set an expectation/ceiling. Surfaces in prod, not dev.
- **No default-deny — per-page guards are opt-in (R2-F, decided: opt-in + documented).** Forgetting `igrpAssertCan` on a new protected page leaves it **silently open**; there's no runtime safety net (middleware only checks auth, not authorization). **Decision:** keep the flexible opt-in model; **do not** add a guarded-segment layout or lint enforcement now. Mitigation = **prominent documentation + a per-page guard checklist** in the template's docs and the worked example. Revisit a safety net (guarded segment / lint rule) only if omissions prove to be a real problem in practice.

---

## 10. Implementation phasing

Build the goal first as a low-risk vertical slice; defer everything that adds risk or scope but isn't needed to *check a permission*.

### Phase 0 — keystone (get the contract provably right before building on it)
- `decodeIgrpClaims` (runtime-agnostic, `aud` string|array, malformed→error state) + `IGRPAccessClaims`.
- The **matching rule**: bare-suffix + active-`org` qualification, fully-qualified passthrough, `is_super_admin` bypass (D4); `isAuthBypass()`-first branch (H).
- Unit tests on `decodeIgrpClaims` and `canClaim` are the gate to leave Phase 0.
- ⏳ Confirm **V3 sub-verify** (dept = first dot-segment) against real tokens before finalizing matching.

### Phase 1 — the goal: a working permission check (touches NO existing auth behavior)
In dependency order:
1. **next-auth** — `decodeIgrpClaims` + `./claims` export.
2. **next-types** — `IGRPAccessClaims`.
3. **next** — `igrpGetClaims` + `igrpCan` (bypass-first, bare+org).
4. **next-ui** — `IGRPPermissionsProvider` + `usePermissions` + `<IGRPCan>` → **component gating**.
5. **next + next-ui + template** — `igrpAssertCan` + `IGRPForbidden` + `forbidden.tsx` (below `(igrp)/layout`) → **page gating** (decode-error → `error.tsx`, not 403 — R2-D).
6. **template** — seed provider in `(igrp)/layout.tsx`, preview super-admin mock, **one worked example**, per-page guard checklist (R2-F).

✅ Exit criterion = the stated goal met: components + pages gated by the user's permissions; menus rendered as-is from AM (zero code). Shippable on its own.

### Phase 2 — deferred, each independent, only after Phase 1 is proven
- **Active-role switch** — jwt-callback `trigger:'update'` extension (S1) + `igrpSetActiveRole` + `useSetActiveRole`. **Isolated change, own review** (only piece touching the auth critical path; full login→refresh→logout test walk). Until shipped, active role = login-time role.
- **PDP escape hatch** — `igrpAuthorize` / `igrpAssertAuthorized` (D12). Add when a concrete sensitive server action needs a fresh authoritative check. (`igrpAuthorizeBatch` stays dropped pending the AM-client fix — finding B.)
- **Type-drift reconciliation** — D13 / finding C. Breaking `next-types` change; **own task + changeset**, not entangled with gating.
- **`keepMounted` / `<Activity>`** — opt-in polish on `<IGRPCan>` (viable per V6); add after the unmount default is proven.

**Sequencing rationale:** Phase 1 proves token-claim gating end-to-end with the least code and zero blast radius on existing auth — fast feedback on whether it feels right in real screens. The Phase 2 items are risky, opt-in, or unrelated; isolating them keeps each reviewable and keeps the core delivery clean.
