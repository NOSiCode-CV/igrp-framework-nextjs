# Auth Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement four auth improvements: auto OIDC token revocation on logout, client-side forced logout on refresh failure, a Data Access Layer in demo-legacy, and README cleanup.

**Architecture:** Token revocation and client-side logout both live in `packages/framework/next-auth` (one in `config.ts` events, one in `client.ts`). The DAL is a new `src/lib/dal.ts` in `templates/demo-legacy` that wraps existing session helpers with `cache()`. README update is a docs-only change.

**Tech Stack:** NextAuth.js v4, React `cache()`, React `useEffect`, Vitest, pnpm workspaces, tsup

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `packages/framework/next-auth/README.md` | Modify | Remove stale Keycloak/Autentika docs, replace with current `igrp-auth` / `none` |
| `packages/framework/next-auth/src/config.ts` | Modify | Add `events.signOut` callback to call `revokeOidcSession()` non-blocking |
| `packages/framework/next-auth/src/client.ts` | Modify | Add `useEffect` to `useSafeSession()` to call `signOut()` when `forceLogout` is set |
| `packages/framework/next-auth/src/__tests__/config.test.ts` | Create | Vitest test verifying `events.signOut` calls revocation non-blocking |
| `templates/demo-legacy/src/lib/dal.ts` | Create | `verifySession()` (cached) + `getAuthenticatedUser()` (DTO) |
| `templates/demo-legacy/src/app/(igrp)/layout.tsx` | Modify | Replace manual session-null check with `verifySession()` from DAL |

---

## Task 1: Update README — Remove stale Keycloak/Autentika docs

**Files:**
- Modify: `packages/framework/next-auth/README.md`

- [ ] **Step 1: Read the current README**

Run: `cat packages/framework/next-auth/README.md`

- [ ] **Step 2: Rewrite the README**

Replace the full contents of `packages/framework/next-auth/README.md` with:

```markdown
# @igrp/framework-next-auth

NextAuth.js wrapper for the IGRP Framework. Provides a single `withIGRPAuth()` factory
that configures OIDC authentication, JWT session management, token refresh, and
route-protection middleware primitives.

## Entry points

| Import path | Runtime | Purpose |
|---|---|---|
| `@igrp/framework-next-auth/config` | Node + Edge | `withIGRPAuth()` factory |
| `@igrp/framework-next-auth/client` | Browser | `useSafeSession()`, `signIn`, `signOut`, `SessionProvider` |
| `@igrp/framework-next-auth/server` | Node | `getServerSession` |
| `@igrp/framework-next-auth/session` | Node | Session types |
| `@igrp/framework-next-auth/jwt` | Node | JWT types |
| `@igrp/framework-next-auth/middleware` | Edge | NextAuth middleware |
| `@igrp/framework-next-auth/oidc` | Node | `refreshOidcAccessToken`, `revokeOidcSession` |
| `@igrp/framework-next-auth/providers` | Node | Provider registry helpers |
| `@igrp/framework-next-auth/sanitize` | Node + Edge | URL/redirect sanitization |
| `@igrp/framework-next-auth/types` | types only | Session/JWT module augmentation |

## Quick start

```ts
// src/lib/auth.ts
import { withIGRPAuth } from "@igrp/framework-next-auth/config";
import { redirect } from "next/navigation";

export const auth = withIGRPAuth({
  onSessionExpired: () => redirect("/logout"),
});

// src/app/api/auth/[...nextauth]/route.ts
export const { GET, POST } = auth;

// src/middleware.ts
export const { config } = auth;
```

## Environment variables

```bash
# Required
AUTH_PROVIDER=igrp-auth          # "igrp-auth" or "none" (disables auth)
IGRP_AUTH_CLIENT_ID=my-client
IGRP_AUTH_CLIENT_SECRET=my-secret
IGRP_AUTH_ISSUER=https://your-oidc-provider.example.com/realms/my-realm
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=some-random-secret

# Optional
IGRP_AUTH_SCOPES=openid profile email   # defaults to "openid"
NEXTAUTH_URL_INTERNAL=http://app:3000   # internal URL for server-to-server calls
IGRP_PREVIEW_MODE=true                  # bypass auth for local dev (no OIDC needed)
```

## Supported providers

| `AUTH_PROVIDER` value | Description |
|---|---|
| `igrp-auth` (default) | Generic OIDC — works with Keycloak, WSO2IS, or any OIDC-compliant provider |
| `none` | Disables authentication entirely |

The OIDC callback URL to register on your provider is:
`{NEXTAUTH_URL}/api/auth/callback/igrp-auth`

## Session shape

```ts
import type { Session } from "next-auth";

// Augmented fields (from @igrp/framework-next-auth/types):
session.accessToken    // OIDC access token
session.idToken        // OIDC ID token
session.authProviderId // "igrp-auth" | "none"
session.expiresAt      // Unix ms when access token expires
session.error          // "RefreshAccessTokenError" on failed refresh
session.forceLogout    // true when refresh has failed — client should signOut()
```

## License

MIT
```

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-auth/README.md
git commit -m "docs(next-auth): update README to document igrp-auth/none providers, remove stale Keycloak/Autentika references"
```

---

## Task 2: Add token revocation on logout (`config.ts`)

**Files:**
- Modify: `packages/framework/next-auth/src/config.ts`
- Create: `packages/framework/next-auth/src/__tests__/config.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/framework/next-auth/src/__tests__/config.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as oidcModule from '../oidc';

// Mock revokeOidcSession so tests don't make real HTTP calls
vi.mock('../oidc', async (importOriginal) => {
  const original = await importOriginal<typeof oidcModule>();
  return {
    ...original,
    revokeOidcSession: vi.fn().mockResolvedValue(undefined),
  };
});

// Lazy-import withIGRPAuth after mocks are set up
async function getFactory() {
  const { withIGRPAuth } = await import('../config');
  return withIGRPAuth;
}

const VALID_ENV = {
  AUTH_PROVIDER: 'igrp-auth',
  IGRP_AUTH_CLIENT_ID: 'test-client',
  IGRP_AUTH_CLIENT_SECRET: 'test-secret',
  IGRP_AUTH_ISSUER: 'http://localhost:9090',
  NEXTAUTH_SECRET: 'test-secret-key',
};

describe('withIGRPAuth — events.signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls revokeOidcSession with the token on signOut for JWT sessions', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const signOutEvent = instance.authOptions.events?.signOut;
    expect(signOutEvent).toBeDefined();

    const mockToken = {
      refreshToken: 'rt-abc123',
      accessToken: 'at-abc123',
      authProviderId: 'igrp-auth' as const,
    };

    await signOutEvent!({ token: mockToken } as any);

    // Give microtask queue a tick for the fire-and-forget promise
    await new Promise((r) => setTimeout(r, 0));

    expect(oidcModule.revokeOidcSession).toHaveBeenCalledWith(mockToken, VALID_ENV);
  });

  it('does not call revokeOidcSession when AUTH_PROVIDER=none', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { AUTH_PROVIDER: 'none' } });
    const signOutEvent = instance.authOptions.events?.signOut;

    await signOutEvent?.({ token: { refreshToken: 'rt-abc' } } as any);
    await new Promise((r) => setTimeout(r, 0));

    expect(oidcModule.revokeOidcSession).not.toHaveBeenCalled();
  });

  it('does not call revokeOidcSession in preview mode', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: { ...VALID_ENV, IGRP_PREVIEW_MODE: 'true' } });
    const signOutEvent = instance.authOptions.events?.signOut;

    await signOutEvent?.({ token: { refreshToken: 'rt-abc' } } as any);
    await new Promise((r) => setTimeout(r, 0));

    expect(oidcModule.revokeOidcSession).not.toHaveBeenCalled();
  });

  it('does not throw when revokeOidcSession rejects', async () => {
    vi.mocked(oidcModule.revokeOidcSession).mockRejectedValueOnce(new Error('network error'));

    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const signOutEvent = instance.authOptions.events?.signOut;

    await expect(
      signOutEvent!({ token: { refreshToken: 'rt-abc' } } as any),
    ).resolves.toBeUndefined();

    await new Promise((r) => setTimeout(r, 0));
    // No unhandled rejection — the fire-and-forget .catch() swallowed it
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/framework/next-auth && pnpm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: FAIL — `events.signOut` is undefined because the callback doesn't exist yet.

- [ ] **Step 3: Add `events.signOut` to `authOptions` in `config.ts`**

In `packages/framework/next-auth/src/config.ts`, locate the `authOptions` object (around line 408). After the `callbacks` block and before the closing `};`, add the `events` block:

```typescript
    // ── existing callbacks block ends here ──

    events: {
      async signOut(message) {
        // Skip revocation when auth is disabled or in preview mode — no real token exists.
        if (authIsDisabled || normalizePreviewMode(env)) return;

        // JWT sessions carry { token }; DB sessions carry { session }.
        // This package uses JWT sessions only, but guard defensively.
        const token = ('token' in message ? message.token : null) as JWT | null;
        if (!token) return;

        // Fire-and-forget: revocation failure (network error, provider doesn't support
        // RFC 7009, token already expired) must never block logout completing.
        void revokeOidcSession(token, env).catch(() => {
          // Intentionally swallowed — logout must always succeed.
        });
      },
    },
  };
```

The full `authOptions` object after the change should end with:

```typescript
  const authOptions: NextAuthOptions = {
    // ... providers, secret, pages, session, callbacks ...
    events: {
      async signOut(message) {
        if (authIsDisabled || normalizePreviewMode(env)) return;
        const token = ('token' in message ? message.token : null) as JWT | null;
        if (!token) return;
        void revokeOidcSession(token, env).catch(() => {});
      },
    },
  };
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd packages/framework/next-auth && pnpm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: all tests in `config.test.ts` PASS; all tests in `providers.test.ts` still PASS.

- [ ] **Step 5: Build and type-check**

```bash
cd packages/framework/next-auth && pnpm build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Create changeset**

From repo root:

```bash
pnpm changeset
```

When prompted:
- Select `@igrp/framework-next-auth`
- Select **patch**
- Summary: `Auto-revoke OIDC token on logout via events.signOut callback (non-blocking)`

- [ ] **Step 7: Commit**

```bash
git add packages/framework/next-auth/src/config.ts \
        packages/framework/next-auth/src/__tests__/config.test.ts \
        .changeset/
git commit -m "feat(next-auth): auto-revoke OIDC token on signOut via events callback"
```

---

## Task 3: Client-side forced logout on refresh failure (`client.ts`)

**Files:**
- Modify: `packages/framework/next-auth/src/client.ts`

> **Note:** The vitest config uses `environment: 'node'`, so React hook behavior (`useEffect`) cannot be tested with the existing setup. Verification is via TypeScript type-check and build only.

- [ ] **Step 1: Update `client.ts`**

Replace the full contents of `packages/framework/next-auth/src/client.ts` with:

```typescript
import { useSession as useSessionBase, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import type { Session } from './session';

export {
  AUTH_PROVIDER_IDS,
  IGRP_AUTH_PROVIDER_ID,
  NONE_PROVIDER_ID,
} from './providers';
export type { AuthProviderId } from './providers';

export {
  SessionProvider,
  type SessionProviderProps,
  useSession,
  signIn,
  signOut,
  getCsrfToken,
  getProviders,
  getSession,
} from 'next-auth/react';

export type { User } from 'next-auth';

export function useSafeSession() {
  const { data, status, update } = useSessionBase();
  const session: Session | null = data as Session | null;

  // When the server sets forceLogout (refresh token expired or failed),
  // the next session poll delivers it here. Sign out immediately so the
  // user is redirected to /login without needing to navigate.
  useEffect(() => {
    if (session?.forceLogout || session?.error === 'RefreshAccessTokenError') {
      void signOut({ callbackUrl: '/login' });
    }
  }, [session?.forceLogout, session?.error]);

  return { session, status, update };
}
```

- [ ] **Step 2: Build and type-check**

```bash
cd packages/framework/next-auth && pnpm build 2>&1 | tail -20
```

Expected: build succeeds. The `useEffect` and `signOut` imports should resolve cleanly — `react` and `next-auth/react` are both peer dependencies.

- [ ] **Step 3: Run all tests to confirm nothing regressed**

```bash
cd packages/framework/next-auth && pnpm test 2>&1 | tail -20
```

Expected: all existing tests pass.

- [ ] **Step 4: Create changeset**

From repo root:

```bash
pnpm changeset
```

When prompted:
- Select `@igrp/framework-next-auth`
- Select **patch**
- Summary: `useSafeSession() now calls signOut() immediately when forceLogout is set, eliminating the need for a navigation to trigger logout after refresh failure`

- [ ] **Step 5: Commit**

```bash
git add packages/framework/next-auth/src/client.ts .changeset/
git commit -m "feat(next-auth): force signOut in useSafeSession when forceLogout is detected"
```

---

## Task 4: Build updated framework packages

Before implementing the DAL (which lives in `demo-legacy` and consumes the framework), build the full framework chain so the template picks up the changes from Tasks 2 and 3.

- [ ] **Step 1: Build the full framework chain**

From repo root:

```bash
pnpm build:framework 2>&1 | tail -30
```

Expected: all packages in the chain build successfully in order:
`framework-next-auth → framework-next-types → design-system → framework-next-ui → framework-next`

- [ ] **Step 2: Verify the demo-legacy template compiles**

```bash
cd templates/demo-legacy && pnpm build 2>&1 | tail -20
```

Expected: Next.js build completes without TypeScript or module-resolution errors.

---

## Task 5: Data Access Layer in `demo-legacy`

**Files:**
- Create: `templates/demo-legacy/src/lib/dal.ts`
- Modify: `templates/demo-legacy/src/app/(igrp)/layout.tsx`

- [ ] **Step 1: Create `src/lib/dal.ts`**

Create `templates/demo-legacy/src/lib/dal.ts`:

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
    id: session.user?.id ?? "",
    name: session.user?.name ?? "",
    email: session.user?.email ?? "",
    accessToken: session.accessToken ?? "",
  };
}
```

- [ ] **Step 2: Update `src/app/(igrp)/layout.tsx` to use the DAL**

Replace the full contents of `templates/demo-legacy/src/app/(igrp)/layout.tsx` with:

```typescript
import { IGRPLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@igrp/template-config";

import { configLayout } from "@/actions/igrp/layout";
import { verifySession } from "@/lib/dal";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Auth enforcement: redirects to /login if unauthenticated, /logout if token expired.
  // React cache() ensures getSession() runs only once per request even if other
  // server components also call verifySession().
  await verifySession();

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
```

- [ ] **Step 3: Build `demo-legacy` to verify no type errors**

```bash
cd templates/demo-legacy && pnpm build 2>&1 | tail -20
```

Expected: Next.js build completes. No TypeScript errors about missing imports, type mismatches on `verifySession`, or `IGRPLayoutConfigArgs`.

- [ ] **Step 4: Verify preview mode works**

In `templates/demo-legacy/.env`, confirm `IGRP_PREVIEW_MODE=true` is set, then run the dev server:

```bash
cd templates/demo-legacy && pnpm dev
```

Navigate to `http://localhost:3000`. Expected: app renders the IGRP layout with the preview user ("Preview User") — no redirect to `/login`.

- [ ] **Step 5: Commit**

```bash
git add templates/demo-legacy/src/lib/dal.ts \
        templates/demo-legacy/src/app/"(igrp)"/layout.tsx
git commit -m "feat(demo-legacy): add Data Access Layer with verifySession() and getAuthenticatedUser()"
```

---

## Self-review checklist

- **Spec coverage:**
  - ✅ Improvement 1 (token revocation): Task 2 adds `events.signOut` to `config.ts`
  - ✅ Improvement 2 (DAL): Task 5 creates `dal.ts` and updates `(igrp)/layout.tsx`
  - ✅ Improvement 3 (stale docs): Task 1 rewrites `README.md`
  - ✅ Improvement 4 (client forced logout): Task 3 adds `useEffect` to `useSafeSession()`
- **Dependency order:** Task 4 builds the framework before Task 5 consumes it ✅
- **Changesets:** Tasks 2 and 3 each create a changeset (both patch) ✅
- **Preview mode preserved:** `verifySession()` returns stub session in bypass mode ✅
- **Non-blocking revocation:** `void promise.catch(() => {})` pattern ✅
- **No breaking changes:** All changes are additive ✅
