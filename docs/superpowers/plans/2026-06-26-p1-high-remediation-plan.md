# P1 (High) Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the three highest-severity findings from the 2026-06-26 monorepo deep review — the framework-layer open-redirect (backslash bypass), the unsanitized `x-current-path` → `callbackUrl` reflection in the framework hooks, and the template-migrator's irreversible partial application.

**Architecture:** Move the redirect-sanitization security floor *down* into `@igrp/framework-next-auth` (where every consumer imports it), then make `@igrp/framework-next`'s hooks consume the hardened sanitizer. Make the migrator's apply transactional by unwinding already-executed steps on a mid-migration failure.

**Tech Stack:** TypeScript 5.9, Vitest 4.1.9 (node env), tsup (next-auth) / SWC+Babel (next), Node ≥ 22, pnpm workspaces, changesets (pre-release `beta`, always `patch`).

## Global Constraints

- **pnpm only**, `engines.node >= 22`; internal deps are `workspace:*`.
- **Never edit `dist/`**; never import package internals — use documented subpath exports (`@igrp/framework-next-auth/sanitize`).
- **One `patch` changeset per publishable package change** (`.changeset/*.md`, type `patch` only — never `major`/`minor`).
- **Build in dependency order:** `next-auth → next-types → design-system → next-ui → next`. Tasks 1–2 (next-auth) must build before Task 3 (next) so the hooks compile against and receive the hardened sanitizer.
- **No publish.** This plan stages code + changesets and stops. Versioning/publishing is a separate authorized step.
- Lint: framework packages use ESLint + Prettier (the `build`/`release` scripts run `prettier --write` automatically).

## Per-package testing reality

| Package | Runner | Env | Test glob | Single-test command |
| --- | --- | --- | --- | --- |
| `framework-next-auth` | Vitest | node | `src/__tests__/**/*.test.ts` | `pnpm --filter @igrp/framework-next-auth exec vitest run <path> -t "<name>"` |
| `framework-next` | Vitest | node | `src/**/__tests__/**/*.test.ts` | `pnpm --filter @igrp/framework-next exec vitest run <path> -t "<name>"` |
| `template-migrator` | Vitest | node (real fs temp dirs) | `src/**/*.test.ts` | `pnpm --filter @igrp/template-migrator exec vitest run <path> -t "<name>"` |

`vitest` `globals` is **not** enabled — every test file must `import { describe, it, expect, vi } from "vitest"`.

## File map

| File | Action | Responsibility |
| --- | --- | --- |
| `packages/framework/next-auth/src/sanitize.ts` | Modify | Harden `sanitizeRedirectUrl`: reject backslashes (raw + percent-encoded), segment-based `..` traversal check |
| `packages/framework/next-auth/src/__tests__/sanitize.test.ts` | Create | First direct unit tests for the sanitizer |
| `packages/framework/next-auth/src/config.ts` | Modify | Redirect callback's relative branch delegates to the hardened sanitizer |
| `packages/framework/next-auth/src/__tests__/config.test.ts` | Modify | Add backslash/traversal cases to the `callbacks.redirect` describe block |
| `packages/framework/next/src/hooks/use-menus.ts` | Modify | Sanitize `x-current-path` before reflecting into `/login?callbackUrl=` |
| `packages/framework/next/src/hooks/use-applications.ts` | Modify | Same, two call sites |
| `packages/framework/next/src/hooks/use-user.ts` | Modify | Same |
| `packages/framework/next/src/hooks/__tests__/redirect-sanitization.test.ts` | Create | Asserts the three hooks reject off-origin `x-current-path` |
| `packages/template-migrator/src/commands/apply.ts` | Modify | Unwind executed steps on mid-migration failure |
| `packages/template-migrator/src/__tests__/apply-command.test.ts` | Modify | Add the partial-apply rollback test |
| `.changeset/p1-next-auth-redirect-hardening.md` | Create | `patch` changeset for next-auth |
| `.changeset/p1-next-hooks-callbackurl-sanitize.md` | Create | `patch` changeset for next |
| `.changeset/p1-migrator-transactional-apply.md` | Create | `patch` changeset for template-migrator |

---

## Task 1: Harden `sanitizeRedirectUrl` (next-auth)

**Files:**
- Modify: `packages/framework/next-auth/src/sanitize.ts:21-55`
- Test: `packages/framework/next-auth/src/__tests__/sanitize.test.ts` (new)

**Interfaces:**
- Produces: `sanitizeRedirectUrl(url: string | null | undefined, baseOrigin?: string, fallback = '/'): string` — unchanged signature; stricter behavior. Relative input returns the relative path; off-origin/backslash/traversal returns `fallback`.

**Current code (verbatim, `sanitize.ts:21-55`):**
```ts
export function sanitizeRedirectUrl(
  url: string | null | undefined,
  baseOrigin?: string,
  fallback = '/',
): string {
  if (url == null || typeof url !== 'string') return fallback;

  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_REDIRECT_LENGTH) return fallback;
  if (DANGEROUS_PROTOCOLS.test(trimmed)) return fallback;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    const path = trimmed.split('?')[0];
    if (path.includes('..')) return fallback;
    return trimmed;
  }

  if (baseOrigin) {
    try {
      const parsed = new URL(trimmed);
      const base = new URL(baseOrigin);
      if (
        parsed.origin === base.origin &&
        parsed.protocol === base.protocol &&
        parsed.hostname === base.hostname
      ) {
        return parsed.pathname + parsed.search;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}
```

- [ ] **Step 1: Write the failing tests**

Create `packages/framework/next-auth/src/__tests__/sanitize.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sanitizeRedirectUrl } from '../sanitize';

describe('sanitizeRedirectUrl — open-redirect hardening', () => {
  const ORIGIN = 'http://localhost:3000';

  it('rejects a leading backslash (protocol-relative bypass)', () => {
    expect(sanitizeRedirectUrl('/\\evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects a percent-encoded backslash bypass', () => {
    expect(sanitizeRedirectUrl('/%5Cevil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects a mixed slash-backslash bypass', () => {
    expect(sanitizeRedirectUrl('/\\/evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects a path-traversal segment', () => {
    expect(sanitizeRedirectUrl('/a/../../etc', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects an encoded path-traversal segment', () => {
    expect(sanitizeRedirectUrl('/a/%2e%2e/etc', ORIGIN, '/safe')).toBe('/safe');
  });

  it('still rejects protocol-relative //', () => {
    expect(sanitizeRedirectUrl('//evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('allows a normal relative path', () => {
    expect(sanitizeRedirectUrl('/dashboard', ORIGIN, '/safe')).toBe('/dashboard');
  });

  it('preserves a query string on a relative path', () => {
    expect(sanitizeRedirectUrl('/list?tab=open', ORIGIN, '/safe')).toBe('/list?tab=open');
  });

  it('allows a non-traversal value with .. inside a query', () => {
    expect(sanitizeRedirectUrl('/range?d=1..10', ORIGIN, '/safe')).toBe('/range?d=1..10');
  });

  it('allows a same-origin absolute URL (returns path+search)', () => {
    expect(sanitizeRedirectUrl('http://localhost:3000/x?a=1', ORIGIN, '/safe')).toBe('/x?a=1');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run src/__tests__/sanitize.test.ts`
Expected: FAIL — the backslash cases return `/\evil.com`/`/%5Cevil.com` instead of `/safe`, and `/a/%2e%2e/etc` is currently allowed; `/range?d=1..10` may pass already.

- [ ] **Step 3: Implement the hardening**

Replace `sanitize.ts:31-36` (the protocol check + relative branch) with backslash rejection and a segment-based traversal check. The new body of `sanitizeRedirectUrl` from the `DANGEROUS_PROTOCOLS` line through the relative branch:
```ts
  if (DANGEROUS_PROTOCOLS.test(trimmed)) return fallback;

  // Reject backslashes, raw or percent-encoded. A browser normalizes a leading
  // "/\" to "//", turning it into a protocol-relative off-origin redirect that
  // the "//" check below would otherwise miss.
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // Malformed escape sequence — keep the raw value and let the checks below run.
  }
  if (trimmed.includes('\\') || decoded.includes('\\')) return fallback;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    // Reject path traversal by segment (on the decoded path, ignoring query/hash),
    // so "/a/../b" and "/a/%2e%2e/b" are rejected while "/file..name" and a ".."
    // inside a query value are allowed.
    const pathOnly = decoded.split('?')[0].split('#')[0];
    if (pathOnly.split('/').some((segment) => segment === '..')) return fallback;
    return trimmed;
  }
```
Leave the `baseOrigin` absolute-URL branch (lines 38-52) and the final `return fallback` unchanged.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run src/__tests__/sanitize.test.ts`
Expected: PASS (10 passing).

- [ ] **Step 5: Run the full next-auth suite (no regressions)**

Run: `pnpm --filter @igrp/framework-next-auth test`
Expected: PASS — all existing files (`config.test.ts`, `oidc.test.ts`, …) still green.

- [ ] **Step 6: Commit**
```bash
git add packages/framework/next-auth/src/sanitize.ts packages/framework/next-auth/src/__tests__/sanitize.test.ts
git commit -m "$(cat <<'EOF'
fix(next-auth): reject backslash + traversal in sanitizeRedirectUrl

Closes the open-redirect bypass where /\evil.com (and %5C-encoded /
mixed slash-backslash) passed the relative-path guard. Adds segment-based
traversal detection on the decoded path.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Redirect callback delegates to the hardened sanitizer (next-auth)

**Files:**
- Modify: `packages/framework/next-auth/src/config.ts:659-663`
- Test: `packages/framework/next-auth/src/__tests__/config.test.ts:366-380` (add cases)

**Interfaces:**
- Consumes: `sanitizeRedirectUrl` (Task 1) — already imported at `config.ts:44`.
- Produces: redirect callback returns an **absolute** same-origin URL or `home`; relative inputs are validated through the sanitizer then re-prefixed with `baseUrl` (preserving the absolute-URL contract NextAuth expects).

**Current code (verbatim, `config.ts:659-671`):**
```ts
        // Relative same-origin path (e.g. "/some/page") — resolve against baseUrl.
        // Protocol-relative ("//evil.com/…") is rejected as an open-redirect vector.
        if (url.startsWith('/') && !url.startsWith('//')) {
          return `${baseUrl}${url}`;
        }

        // Absolute URL — only honor when it matches the app origin.
        try {
          if (new URL(url).origin === new URL(baseUrl).origin) return url;
        } catch {
          // fall through to home
        }
        return home;
```

> **Why not full delegation:** `sanitizeRedirectUrl` returns a *relative* path for relative input and `pathname + search` for absolute input. `baseUrl` here includes the app basePath (e.g. `http://localhost:3000/apps/template`). Prefixing `baseUrl` onto a sanitized *absolute* result would double the basePath. So only the **relative** branch delegates (then re-prefixes `baseUrl`); the absolute branch keeps its origin-equality check.

- [ ] **Step 1: Write the failing tests**

In `packages/framework/next-auth/src/__tests__/config.test.ts`, inside the existing `describe('withIGRPAuth — callbacks.redirect', …)` block (after the `'rejects cross-origin absolute URLs'` test at line ~380), add:
```ts
  it('rejects a backslash protocol-relative bypass (open-redirect guard)', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '/\\evil.com', baseUrl: APP_BASE });
    expect(result).toBe(
      `${REDIRECT_ENV.NEXTAUTH_URL_INTERNAL}${REDIRECT_ENV.NEXT_PUBLIC_IGRP_APP_HOME_SLUG}`,
    );
  });

  it('rejects a path-traversal callbackUrl', async () => {
    const redirect = await getRedirect();
    const result = await redirect({ url: '/a/../../admin', baseUrl: APP_BASE });
    expect(result).toBe(
      `${REDIRECT_ENV.NEXTAUTH_URL_INTERNAL}${REDIRECT_ENV.NEXT_PUBLIC_IGRP_APP_HOME_SLUG}`,
    );
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run src/__tests__/config.test.ts -t "backslash protocol-relative bypass"`
Expected: FAIL — current callback returns `${APP_BASE}/\evil.com`.

- [ ] **Step 3: Implement the delegation**

Replace `config.ts:659-663` (the relative branch) with:
```ts
        // Relative same-origin path (e.g. "/some/page") — validate through the
        // shared sanitizer (rejects "//", "/\", %5C, and "/../" traversal), then
        // resolve against baseUrl. sanitizeRedirectUrl returns the relative path
        // for relative input, so re-prefix baseUrl to honor NextAuth's
        // absolute-URL redirect contract.
        if (url.startsWith('/') && !url.startsWith('//')) {
          const safe = sanitizeRedirectUrl(url, baseUrl, '');
          if (safe && safe.startsWith('/')) return `${baseUrl}${safe}`;
          return home;
        }
```
Leave the absolute-URL branch (lines 665-671) unchanged.

- [ ] **Step 4: Run the redirect tests to verify they pass**

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run src/__tests__/config.test.ts -t "callbacks.redirect"`
Expected: PASS — the two new cases plus all pre-existing redirect cases (relative resolution, query preservation, same-origin absolute, `//` rejection, cross-origin rejection) green.

- [ ] **Step 5: Run the full next-auth suite + build**

Run: `pnpm --filter @igrp/framework-next-auth test && pnpm build:auth`
Expected: PASS; tsup build emits `dist/sanitize.js` + `dist/config.js` with no errors.

- [ ] **Step 6: Create the changeset and commit**

Create `.changeset/p1-next-auth-redirect-hardening.md`:
```md
---
"@igrp/framework-next-auth": patch
---

Harden redirect sanitization: reject backslash (raw and %5C-encoded) and
path-traversal vectors in `sanitizeRedirectUrl`, and route the NextAuth
`redirect` callback's relative-path branch through it. Closes a
protocol-relative open-redirect (`/\evil.com`) at the framework layer.
```
```bash
git add packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/__tests__/config.test.ts .changeset/p1-next-auth-redirect-hardening.md
git commit -m "$(cat <<'EOF'
fix(next-auth): route redirect callback through hardened sanitizer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Sanitize `x-current-path` in the framework hooks (next)

**Files:**
- Modify: `packages/framework/next/src/hooks/use-menus.ts:53-55`
- Modify: `packages/framework/next/src/hooks/use-applications.ts:68-70` and `:87-89`
- Modify: `packages/framework/next/src/hooks/use-user.ts:34-36`
- Test: `packages/framework/next/src/hooks/__tests__/redirect-sanitization.test.ts` (new)

**Interfaces:**
- Consumes: `sanitizeRedirectUrl` from `@igrp/framework-next-auth/sanitize` (hardened in Tasks 1–2). `@igrp/framework-next` already depends on `@igrp/framework-next-auth` (`workspace:*`).

**Prerequisite:** Build next-auth first so `dist/sanitize.js` carries the hardened version: `pnpm build:auth`.

**Current pattern (verbatim — identical in all four catch blocks, e.g. `use-menus.ts:52-56`):**
```ts
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      const h = await headers();
      const callbackUrl = h.get('x-current-path');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
```

- [ ] **Step 1: Write the failing test**

Create `packages/framework/next/src/hooks/__tests__/redirect-sanitization.test.ts`. It mocks `next/headers`, `next/navigation`, `next/cache`, `react`, and the AM SDK (with a throwable `ApiClientError`), forces a 401, and asserts the `redirect()` target:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Throwable ApiClientError with a status, plus a client whose call rejects 401.
class ApiClientError extends Error {
  status: number;
  constructor(status: number) {
    super(`status ${status}`);
    this.status = status;
  }
}
const getCurrentUserApplicationMenus = vi.fn();
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  ApiClientError,
  AccessManagementClient: {
    create: () => ({ users: { getCurrentUserApplicationMenus } }),
  },
}));

// Capture redirect() targets (redirect throws NEXT_REDIRECT in Next; here we
// record + throw so control flow matches production).
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock('next/navigation', () => ({ redirect }));

const headerStore = new Map<string, string>();
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => headerStore.get(k) ?? null }),
}));

// unstable_cache returns the fn unchanged so the wrapped call runs inline.
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: <T,>(fn: T) => fn };
});

const { fetchMenus } = await import('../use-menus');

describe('framework hooks sanitize x-current-path before /login redirect', () => {
  beforeEach(() => {
    headerStore.clear();
    redirect.mockClear();
    getCurrentUserApplicationMenus.mockReset();
    getCurrentUserApplicationMenus.mockRejectedValue(new ApiClientError(401));
  });

  it('drops an off-origin x-current-path (no callbackUrl)', async () => {
    headerStore.set('x-current-path', 'https://evil.com/steal');
    await expect(fetchMenus('app')).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('keeps a safe relative x-current-path as callbackUrl', async () => {
    headerStore.set('x-current-path', '/dashboard');
    await expect(fetchMenus('app')).rejects.toThrow(
      'NEXT_REDIRECT:/login?callbackUrl=%2Fdashboard',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/hooks/__tests__/redirect-sanitization.test.ts`
Expected: FAIL — the off-origin case currently redirects to `/login?callbackUrl=https%3A%2F%2Fevil.com%2Fsteal`, not `/login`.

- [ ] **Step 3: Implement — `use-menus.ts`**

Add the import at the top of `use-menus.ts` (after line 6):
```ts
import { sanitizeRedirectUrl } from '@igrp/framework-next-auth/sanitize';
```
Replace the two header lines (`use-menus.ts:54-55`) with:
```ts
      const callbackUrl = sanitizeRedirectUrl(h.get('x-current-path'), undefined, '');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
```
(With no `baseOrigin`, an absolute/backslash/`//` value falls through to the `''` fallback → bare `/login`; a safe relative path is preserved.)

- [ ] **Step 4: Implement — `use-applications.ts` and `use-user.ts`**

Add the same import to both files. In `use-applications.ts`, apply the identical two-line replacement at **both** catch blocks (`:69-70` and `:88-89`). In `use-user.ts`, apply it at `:35-36`.

- [ ] **Step 5: Run the test to verify it passes + build**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/hooks/__tests__/redirect-sanitization.test.ts`
Expected: PASS (2 passing).
Run: `pnpm build:auth && pnpm build:next`
Expected: both build clean (next compiles against the freshly built next-auth `dist/`).

- [ ] **Step 6: Create the changeset and commit**

Create `.changeset/p1-next-hooks-callbackurl-sanitize.md`:
```md
---
"@igrp/framework-next": patch
---

Sanitize the client-controlled `x-current-path` header through
`sanitizeRedirectUrl` before reflecting it into the `/login?callbackUrl=`
redirect in `fetchMenus`, `fetchAppsByUser`, `fetchAppByCode`, and
`fetchCurrentUser`. Prevents an open-redirect when a consumer's login page
trusts the framework-built callbackUrl.
```
```bash
git add packages/framework/next/src/hooks/ .changeset/p1-next-hooks-callbackurl-sanitize.md
git commit -m "$(cat <<'EOF'
fix(next): sanitize x-current-path before /login callbackUrl redirect

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Transactional apply — unwind on failure (template-migrator)

**Files:**
- Modify: `packages/template-migrator/src/commands/apply.ts:1-2` (imports), `:77-81` (catch block)
- Test: `packages/template-migrator/src/__tests__/apply-command.test.ts` (add a describe block)

**Interfaces:**
- Consumes: `executeStep(step, appRoot, payloadDir)` (`../apply.js`), the in-loop `undoSteps`/`undoPayloads` already built at `apply.ts:46-74`.
- Produces: on a mid-migration throw, disk is restored to its pre-migration state and **no lock entry is written**, so a re-run captures a correct undo baseline.

**Current catch block (verbatim, `commands/apply.ts:77-81`):**
```ts
    } catch (err) {
      console.error(`  ✗ Error: ${(err as Error).message}`);
      console.error("  Migration aborted. Run again to resume.");
      return;
    }
```

**Bug recap:** `undoPayloads[path]` is captured *before* each `executeStep` (apply.ts:58-71), but the lock entry is written only *after* the full loop (apply.ts:92-93). On a mid-loop throw the in-memory undo state is discarded with files already mutated; a re-run re-captures the baseline from the now-migrated file, so a later rollback restores the wrong content.

- [ ] **Step 1: Write the failing test**

Append to `packages/template-migrator/src/__tests__/apply-command.test.ts` a new describe block. It builds a two-step migration whose **second** step copies from a non-existent payload (so `copyFileSync` throws ENOENT mid-loop), then asserts the first file was restored and no lock entry was written:
```ts
describe("apply rolls back already-executed steps on mid-migration failure", () => {
  it("restores the overwritten file and writes no lock entry when a later step throws", async () => {
    writeFileAt(appRoot, "src/a.ts", "ORIGINAL A\n");
    writeFileAt(payloadDir, "30/src/a.ts", "MIGRATED A\n");
    // NOTE: payload 30/src/b.ts is intentionally NOT written → step 2 throws ENOENT.

    manifestRef.current = {
      version: 1,
      cliVersion: "test",
      template: "demo-v1",
      migrations: [
        {
          id: "30-partial-fail",
          date: "2026-06-26",
          requires: [],
          targetFrameworkVersion: null,
          guideHref: "30.MIGRATIONS-26062026.md",
          contentHash: "30303030303030303",
          steps: [
            { type: "file.write", mode: "replace", path: "src/a.ts", from: "30/src/a.ts" },
            { type: "file.write", mode: "replace", path: "src/b.ts", from: "30/src/b.ts" },
          ],
        },
      ],
    };

    await apply(appRoot, { yes: true, payloadDir });

    // Step 1's file was unwound back to its true pre-migration content.
    expect(readFileSync(join(appRoot, "src/a.ts"), "utf8")).toBe("ORIGINAL A\n");
    // No lock entry — migration is still pending, so a re-run re-baselines cleanly.
    expect(readLock(appRoot).applied).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @igrp/template-migrator exec vitest run src/__tests__/apply-command.test.ts -t "restores the overwritten file"`
Expected: FAIL — `src/a.ts` currently reads `"MIGRATED A\n"` (left mutated; not unwound).

- [ ] **Step 3: Implement the unwind**

Update the imports at the top of `commands/apply.ts`. Change line 2-3 from:
```ts
import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
```
to:
```ts
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, join } from "path";
```
Replace the catch block (`apply.ts:77-81`) with:
```ts
    } catch (err) {
      console.error(`  ✗ Error: ${(err as Error).message}`);
      // Transactional unwind: reverse the steps that already ran THIS migration
      // so disk returns to its pre-migration state. Without this, a re-run
      // re-captures undo baselines from already-mutated files, silently
      // corrupting the recorded "original" content used by rollback.
      for (const undo of [...undoSteps].reverse()) {
        try {
          const undoRec = undo as { path?: string; from?: string; patch?: string };
          const isPlaceholder = undoRec.from === "__undo__" || undoRec.patch === "__undo__";
          if (isPlaceholder) {
            const p = undoRec.path;
            const content = p !== undefined ? undoPayloads[p] : undefined;
            if (p !== undefined && content !== undefined) {
              const dest = join(appRoot, p);
              mkdirSync(dirname(dest), { recursive: true });
              writeFileSync(dest, content, "utf8");
            }
          } else {
            executeStep(undo, appRoot, opts.payloadDir);
          }
        } catch (unwindErr) {
          console.error(`  ✗ Unwind step failed: ${(unwindErr as Error).message}`);
        }
      }
      console.error("  Migration aborted and rolled back. Fix the cause, then re-run.");
      return;
    }
```
(The placeholder restore mirrors `rollback.ts:70-82`; non-placeholder undos — `file.delete` for a freshly-created file, `deps.bump` with prior ranges — are replayed via `executeStep`.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @igrp/template-migrator exec vitest run src/__tests__/apply-command.test.ts -t "restores the overwritten file"`
Expected: PASS.

- [ ] **Step 5: Run the full migrator suite + build**

Run: `pnpm --filter @igrp/template-migrator test`
Expected: PASS — existing apply/rollback/lock/convert tests still green.
Run: `pnpm --filter @igrp/template-migrator build`
Expected: clean (prebuild pack + tsup + types). The `release` script's `check:drift` is unaffected (no migration content changed).

- [ ] **Step 6: Create the changeset and commit**

Create `.changeset/p1-migrator-transactional-apply.md`:
```md
---
"@igrp/template-migrator": patch
---

Make `apply` transactional: on a mid-migration step failure, unwind the
steps that already ran (restoring overwritten/deleted files from the
captured undo payloads) before aborting, instead of leaving files mutated
with no lock entry. Prevents a re-run from re-capturing a corrupted undo
baseline.
```
```bash
git add packages/template-migrator/src/commands/apply.ts packages/template-migrator/src/__tests__/apply-command.test.ts .changeset/p1-migrator-transactional-apply.md
git commit -m "$(cat <<'EOF'
fix(template-migrator): unwind executed steps on mid-migration failure

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Final verification (run before handing off P1)

- [ ] `pnpm --filter @igrp/framework-next-auth test` — green
- [ ] `pnpm --filter @igrp/framework-next test` — green
- [ ] `pnpm --filter @igrp/template-migrator test` — green
- [ ] `pnpm build:auth && pnpm build:next` — both clean (dependency order)
- [ ] `pnpm --filter @igrp/template-migrator build` — clean
- [ ] Three `patch` changesets exist under `.changeset/`
- [ ] No `dist/` files staged; no version bumps; nothing published

## Self-review notes

- **Spec coverage:** Task 1+2 = spec item 1 (backslash + traversal + delegation); Task 3 = item 2 (x-current-path); Task 4 = item 3 (partial apply). The P3 facets of item 1 (`config.ts:652` raw `home` concat = spec item 21) and the `..`-in-`sanitizePath` are deliberately out of P1 scope.
- **Behavior preserved:** Task 2 keeps the absolute-URL branch (avoids basePath duplication); existing redirect tests at `config.test.ts:339-380` must stay green — they assert the absolute-prefixed relative form this fix preserves.
- **Control-flow caveat (Task 3):** `redirect()` throws Next's `NEXT_REDIRECT`. The sanitize change sits before the `redirect()` call, not around it, so it does not swallow control-flow errors. (The broader error-swallowing policy is P2 item 5, intentionally not bundled here.)
