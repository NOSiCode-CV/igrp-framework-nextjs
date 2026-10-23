# Multi-App Auth Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Co-hosted IGRP apps (Center at `/`, apps under `/apps/*`) read only their own session cookie, react correctly to AM 401/403, and end each other's sessions in the same browser on an explicit logout; then (Phase 2) notice a revoked AM session when a tab regains focus.

**Architecture:** Cookie-name and host-logout primitives live in `@igrp/framework-next-auth` (`./cookies` + the `withIGRPAuth` instance). AM error handling and token recovery live in `@igrp/framework-next`. The template wires them into middleware, the login page and the logout flow, and ships them to apps through template-migrator migration 75. Phase 2 adds an AM session check passed from `framework-next` into `next-ui`'s session watcher as a server-action prop.

**Tech Stack:** TypeScript, Next.js 15 (App Router, Edge middleware), NextAuth v4, Vitest, tsup (next-auth), Babel (next, next-ui), Biome (template), template-migrator.

**Spec:** `docs/superpowers/specs/2026-10-22-multi-app-auth-sessions-spec.md`

## Global Constraints

- Work on branch `feat/multi-app-auth-sessions` cut from `development`. Never commit to `main`.
- Commit messages carry **no** `Co-Authored-By` trailer.
- Every changeset is `patch` (repo is in pre-release mode). New changesets go in `.changeset/<kebab-name>.md`.
- Build order after touching a package another one imports: `pnpm build:auth` → `pnpm build:next-types` → `pnpm build:ds` → `pnpm build:next-ui` → `pnpm build:next`. `framework-next`'s tests import `@igrp/framework-next-auth` from its `dist/`, so run `pnpm build:auth` before them.
- Do not edit any `dist/`. Import only documented subpath exports (`@igrp/framework-next-auth/cookies`, `/config`, `/jwt`, …).
- Framework packages lint with ESLint + Prettier; `templates/demo-v1` with Biome (`pnpm --filter @igrp/framework-next-template lint`). Don't cross-apply.
- Template user-visible text comes from `src/i18n/messages` (`src/app/(auth)` is in the `lint:i18n` literal scan). Reuse existing keys, e.g. `auth.signingOut`.
- Host-logout cookie: name `igrp.logout-at`, `Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age` `2592000`, value = unix **seconds**. `authTime` is unix **seconds**.
- Session-ended redirect target: `/login?reason=session_ended`, with `&callbackUrl=<encoded>` appended only when the sanitized path is non-empty.
- Every template file change ships in migration 75's payload, or `check:drift` fails the release.
- Phase 2 must not start until `pnpm view @igrp/platform-access-management-client-ts version --registry=https://sonatype.nosi.cv/repository/igrp/` reports a version with `checkSession` (planned `0.2.0-beta.21`).

## Review Focus

- A basePath app whose own cookie is chunked (`.0`/`.1`) while the Center's `__Secure-…~` cookie is also in the jar: must resolve its own scheme and name, not the Center's. Pinned in Task 1 and Task 3.
- An app running `cookieIsolation: 'none'` (stock `next-auth.session-token`, chunks included): Fixes 2 and 3 must leave it working. Pinned in Task 1 (no `basePath` arg) and Task 3.
- A session minted before this release (no `authTime`) when a logout signal exists: signed out once; without a signal, untouched. Pinned in Task 2.
- `authTime` exactly equal to `logout-at`: treated as ended (`<=`). Pinned in Task 2.
- A 401 raised inside a Server Action (`fetchMenusAction`): the redirect must propagate through `unstable_rethrow`, not become an `ActionResult` failure. Pinned in Task 4.

---

## Phase 1

### Task 1: Own-name secure detection and host-logout constants (`framework-next-auth/cookies`)

**Files:**
- Modify: `packages/framework/next-auth/src/cookies.ts:49-56` (`resolveSecureCookie`), append constants
- Modify: `packages/framework/next-auth/src/config.ts:1477-1490` (`getTokenFromRequest`), `:1532-1549` (`getAccessToken`)
- Test: `packages/framework/next-auth/src/__tests__/cookies.test.ts`, `packages/framework/next-auth/src/__tests__/secure-cookie-name.test.ts`
- Create: `.changeset/own-session-cookie-only.md`

**Interfaces:**
- Produces: `resolveSecureCookie(cookieNames: Iterable<string>, basePath?: string): boolean | undefined`; `export const HOST_LOGOUT_COOKIE = 'igrp.logout-at'`; `export const HOST_LOGOUT_COOKIE_MAX_AGE_S = 2_592_000`.

- [ ] **Step 1: Write the failing tests** in `cookies.test.ts`, inside `describe('resolveSecureCookie', …)`:

```ts
it('with a basePath, ignores another app\'s __Secure- cookie', () => {
  expect(
    resolveSecureCookie(['__Secure-next-auth.session-token~', 'next-auth.session-token.apps-a_p~'], '/apps/a'),
  ).toBe(false);
});
it('with a basePath, returns undefined when only foreign cookies are present', () => {
  expect(resolveSecureCookie(['__Secure-next-auth.session-token~'], '/apps/a')).toBeUndefined();
  expect(resolveSecureCookie(['next-auth.session-token.apps-hr-admin_p~'], '/apps/hr')).toBeUndefined();
});
it('with a basePath, detects its own chunked secure cookie', () => {
  expect(
    resolveSecureCookie(
      ['__Secure-next-auth.session-token.apps-a_p~.0', '__Secure-next-auth.session-token.apps-a_p~.1', 'next-auth.session-token~'],
      '/apps/a',
    ),
  ).toBe(true);
});
it('with an empty basePath, reads only the root app\'s terminated names', () => {
  expect(resolveSecureCookie(['next-auth.session-token~'], '')).toBe(false);
  expect(resolveSecureCookie(['__Secure-next-auth.session-token'], '')).toBeUndefined();
});
it('exports the host-logout cookie contract', () => {
  expect(HOST_LOGOUT_COOKIE).toBe('igrp.logout-at');
  expect(HOST_LOGOUT_COOKIE_MAX_AGE_S).toBe(2_592_000);
});
it('never sweeps the host-logout cookie', () => {
  expect(staleAuthCookies('/apps/a', [HOST_LOGOUT_COOKIE])).toEqual([]);
  expect(staleAuthCookies('', [HOST_LOGOUT_COOKIE], { sweepStockNames: true })).toEqual([]);
});
```

The existing `resolveSecureCookie` tests (no `basePath`) stay unchanged.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run src/__tests__/cookies.test.ts`
Expected: FAIL (the new cases; missing exports).

- [ ] **Step 3: Implement.** In `resolveSecureCookie`, when `basePath !== undefined`, count a name only if it starts with `sessionCookieName(basePath, true)` (→ `true`) or `sessionCookieName(basePath, false)` (→ plain). Otherwise keep today's logic. Add the two constants with a one-line comment pointing at the spec.

- [ ] **Step 4: Pass `basePath` from `config.ts`.** In `getTokenFromRequest` and `getAccessToken`, call `resolveSecureCookie(names, resolvedSessionCookieName ? basePath : undefined)`, so `cookieIsolation: 'none'` keeps the old detection.

- [ ] **Step 5: Update `secure-cookie-name.test.ts`.** `VALID_ENV` has no basePath, so the app writes root names. Change the three existing jars to own names: `__Secure-next-auth.session-token~`, `next-auth.session-token~`, and `__Secure-next-auth.session-token~.0`/`.1`. Expectations are unchanged. Add:

```ts
it('ignores the Center\'s __Secure- cookie in a basePath app', async () => {
  const auth = (await getFactory())({ env: { ...VALID_ENV, NEXT_PUBLIC_BASE_PATH: '/apps/a' } });
  cookieList = [
    { name: '__Secure-next-auth.session-token~', value: 'center' },
    { name: 'next-auth.session-token.apps-a_p~', value: 'own' },
  ];
  await auth.getAccessToken();
  expect(getTokenMock.mock.calls[0]?.[0]).toMatchObject({
    secureCookie: false,
    cookieName: 'next-auth.session-token.apps-a_p~',
  });
});
```

- [ ] **Step 6: Run the package suite**

Run: `pnpm --filter @igrp/framework-next-auth test`
Expected: PASS.

- [ ] **Step 7: Changeset and commit.** `.changeset/own-session-cookie-only.md`: `"@igrp/framework-next-auth": patch`, with one paragraph saying session-cookie scheme detection now looks only at the app's own cookie names, so another co-hosted app's `__Secure-` cookie can no longer send it into a login loop.

```bash
git add packages/framework/next-auth/src/cookies.ts packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/__tests__/cookies.test.ts packages/framework/next-auth/src/__tests__/secure-cookie-name.test.ts .changeset/own-session-cookie-only.md
git commit -m "fix(next-auth): detect the cookie scheme from this app's own session cookie"
```

### Task 2: `authTime` claim and `isEndedByHostLogout` (`framework-next-auth`)

**Files:**
- Modify: `packages/framework/next-auth/src/config.ts` (jwt callback sign-in branch `:1093-1106`; instance type next to `isTokenExpiredOrFailed` `:436`; implementation next to `:1492`; returned object `:1628`; a cookie-value reader next to `extractCookieNames` `:635`)
- Modify: `packages/framework/next-auth/src/jwt.ts`, `packages/framework/next-auth/src/types.ts` (both `JWT` shapes gain `authTime?: number`)
- Modify: `packages/framework/next-auth/src/__tests__/types-augmentation.type-check.ts` (add `authTime` to the JWT field check)
- Create: `packages/framework/next-auth/src/__tests__/host-logout.test.ts`
- Create: `.changeset/host-logout-signal.md`

**Interfaces:**
- Consumes: `HOST_LOGOUT_COOKIE` (Task 1).
- Produces: `JWT.authTime?: number` (unix seconds); instance method `isEndedByHostLogout: (token: JWT, request: unknown) => boolean`.

- [ ] **Step 1: Write the failing tests** in `host-logout.test.ts`. Use the `vi.mock('../oidc', …)` and `VALID_ENV` setup from `locale-claim.test.ts`, and `vi.useFakeTimers(); vi.setSystemTime(new Date(1_700_000_000_000))`.

```ts
const req = (value?: string) => ({
  cookies: {
    get: (n: string) => (n === 'igrp.logout-at' && value !== undefined ? { name: n, value } : undefined),
    getAll: () => [],
  },
});

it('stamps authTime in seconds at sign-in, silent sign-in included', async () => {
  const token = await jwt({ token: {}, account: ACCOUNT } as any);
  expect(token.authTime).toBe(1_700_000_000);
});
it('keeps authTime unchanged on a later call without account', async () => {
  const token = await jwt({ token: { ...validToken, authTime: 1_600_000_000 }, account: null } as any);
  expect(token.authTime).toBe(1_600_000_000);
});
it.each([
  [undefined, 1000, false],   // no signal
  ['1000', 999, true],        // signed in before the logout
  ['1000', 1000, true],       // same second → ended
  ['1000', 1001, false],      // signed in after the logout
  ['1000', undefined, true],  // legacy token with a signal
  ['abc', 999, false],        // malformed signal is ignored
])('logout-at %s, authTime %s → ended=%s', (cookie, authTime, ended) => {
  expect(auth.isEndedByHostLogout({ authTime } as JWT, req(cookie))).toBe(ended);
});
it('a legacy token without a signal is untouched', () => {
  expect(auth.isEndedByHostLogout({} as JWT, req())).toBe(false);
});
```

`validToken` is a managed token with `expiresAt` comfortably in the future (ms), so the callback returns without refreshing.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run src/__tests__/host-logout.test.ts`
Expected: FAIL (`authTime` undefined; `isEndedByHostLogout` is not a function).

- [ ] **Step 3: Implement.**
  - In the jwt callback's first `if (account)` block, add `authTime: Math.floor(Date.now() / 1000)`.
  - Add `extractCookieValue(request: unknown, name: string): string | undefined`, best-effort like `extractCookieNames`.
  - `isEndedByHostLogout` parses the value with `Number`, returns `false` when it is not a finite number, and otherwise returns `typeof token.authTime !== 'number' || token.authTime <= logoutAt`.
  - Add JSDoc on the instance type in the style of `isTokenExpiredOrFailed`, with the template middleware usage as `@example`.

- [ ] **Step 4: Run the package suite and typecheck**

Run: `pnpm --filter @igrp/framework-next-auth test && pnpm --filter @igrp/framework-next-auth typecheck`
Expected: PASS.

- [ ] **Step 5: Changeset and commit.** `.changeset/host-logout-signal.md`: `"@igrp/framework-next-auth": patch`. It covers the `authTime` claim, `isEndedByHostLogout`, and `HOST_LOGOUT_COOKIE` for ending co-hosted apps' sessions after a logout in the same browser.

```bash
git add packages/framework/next-auth/src .changeset/host-logout-signal.md
git commit -m "feat(next-auth): authTime claim and host-wide logout check"
```

### Task 3: Token recovery never reads a foreign cookie (`framework-next`)

**Files:**
- Modify: `packages/framework/next/src/lib/permissions.ts:80-114` (`scopedCookieNameOption`, `recoverAccessTokenFromCookies`)
- Test: `packages/framework/next/src/lib/__tests__/permissions-basepath-cookie.test.ts`
- Create: `.changeset/no-foreign-session-cookie.md`

**Interfaces:**
- Consumes: `resolveSecureCookie(names, basePath?)` (Task 1).
- Produces: nothing new; `igrpEnsureAccessClientConfig()` behaviour only.

- [ ] **Step 1: Build next-auth** so `next` resolves Task 1: `pnpm build:auth`.

- [ ] **Step 2: Write the failing tests** (append to the existing `describe`; the existing cases must keep passing):

```ts
it('refuses a jar holding only another app\'s cookie', async () => {
  process.env.NEXT_PUBLIC_BASE_PATH = '/apps/a';
  cookiesGetAll.mockReturnValue([{ name: 'next-auth.session-token~', value: 'center' }]);
  const config = await igrpEnsureAccessClientConfig();
  expect(getToken).not.toHaveBeenCalled();
  expect(config.token).toBe('');
});
it('still decodes chunked stock cookies (cookieIsolation: none)', async () => {
  cookiesGetAll.mockReturnValue([
    { name: 'next-auth.session-token.0', value: 'a' },
    { name: 'next-auth.session-token.1', value: 'b' },
  ]);
  await igrpEnsureAccessClientConfig();
  expect(getToken).toHaveBeenCalledTimes(1);
  expect(getToken.mock.calls[0]![0]).not.toHaveProperty('cookieName');
});
it('resolves its own scheme when the Center\'s __Secure- cookie is present', async () => {
  process.env.NEXT_PUBLIC_BASE_PATH = '/apps/a';
  cookiesGetAll.mockReturnValue([
    { name: '__Secure-next-auth.session-token~', value: 'center' },
    { name: 'next-auth.session-token.apps-a_p~.0', value: 'own0' },
    { name: 'next-auth.session-token.apps-a_p~.1', value: 'own1' },
  ]);
  await igrpEnsureAccessClientConfig();
  expect(getToken.mock.calls[0]![0]).toMatchObject({
    secureCookie: false,
    cookieName: 'next-auth.session-token.apps-a_p~',
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/lib/__tests__/permissions-basepath-cookie.test.ts`
Expected: the first and third new cases FAIL.

- [ ] **Step 4: Implement.**
  - Replace `scopedCookieNameOption` with `sessionCookieLookup(cookieNames: string[]): { cookieName?: string; secureCookie?: boolean } | null`.
  - First try this app's scoped names: `resolveSecureCookie(names, basePath)` decides the scheme, and the result is `{ cookieName, secureCookie }`.
  - Otherwise, when a name equals `SESSION_COOKIE_BASENAME` / `SECURE_SESSION_COOKIE_BASENAME` or matches `^<that>\.\d+$`, return `{ secureCookie }` from `resolveSecureCookie(names)`. That is the stock fallback, with no `cookieName`.
  - Otherwise return `null`.
  - `recoverAccessTokenFromCookies` returns `''` on `null` without calling `getToken`.
  - Update the doc comment's "decided from the jar" paragraph to name the exact-stock rule.

- [ ] **Step 5: Run the package suite**

Run: `pnpm --filter @igrp/framework-next test`
Expected: PASS.

- [ ] **Step 6: Changeset and commit.** `.changeset/no-foreign-session-cookie.md`: `"@igrp/framework-next": patch`. It says token recovery in Server Actions and Route Handlers no longer falls back to another co-hosted app's session cookie.

```bash
git add packages/framework/next/src/lib/permissions.ts packages/framework/next/src/lib/__tests__/permissions-basepath-cookie.test.ts .changeset/no-foreign-session-cookie.md
git commit -m "fix(next): token recovery reads only this app's session cookie"
```

### Task 4: AM 401 ends the session, 403 renders forbidden (`framework-next`)

**Files:**
- Create: `packages/framework/next/src/lib/access-auth-error.ts`
- Modify: `packages/framework/next/src/hooks/use-menus.ts:22-30`, `use-applications.ts` (both catch blocks), `use-user.ts:36-42`
- Test: `packages/framework/next/src/hooks/__tests__/redirect-sanitization.test.ts`, `packages/framework/next/src/actions/__tests__/session-gate.test.ts`
- Create: `.changeset/access-auth-errors.md`

**Interfaces:**
- Produces (internal, not exported from the root barrel): `igrpThrowOnAccessAuthError(error: unknown): Promise<void>`.
  - On an `ApiClientError` with status 401: logs `error.details?.error_description` at warn, then `redirect()`s to the session-ended target (Global Constraints).
  - On status 403: calls `forbidden()`.
  - Otherwise: returns.

- [ ] **Step 1: Update and extend the tests.** In `redirect-sanitization.test.ts`:
  - Add `forbidden` to the `next/navigation` mock (records the call and throws `NEXT_FORBIDDEN`).
  - Change every expected target to `'/login?reason=session_ended'` and the safe-path case to `'/login?reason=session_ended&callbackUrl=%2Fdashboard'`.
  - Add:

```ts
it.each([
  ['fetchMenus', () => fetchMenus('app'), getCurrentUserApplicationMenus],
  ['fetchAppsByUser', () => fetchAppsByUser(), getCurrentUserApplications],
  ['fetchAppByCode', () => fetchAppByCode('app'), getApplications],
  ['fetchCurrentUser', () => fetchCurrentUser(), getCurrentUser],
])('%s renders forbidden on 403 instead of redirecting', async (_n, call, mock) => {
  mock.mockRejectedValue(new ApiClientError(403));
  await expect(call()).rejects.toThrow('NEXT_FORBIDDEN');
  expect(forbidden).toHaveBeenCalledTimes(1);
  expect(redirect).not.toHaveBeenCalled();
});
it('still throws a 500 to the error boundary', async () => {
  getCurrentUserApplicationMenus.mockRejectedValue(new ApiClientError(500));
  await expect(fetchMenus('app')).rejects.toThrow('status 500');
  expect(redirect).not.toHaveBeenCalled();
  expect(forbidden).not.toHaveBeenCalled();
});
```

  In `session-gate.test.ts` (Review Focus), add a case: with a recovered token, `fetchMenusAction('app')` whose fetch rejects with 401 rejects with the redirect error. Change that file's `unstable_rethrow` mock for this case so it rethrows errors whose message starts with `NEXT_`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/hooks/__tests__/redirect-sanitization.test.ts src/actions/__tests__/session-gate.test.ts`
Expected: FAIL (old `/login` targets; no `forbidden`).

- [ ] **Step 3: Implement** `access-auth-error.ts`. It is `server-only`; it reads `x-current-path` from `headers()` and keeps `sanitizeRedirectUrl(…, undefined, '')` as today. Replace the four duplicated `if (… 401 || … 403) { … redirect(…) }` blocks with `await igrpThrowOnAccessAuthError(error);`, keeping each site's logger line and `throw error`.

- [ ] **Step 4: Run the package suite**

Run: `pnpm --filter @igrp/framework-next test`
Expected: PASS.

- [ ] **Step 5: Changeset and commit.** `.changeset/access-auth-errors.md`: `"@igrp/framework-next": patch`. A 401 from AM now redirects to `/login?reason=session_ended` so the app can clear its local session, and a 403 renders `forbidden()` instead of looping through sign-in.

```bash
git add packages/framework/next/src .changeset/access-auth-errors.md
git commit -m "fix(next): AM 401 ends the local session, 403 renders forbidden"
```

### Task 5: Marker cookies decide `Secure` from the page (template, fix 1)

**Files:**
- Modify: `templates/demo-v1/src/lib/logout-pending.ts`, `templates/demo-v1/src/lib/silent-sso.ts`

**Interfaces:**
- Consumes: `basePathCookiePath(basePath: string | undefined): string` from `@igrp/framework-next-auth/cookies`.

- [ ] **Step 1: Implement.**
  - In both files, `secureAttr()` returns `"; secure"` when `window.location.protocol === "https:"`, else `""`. Update its comment: the browser drops a `Secure` cookie set from an `http:` page, so `NODE_ENV` is the wrong signal.
  - Replace both `cookiePath()` functions with `basePathCookiePath(process.env.NEXT_PUBLIC_BASE_PATH)`.
  - Module scope stays Edge-safe: `window` is touched only inside the client-only functions.

- [ ] **Step 2: Verify**

Run: `pnpm build:auth && pnpm --filter @igrp/framework-next-template exec tsc --noEmit && pnpm --filter @igrp/framework-next-template lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add templates/demo-v1/src/lib/logout-pending.ts templates/demo-v1/src/lib/silent-sso.ts
git commit -m "fix(template): marker cookies take Secure from the page protocol"
```

### Task 6: `/login?reason=session_ended` clears this app's session (template)

**Files:**
- Create: `templates/demo-v1/src/app/(auth)/login/session-ended-completion.tsx`
- Modify: `templates/demo-v1/src/app/(auth)/login/page.tsx` (after the `LOGOUT_PENDING_COOKIE` check, before the silent-SSO decision)

**Interfaces:**
- Consumes: the redirect target from Task 4.
- Produces: `export function SessionEndedCompletion(): JSX.Element` (`"use client"`).

- [ ] **Step 1: Implement `SessionEndedCompletion`**, modelled on `logout-completion.tsx`:
  - Run once (same `useRef` guard).
  - `await signOut({ redirect: false })`, with errors reported through `reportError(error, { segment: "(auth)/login:session-ended" })`.
  - Then `window.location.replace(<same URL minus the reason param>)`: build it from `window.location.href`, delete `reason`, keep `callbackUrl`.
  - It must **not** call `markSilentSsoTried()` or touch the logout marker.
  - Render `IGRPTemplateLoading` with `t("signingOut")` from `useTranslations("auth")`.
- [ ] **Step 2: Wire the login page.** Read `reason` from `searchParams` and render `<SessionEndedCompletion />` when it equals `"session_ended"`.
- [ ] **Step 3: Verify**

Run: `pnpm --filter @igrp/framework-next-template exec tsc --noEmit && pnpm --filter @igrp/framework-next-template lint && pnpm --filter @igrp/framework-next-template lint:i18n`
Expected: no errors (no new literals).

- [ ] **Step 4: Commit**

```bash
git add "templates/demo-v1/src/app/(auth)/login"
git commit -m "feat(template): clear the local session on /login?reason=session_ended"
```

### Task 7: Host-wide logout signal, writer and reader (template)

**Files:**
- Modify: `templates/demo-v1/src/actions/igrp/auth.ts` (add `markHostLogout`)
- Modify: `templates/demo-v1/src/app/(auth)/login/logout-completion.tsx`, `templates/demo-v1/src/app/(auth)/logout/page.tsx` (no-IdP fallback branch, after `signOut`)
- Modify: `templates/demo-v1/src/middleware.ts` (`loginRedirect`, token check `:241-243`)

**Interfaces:**
- Consumes: `HOST_LOGOUT_COOKIE`, `HOST_LOGOUT_COOKIE_MAX_AGE_S` (Task 1); `auth.isEndedByHostLogout(token, request)` (Task 2); `igrpIsSecureRequest(headers)` from `@igrp/framework-next/i18n`.
- Produces: `export async function markHostLogout(): Promise<void>` (server action).

- [ ] **Step 1: Implement `markHostLogout`.**
  - It calls `(await cookies()).set(HOST_LOGOUT_COOKIE, String(Math.floor(Date.now() / 1000)), { path: "/", httpOnly: true, sameSite: "lax", secure: igrpIsSecureRequest(await headers()), maxAge: HOST_LOGOUT_COOKIE_MAX_AGE_S })`.
  - Return early under `isAuthBypass()`.
- [ ] **Step 2: Call it.**
  - In `LogoutCompletion`, after `signOut` and before `clearLogoutPending()`: `await markHostLogout().catch(reportError…)`. A failure must not block the reload.
  - In the logout page's fallback branch, the same call after `signOut`.
- [ ] **Step 3: Read it in middleware.**
  - `loginRedirect` gains an optional `reason?: "session_ended"`, which sets `loginUrl.searchParams.set("reason", reason)` before `callbackUrl`.
  - After the existing `!token || isTokenExpiredOrFailed` check, add `if (auth.isEndedByHostLogout(token, request)) return loginRedirect("session_ended");`.
  - `/login` is already a public path, so this cannot loop.
- [ ] **Step 4: Verify**

Run: `pnpm build:auth && pnpm build:next && pnpm --filter @igrp/framework-next-template exec tsc --noEmit && pnpm --filter @igrp/framework-next-template lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add templates/demo-v1/src/actions/igrp/auth.ts "templates/demo-v1/src/app/(auth)" templates/demo-v1/src/middleware.ts
git commit -m "feat(template): host-wide logout signal across co-hosted apps"
```

### Task 8: Migration 75 and Phase 1 verification

**Files:**
- Create: `packages/framework/template-migrator/migrations/demo-v1/75.MIGRATIONS-<DDMMYYYY>.md`
- Create: `packages/framework/template-migrator/migrations/demo-v1/payload/75/…` (one copy of each template file changed in Tasks 5–7)
- Modify: `templates/demo-v1/.igrp-migrations-lock.json` (via script)

- [ ] **Step 1: Write the migration.**
  - Frontmatter: `id: 75-multi-app-auth-sessions`, `requires: ["74-framework-next-beta14-i18n-deps"]`, `targetFrameworkVersion: null`.
  - Steps: `file.create` for `session-ended-completion.tsx`, and `file.write` `mode: replace` for every modified file, each `from: payload/75/<same path>`. Use the step shapes of migration 50.
  - Body sections "What changed" (table), "Why" and "After migrating", in migration 74's style.
  - "After migrating" tells apps that customised `login/page.tsx`, `logout-completion.tsx`, `logout/page.tsx` or `middleware.ts` to re-apply their changes.
  - The `deps.bump` to the released framework versions is added by the release workflow (`/release-framework`), as for migration 74.
- [ ] **Step 2: Sync the lock and check drift**

Run: `pnpm --filter @igrp/template-migrator sync:template-lock && pnpm --filter @igrp/template-migrator check:drift && pnpm --filter @igrp/template-migrator test`
Expected: PASS, drift clean.

- [ ] **Step 3: Full build and template checks**

Run: `pnpm build:framework && pnpm --filter @igrp/framework-next-auth test && pnpm --filter @igrp/framework-next test && pnpm --filter @igrp/framework-next-template exec tsc --noEmit && pnpm --filter @igrp/framework-next-template lint:i18n`
Expected: all PASS.

- [ ] **Step 4: Preview-mode smoke test.**
  - Start the template with `IGRP_PREVIEW_MODE=true` (preview tools, `launch.json` entry for the demo).
  - Confirm `/` renders and `/login` redirects to `/`: the bypass branch is untouched.
  - The full multi-app check (Center + two apps behind a proxy) is the spec's manual check, done by the user against the real IdP.
- [ ] **Step 5: Commit**

```bash
git add packages/framework/template-migrator/migrations/demo-v1 templates/demo-v1/.igrp-migrations-lock.json
git commit -m "feat(template-migrator): migration 75 multi-app auth sessions"
```

---

## Phase 2 (gated: AM client with `checkSession` published)

### Task 9: `igrpCheckAccessSession` and client bump (`framework-next`)

**Files:**
- Modify: `packages/framework/next/package.json`, `packages/framework/next-types/package.json` (client range → the published version)
- Modify: `packages/framework/next/src/lib/api-client.ts:38-45` (drop the `rotateSession` trap entry and its JSDoc bullet)
- Modify: `packages/framework/next/src/actions/index.ts` (add the action)
- Test: `packages/framework/next/src/lib/__tests__/api-client.test.ts`, create `packages/framework/next/src/actions/__tests__/check-access-session.test.ts`
- Create: `.changeset/check-access-session.md`

**Interfaces:**
- Produces: `export async function igrpCheckAccessSession(): Promise<{ valid: boolean; reason?: string }>` from `@igrp/framework-next/actions` (`'use server'` module).

- [ ] **Step 1: Write the failing tests** in `check-access-session.test.ts`, mocking the client the way `session-gate.test.ts` does:

```ts
it('returns valid:true under auth bypass without calling AM', …);           // IGRP_PREVIEW_MODE=true
it('returns { valid:false, reason } from checkSession', …);                  // { data: { valid: false, reason: 'USER_LOGOUT' } }
it('returns valid:true when AM times out (outage never signs out)', …);      // checkSession rejects ApiClientError status 0
it('returns valid:false, reason NO_SESSION when no token is recoverable', …);
```

  In `api-client.test.ts`, drop `rotateSession` from the trap test. It now asserts only the `closeSession` warning and pass-through.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/actions/__tests__/check-access-session.test.ts`
Expected: FAIL (action missing).

- [ ] **Step 3: Implement.**
  - `isIgrpAuthBypass()` → `{ valid: true }`.
  - `const { token } = await igrpEnsureAccessClientConfig()`; with no token → `{ valid: false, reason: 'NO_SESSION' }`.
  - Otherwise `igrpGetAccessClient().sessions.checkSession()` → `{ valid: data.valid, reason: data.reason ?? undefined }`.
  - Any thrown error → `{ valid: true }`, logged at warn.
  - Bump the client range in both manifests and run `pnpm install:deps`.
- [ ] **Step 4: Run the suite**

Run: `pnpm --filter @igrp/framework-next test && pnpm --filter @igrp/framework-next typecheck`
Expected: PASS.

- [ ] **Step 5: Changeset and commit.** `.changeset/check-access-session.md`: `"@igrp/framework-next": patch`, `"@igrp/framework-next-types": patch`.

```bash
git add packages/framework/next packages/framework/next-types/package.json pnpm-lock.yaml .changeset/check-access-session.md
git commit -m "feat(next): igrpCheckAccessSession server action"
```

### Task 10: Session watcher checks the AM session on focus (`next-ui` + `framework-next`)

**Files:**
- Modify: `packages/framework/next-ui/src/templates/session-watcher.tsx`, `packages/framework/next-ui/src/providers/nested.tsx`
- Modify: `packages/framework/next/src/layouts/igrp-root-layout.tsx:124`
- Test: create `packages/framework/next-ui/src/templates/__tests__/session-watcher-check.test.tsx`
- Create: `.changeset/session-watcher-focus-check.md`

**Interfaces:**
- Consumes: `igrpCheckAccessSession` (Task 9).
- Produces: `IGRPSessionWatcher({ children, checkSession?: () => Promise<{ valid: boolean; reason?: string }> })`; `IGRPNestedProvidersArgs.checkSession?` with the same type.

- [ ] **Step 1: Write the failing tests.** Mock `useSession` as `authenticated`, `usePathname` as `/dashboard`, and `useRouter`; use fake timers. Render the watcher with `checkSession`, then dispatch `visibilitychange` with `document.visibilityState = 'visible'`:

```ts
it('navigates to /login?reason=session_ended when the check says invalid', …);  // router.replace called with that path
it('does nothing when the check says valid', …);
it('checks at most once per 60 s', …);                                           // two events 10 s apart → 1 call; +60 s → 2
it('does not check on /login or /logout', …);
it('without checkSession it never calls anything', …);
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @igrp/framework-next-ui exec vitest run src/templates/__tests__/session-watcher-check.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement.**
  - Add a third `useEffect` in the watcher that listens to `visibilitychange`, throttled by a `useRef<number>` timestamp (60 000 ms).
  - Skip it when `AUTH_UI_PATH` matches or `status !== 'authenticated'`.
  - On `valid === false`, `router.replace('/login?reason=session_ended')`.
  - Thread `checkSession` through `IGRPNestedProviders`.
  - In `IGRPRootLayout`, import `igrpCheckAccessSession` from `../actions/index.js` and pass `checkSession={igrpCheckAccessSession}`.
- [ ] **Step 4: Build and run the suites**

Run: `pnpm build:framework && pnpm --filter @igrp/framework-next-ui test && pnpm --filter @igrp/framework-next test`
Expected: PASS.

- [ ] **Step 5: Changeset and commit.** `.changeset/session-watcher-focus-check.md`: `"@igrp/framework-next-ui": patch`, `"@igrp/framework-next": patch`.

```bash
git add packages/framework/next-ui/src packages/framework/next/src/layouts/igrp-root-layout.tsx .changeset/session-watcher-focus-check.md
git commit -m "feat(next-ui): check the AM session when a tab regains focus"
```
