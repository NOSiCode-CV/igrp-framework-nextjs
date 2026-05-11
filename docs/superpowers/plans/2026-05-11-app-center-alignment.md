# igrp-application-center — Template Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `igrp-application-center` with the current `demo-legacy` template baseline — fixing auth enforcement, middleware gaps, dependency drift, and missing error infrastructure.

**Architecture:** Eight self-contained tasks ordered by severity. Each task touches one concern and can be committed independently. No task depends on a later one, though Task 3 (layout fix) depends on Task 2 (dal.ts) being done first.

**Tech Stack:** Next.js 15, React 19, NextAuth v4, `@igrp/framework-next@beta.128`, TypeScript, Biome (formatter/linter), pnpm.

**Working directory for all commands:** `D:\nosi-projects\igrp3\igrp-auth\frontend\igrp-application-center`

---

## File map

| File | Action | Task |
|------|--------|------|
| `package.json` | Modify — bump `@igrp/*` to `beta.128` | 1 |
| `pnpm-lock.yaml` | Auto-updated by pnpm install | 1 |
| `src/lib/dal.ts` | **Create** — `verifySession()` + `getAuthenticatedUser()` | 2 |
| `src/app/(igrp)/layout.tsx` | Modify — use `verifySession()`, drop inline auth check | 3 |
| `src/middleware.ts` | Modify — restore static-file regex | 4 |
| `package.json` | Modify — bump `zod` to `^4.4.3` | 5 |
| `src/lib/errors.ts` | **Create** — framework error re-exports + app error classes | 6 |
| `src/app/not-found.tsx` | **Create** — root 404 page | 7 |
| `src/app/[...not-found]/page.tsx` | **Delete** — replaced by not-found.tsx | 7 |
| `package.json` | Modify — remove redundant `next-themes` | 8 |

---

## Task 1: Bump `@igrp/*` packages to `beta.128`

**Finding 5 — High**

All `@igrp/*` packages are pinned to `0.1.0-beta.127`. `beta.128` ships the `React.cache` removal fix that resolves the "baseUrl is not configured" server action error.

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update all @igrp/* versions in package.json**

Open `package.json` and change every `"0.1.0-beta.127"` to `"0.1.0-beta.128"` in the `dependencies` block:

```json
"@igrp/framework-next": "0.1.0-beta.128",
"@igrp/framework-next-auth": "0.1.0-beta.128",
"@igrp/framework-next-types": "0.1.0-beta.128",
"@igrp/framework-next-ui": "0.1.0-beta.128",
"@igrp/igrp-framework-react-design-system": "0.1.0-beta.128",
```

- [ ] **Step 2: Install updated packages**

```powershell
pnpm install
```

Expected: lockfile updated, no resolution errors.

- [ ] **Step 3: Verify the installed version**

```powershell
pnpm list @igrp/framework-next
```

Expected output contains: `@igrp/framework-next 0.1.0-beta.128`

- [ ] **Step 4: Commit**

```powershell
git add package.json pnpm-lock.yaml
git commit -m "chore: bump @igrp/* packages to beta.128"
```

---

## Task 2: Create `src/lib/dal.ts`

**Finding 1 — High (part 1 of 2)**

The template centralises auth enforcement in a Data Access Layer (`lib/dal.ts`) using a `React.cache`-wrapped `verifySession()`. The app-center dropped this file and inlined a fragile header-inspection auth check in the IGRP layout. This task restores the DAL. Task 3 wires it into the layout.

**Files:**
- Create: `src/lib/dal.ts`

- [ ] **Step 1: Create `src/lib/dal.ts`**

```typescript
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { getSession } from "@/lib/auth";
import { isAuthBypass } from "@/lib/utils";

/**
 * Verifies the current request is authenticated.
 * Runs once per request regardless of how many server components call it (React cache).
 *
 * - In bypass mode (IGRP_PREVIEW_MODE or AUTH_PROVIDER=none): returns a stub session.
 * - Otherwise: calls getSession() which handles expired tokens (redirects to /logout).
 * - If no session exists: redirects to /login.
 */
export const verifySession = cache(async (): Promise<Session> => {
  if (isAuthBypass()) {
    return {
      user: { name: "Preview User", email: "preview@example.com" },
      accessToken: "preview-token",
      expires: "9999-12-31T23:59:59.999Z",
    } as unknown as Session;
  }

  const session = await getSession();
  if (!session) redirect("/login");
  return session;
});

/**
 * Returns only the user fields UI components need — never the raw JWT,
 * refresh token, or internal error flags.
 */
export async function getAuthenticatedUser() {
  const session = await verifySession();
  return {
    id: (session.user as { id?: string } | undefined)?.id ?? "",
    name: session.user?.name ?? "",
    email: session.user?.email ?? "",
    accessToken: (session as { accessToken?: string }).accessToken ?? "",
  };
}
```

- [ ] **Step 2: Verify it type-checks**

```powershell
pnpm exec tsc --noEmit
```

Expected: no errors relating to `src/lib/dal.ts`.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/dal.ts
git commit -m "feat: restore lib/dal.ts with verifySession and getAuthenticatedUser"
```

---

## Task 3: Fix `(igrp)/layout.tsx` to use `dal.ts`

**Finding 1 — High (part 2 of 2)**

The current IGRP layout reads request headers to detect if the user is already on `/login` before deciding to redirect — a fragile workaround. Replace the entire inline auth block with a single `verifySession()` call from the DAL created in Task 2.

**Files:**
- Modify: `src/app/(igrp)/layout.tsx`

**Current file (full):**
```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { configLayout } from "@/actions/igrp/layout";
import { QueryProvider } from "@/providers/query-provider";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const { session } = layoutConfig || {};
  const previewMode = process.env.IGRP_PREVIEW_MODE === "true";

  const headersList = await headers();
  const currentPath =
    headersList.get("x-pathname") ||
    headersList.get("x-next-url") ||
    headersList.get("referer") ||
    "";

  const baseUrl = process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL;
  const urlLogin = "/login";
  const loginPath = new URL(urlLogin || "/", baseUrl).pathname;
  const isAlreadyOnLogin = currentPath.startsWith(loginPath);

  if (!previewMode && !session && urlLogin && !isAlreadyOnLogin) {
    redirect(urlLogin);
  }

  return <QueryProvider>{children}</QueryProvider>;
}
```

- [ ] **Step 1: Replace `src/app/(igrp)/layout.tsx` with the cleaned version**

```tsx
import { verifySession } from "@/lib/dal";
import { QueryProvider } from "@/providers/query-provider";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await verifySession();
  return <QueryProvider>{children}</QueryProvider>;
}
```

`verifySession()` handles all three cases:
- Auth bypass (preview mode / AUTH_PROVIDER=none) → returns stub, no redirect
- Valid session → returns session, continues rendering
- No session / expired → redirects to `/login`

The `configLayout()` call is not needed here — it was only used to extract `session` for the inline auth check. The root layout (`src/app/layout.tsx`) already calls `configLayout()` for the IGRP config.

- [ ] **Step 2: Verify it type-checks**

```powershell
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start the dev server and verify auth flow**

```powershell
pnpm dev
```

Verify:
- Unauthenticated visit to `/` → redirected to `/login` ✓
- After login → IGRP layout renders correctly ✓
- With `IGRP_PREVIEW_MODE=true` in `.env` → no redirect, app renders with stub session ✓

- [ ] **Step 4: Commit**

```powershell
git add src/app/(igrp)/layout.tsx
git commit -m "fix: replace inline auth check in (igrp)/layout with verifySession from dal"
```

---

## Task 4: Restore static-file regex in middleware

**Finding 2 — Medium**

The template's `isPublicPath()` includes a file-extension regex (`/\.[^/]+$/`) as a safety net for static assets not covered by `STATIC_PREFIXES`. The app-center removed it. Any custom asset path (e.g. `/fonts/`, `/icons/`) could incorrectly trigger an auth redirect.

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add the regex check as the first guard in `isPublicPath()`**

Current function in `src/middleware.ts`:
```typescript
function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}
```

Replace with:
```typescript
function isPublicPath(pathname: string): boolean {
  if (/\.[^/]+$/.test(pathname)) return true;
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}
```

- [ ] **Step 2: Verify it type-checks**

```powershell
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add src/middleware.ts
git commit -m "fix: restore static-file extension regex in middleware isPublicPath"
```

---

## Task 5: Bump Zod to `^4.4.3`

**Finding 6 — Medium**

The app-center is on `zod ^4.1.12`. The template is on `^4.4.3`. Zod v4 had breaking changes to schema inference between minors. Any schema using newer inference features could behave differently.

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update zod version in package.json**

In the `dependencies` block, change:
```json
"zod": "^4.1.12",
```
to:
```json
"zod": "^4.4.3",
```

- [ ] **Step 2: Install and verify resolution**

```powershell
pnpm install
pnpm list zod
```

Expected: `zod 4.4.x` or higher.

- [ ] **Step 3: Type-check to surface any schema breakage**

```powershell
pnpm exec tsc --noEmit
```

If errors appear they will point to schema files under `src/features/*/` or `src/schemas/` that use types removed or renamed between `4.1` and `4.4`. Fix each individually — the errors will be self-descriptive.

- [ ] **Step 4: Start dev server and exercise schema-heavy pages**

```powershell
pnpm dev
```

Navigate to `/settings/applications`, `/settings/users`, and `/settings/departments` — these are the pages that use Zod form validation. Verify forms submit and validate without runtime errors.

- [ ] **Step 5: Commit**

```powershell
git add package.json pnpm-lock.yaml
git commit -m "chore: bump zod to ^4.4.3 to match template baseline"
```

---

## Task 6: Create `src/lib/errors.ts`

**Finding 10 — Medium**

The template provides `src/lib/errors.ts` — a central place for typed error helpers re-exported from the framework, plus app-specific error classes. The app-center dropped this file; layout-level framework errors surface as unhandled exceptions with no structured diagnosis.

**Files:**
- Create: `src/lib/errors.ts`

- [ ] **Step 1: Create `src/lib/errors.ts`**

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// Re-exports from @igrp/framework-next — keeps import paths stable if the
// framework entry point ever changes.
// ─────────────────────────────────────────────────────────────────────────────

export {
  AppError,
  PUBLIC_ERROR_DELIMITER,
  parsePublicDigest,
  getDisplayableErrorMessage,
  type PublicErrorId,
  type PublicErrorMessage,
} from "@igrp/framework-next/app-error";

export { logger } from "@igrp/framework-next/logger";

// ─────────────────────────────────────────────────────────────────────────────
// App-specific error classes — not framework concerns.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when required environment variables are missing or invalid.
 */
export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[] = [],
  ) {
    super(message);
    this.name = "EnvValidationError";
    Object.setPrototypeOf(this, EnvValidationError.prototype);
  }
}

/**
 * Thrown for authentication-related failures within the app.
 * For framework auth-config errors use `IgrpAuthConfigError` from
 * `@igrp/framework-next/errors` instead.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}
```

- [ ] **Step 2: Verify it type-checks**

```powershell
pnpm exec tsc --noEmit
```

Expected: no errors from `src/lib/errors.ts`.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/errors.ts
git commit -m "feat: restore lib/errors.ts with framework re-exports and app error classes"
```

---

## Task 7: Replace `[...not-found]` catch-all with `not-found.tsx`

**Finding 11 — Low**

`src/app/[...not-found]/page.tsx` is a catch-all route that just calls `notFound()`. This is roundabout — Next.js 15 handles unmatched routes natively via a `not-found.tsx` file at the app root. The catch-all creates an unnecessary dynamic segment and bypasses the idiomatic mechanism.

**Files:**
- Create: `src/app/not-found.tsx`
- Delete: `src/app/[...not-found]/page.tsx`

- [ ] **Step 1: Create `src/app/not-found.tsx`**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-foreground text-4xl font-bold">404</h1>
      <p className="text-muted-foreground text-lg">
        Página não encontrada
      </p>
      <Link
        href="/"
        className="text-primary underline-offset-4 hover:underline"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Delete the catch-all directory**

```powershell
Remove-Item -Recurse -Force "src/app/[...not-found]"
```

- [ ] **Step 3: Verify no broken references**

```powershell
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Start dev server and verify 404 behaviour**

```powershell
pnpm dev
```

Navigate to `/this-does-not-exist`. Expected: custom 404 page renders with "Página não encontrada" and a link back to home.

- [ ] **Step 5: Commit**

```powershell
git add src/app/not-found.tsx
git rm -r "src/app/[...not-found]"
git commit -m "fix: replace catch-all not-found route with idiomatic not-found.tsx"
```

---

## Task 8: Remove redundant `next-themes` dependency

**Finding 7 — Info**

`next-themes` is listed as a direct dependency, but `@igrp/framework-next-ui` already owns and re-exports it. Having it as a direct dep creates a risk of the two copies diverging on a future update.

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Check if next-themes is imported directly anywhere in the app**

```powershell
Select-String -Path "src/**" -Pattern "from 'next-themes'" -Recurse
Select-String -Path "src/**" -Pattern 'from "next-themes"' -Recurse
```

If any results appear, those imports come through `@igrp/framework-next-ui` re-exports — check what the re-exported symbol is and update the import path to `@igrp/framework-next-ui` before removing the dep.

If no results: proceed directly to Step 2.

- [ ] **Step 2: Remove next-themes from package.json**

In the `dependencies` block, delete the line:
```json
"next-themes": "^0.4.6",
```

- [ ] **Step 3: Reinstall and verify**

```powershell
pnpm install
pnpm exec tsc --noEmit
```

Expected: no missing-module errors for `next-themes`.

- [ ] **Step 4: Commit**

```powershell
git add package.json pnpm-lock.yaml
git commit -m "chore: remove redundant next-themes direct dependency"
```

---

## Findings with no code changes required

These findings from the audit are documented here for completeness. No action needed in the app-center.

**Finding 3 — `access-client.ts` pattern** (`src/actions/access-client.ts`)
The app-center's explicit `igrpSetAccessClientConfig()` call before `igrpGetAccessClient()` is correct. The framework caught up in `beta.128`. Keep as-is. Consider promoting this pattern to the template.

**Finding 8 — `ActionResult<T>`** (`src/actions/types.ts`)
Clean discriminated-union pattern for server action returns. No change needed — flag for adoption in the template.

**Finding 9 — `extractApiError()`** (`src/lib/utils.ts`)
Well-structured API error converter. Domain-specific to the access-management SDK. No change needed.

**Finding 4 — `QueryProvider` location**
After reviewing the actual code, `QueryProvider` already lives in `src/providers/query-provider.tsx` and is imported from there — not inlined. Scoping it to the `(igrp)` layout rather than the root layout is intentional: login/logout pages don't need React Query. No change needed.
