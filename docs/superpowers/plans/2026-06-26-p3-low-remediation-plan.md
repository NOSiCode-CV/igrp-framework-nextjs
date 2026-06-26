# P3 (Low) Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisite:** Implement P1 and P2 first. P3 Task 4 edits `use-applications.ts` as rewritten in P2; P3 Task 6 creates migration `22`, which `requires` P2's migration `21`.

**Goal:** Clear the fifteen low-severity findings from the 2026-06-26 deep review — correctness nits (date filter, chart negatives, env idempotency), cleanup (dead ternaries, dead cache), latent hardening (migration ordering, path containment, prereq enforcement, token validation, expires_in), and conventions (semantic tokens, unmemoized context).

**Architecture:** Grouped into six per-package tasks so each carries one `patch` changeset. Pure-logic fixes get real unit tests; `next-ui` (no runner) uses grep+build; `demo-v1` fixes ship as a `template-migrator` migration.

**Tech Stack:** TypeScript 5.9, Vitest (node / jsdom), React 19, tsup/SWC+Babel/tsc, Biome (demo-v1), Node ≥ 22, pnpm, changesets (`patch`).

## Global Constraints

- pnpm only; Node ≥ 22; `workspace:*`. Never edit `dist/`; subpath exports only. One `patch` changeset per publishable package; never `major`/`minor`.
- Build order `next-auth → next-types → design-system → next-ui → next`. No publish — stage code + changesets only.
- demo-v1 = Biome; every demo-v1 change ships as a migration (drift gate enforces parity). Vitest `globals` off — import test fns explicitly.

## Per-package verification reality

Same matrix as P2: `next-auth`/`next`/`template-migrator` = Vitest node; `design-system` = Vitest jsdom+RTL (pure-logic files test fine under it); `next-ui` = **no runner** → grep + `pnpm build:next-ui` + manual; `demo-v1` = migrator-applied test + `check:drift` + `pnpm build:demo`.

## File map

| File | Action | Item |
| --- | --- | --- |
| `packages/design-system/src/components/horizon/data-table/lib/filters-utils.ts` | Guard invalid dates | 12 |
| `packages/design-system/src/components/horizon/charts/lib.ts` | Negatives + dead ternaries | 13, 14 |
| `packages/design-system/.../data-table/lib/__tests__/filters-utils.test.ts` + `.../charts/__tests__/lib.test.ts` | Create | 12-14 |
| `packages/template-migrator/src/apply.ts` | env idempotency+remove, path guard | 15, 16 |
| `packages/template-migrator/src/types.ts` | Add `env.remove` step | 15 |
| `packages/template-migrator/src/migration-order.ts` | Create (numeric sort) | 17 |
| `packages/template-migrator/scripts/pack.ts` + `scripts/check-drift.ts` | Use numeric sort | 17 |
| `packages/template-migrator/src/commands/apply.ts` | Enforce `requires` | 18 |
| `packages/template-migrator/src/__tests__/*.test.ts` | Add tests | 15-18 |
| `packages/framework/next-auth/src/config.ts` | Normalize home join | 21 |
| `packages/framework/next-auth/src/oidc.ts` | Validate `expires_in` | 22 |
| `packages/framework/next/src/lib/api-client.ts` | Validate token | 23 |
| `packages/framework/next/src/hooks/use-applications.ts` | Exact code match | 24 |
| `packages/framework/next-ui/src/components/providers/active-theme.tsx` | `useMemo` context value | 25 |
| `packages/framework/next-ui/src/components/auths/carousel.tsx` | Tokens + `gap` | 26 |
| `packages/template-migrator/migrations/demo-v1/22.MIGRATIONS-26062026.md` + `payload/22/...` | Create | 19, 20 |
| `.changeset/p3-*.md` | Create (one per package) | all |

---

## Task 1: design-system pure-logic fixes (items 12, 13, 14)

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/lib/filters-utils.ts:14-25`
- Modify: `packages/design-system/src/components/horizon/charts/lib.ts:9-20` (item 13), `:22-41` (item 14)
- Test: `.../data-table/lib/__tests__/filters-utils.test.ts` + `.../charts/__tests__/lib.test.ts` (new)

These are pure exported functions (type-only imports) — testable under the jsdom vitest like `src/lib/color-utils.test.ts`.

- [ ] **Step 1: Write failing tests — date filter (item 12)**

Create `packages/design-system/src/components/horizon/data-table/lib/__tests__/filters-utils.test.ts`:
```ts
import { describe, it, expect } from "vitest"
import { IGRPDataTableDateRangeFilterFn } from "../filters-utils"

const row = (v: unknown) => ({ getValue: () => v }) as never

describe("IGRPDataTableDateRangeFilterFn", () => {
  it("includes an in-range ISO date", () => {
    expect(IGRPDataTableDateRangeFilterFn(row("2026-06-15"), "d", { from: "2026-06-01", to: "2026-06-30" })).toBe(true)
  })
  it("excludes an unparseable cell date without crashing (no silent total vanish)", () => {
    expect(IGRPDataTableDateRangeFilterFn(row("31/12/2026"), "d", { from: "2026-06-01", to: "2026-06-30" })).toBe(false)
  })
  it("does not filter when the filter bound is unparseable", () => {
    expect(IGRPDataTableDateRangeFilterFn(row("2026-06-15"), "d", { from: "not-a-date" })).toBe(true)
  })
})
```

- [ ] **Step 2: Run → fail**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/components/horizon/data-table/lib/__tests__/filters-utils.test.ts`
Expected: FAIL — the unparseable-bound case currently returns `false` (Invalid Date comparison), not `true`.

- [ ] **Step 3: Implement (item 12)**

Replace `filters-utils.ts:16-24` (inside `IGRPDataTableDateRangeFilterFn`, after the `if (!filterValue || !filterValue.from) return true` guard):
```ts
  const cellValue = row.getValue(columnId) as string
  const date = new Date(cellValue)
  const start = new Date(filterValue.from)
  const end = filterValue.to ? new Date(filterValue.to) : undefined

  // Invalid filter bound → do not filter (show all). Invalid cell date → cannot
  // be "in range", so exclude. Prevents a misformatted column silently vanishing
  // with no error.
  if (Number.isNaN(start.getTime())) return true
  if (Number.isNaN(date.getTime())) return false
  if (end && !Number.isNaN(end.getTime())) {
    return date >= start && date <= end
  }
  return date >= start
```

- [ ] **Step 4: Write failing tests — charts (items 13, 14)**

Create `packages/design-system/src/components/horizon/charts/__tests__/lib.test.ts`:
```ts
import { describe, it, expect } from "vitest"
import { formatChartValue, getChartHeight, getChartWidth } from "../lib"

describe("formatChartValue", () => {
  it("abbreviates positive magnitudes", () => {
    expect(formatChartValue(2500000)).toBe("2.5M")
    expect(formatChartValue(2500)).toBe("2.5K")
  })
  it("abbreviates negative magnitudes with sign", () => {
    expect(formatChartValue(-2500000)).toBe("-2.5M")
    expect(formatChartValue(-2500)).toBe("-2.5K")
  })
})

describe("getChartHeight / getChartWidth honor an explicit 0", () => {
  it("returns an explicit numeric height of 0", () => {
    expect(getChartHeight("md", [], 0)).toBe(0)
  })
  it("returns an explicit numeric width of 0", () => {
    expect(getChartWidth(0)).toBe(0)
  })
  it("passes through a non-zero height", () => {
    expect(getChartHeight("md", [], 300)).toBe(300)
  })
})
```

- [ ] **Step 5: Run → fail**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/components/horizon/charts/__tests__/lib.test.ts`
Expected: FAIL — `formatChartValue(-2500000)` returns `"-2500000"`; `getChartHeight("md", [], 0)` returns the computed min height (0 treated as falsy).

- [ ] **Step 6: Implement (items 13 + 14)**

Replace `charts/lib.ts:14-19` (the body of `formatChartValue` after the `valueFormatter` guard):
```ts
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1000000) {
    return `${sign}${(abs / 1000000).toFixed(1)}M`
  } else if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(1)}K`
  }
  return value.toString()
```
Replace `charts/lib.ts:27` with: `  if (height != null) return height`
Replace `charts/lib.ts:39` with: `  if (width != null) return width`

- [ ] **Step 7: Run both → pass + build**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/components/horizon/data-table/lib/__tests__/filters-utils.test.ts src/components/horizon/charts/__tests__/lib.test.ts`
Expected: PASS.
Run: `pnpm build:ds` → clean.

- [ ] **Step 8: Changeset + commit**

Create `.changeset/p3-ds-charts-and-date-filter.md`:
```md
---
"@igrp/igrp-framework-react-design-system": patch
---

DataTable date-range filter guards invalid/unparseable dates instead of
silently dropping every row; `formatChartValue` abbreviates negative
magnitudes (`-2.5M`); `getChartHeight`/`getChartWidth` honor an explicit `0`
and drop their no-op ternaries.
```
```bash
git add packages/design-system/src/components/horizon/data-table/lib/filters-utils.ts packages/design-system/src/components/horizon/charts/lib.ts packages/design-system/src/components/horizon/data-table/lib/__tests__/ packages/design-system/src/components/horizon/charts/__tests__/ .changeset/p3-ds-charts-and-date-filter.md
git commit -m "$(cat <<'EOF'
fix(design-system): date-filter guard, negative chart values, 0 dims

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: template-migrator hardening (items 15, 16, 17, 18)

**Files:**
- Modify: `packages/template-migrator/src/apply.ts` (env idempotency + env.remove + path guard), `src/types.ts` (env.remove step), `src/commands/apply.ts` (requires)
- Create: `packages/template-migrator/src/migration-order.ts`
- Modify: `packages/template-migrator/scripts/pack.ts:61-63`, `scripts/check-drift.ts:78-80`
- Test: `src/__tests__/apply.test.ts`, `src/__tests__/apply-command.test.ts`, `src/__tests__/migration-order.test.ts` (new)

### Item 17 — numeric migration ordering (shared, testable)

- [ ] **Step 1: Write the failing test**

Create `packages/template-migrator/src/__tests__/migration-order.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { sortMigrationFiles } from "../migration-order";

describe("sortMigrationFiles", () => {
  it("orders by numeric prefix, not lexicographically", () => {
    const input = ["10.MIGRATIONS-x.md", "2.MIGRATIONS-x.md", "100.MIGRATIONS-x.md", "9.MIGRATIONS-x.md"];
    expect(sortMigrationFiles(input)).toEqual([
      "2.MIGRATIONS-x.md", "9.MIGRATIONS-x.md", "10.MIGRATIONS-x.md", "100.MIGRATIONS-x.md",
    ]);
  });
});
```

- [ ] **Step 2: Run → fail** (`sortMigrationFiles` does not exist)

Run: `pnpm --filter @igrp/template-migrator exec vitest run src/__tests__/migration-order.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the shared sorter**

Create `packages/template-migrator/src/migration-order.ts`:
```ts
/** Numeric-prefix sort for `NN.MIGRATIONS-*.md` files, so 9 < 10 < 100. */
export function sortMigrationFiles(files: string[]): string[] {
  return [...files].sort((a, b) => {
    const na = Number.parseInt(a, 10);
    const nb = Number.parseInt(b, 10);
    if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b);
    return na - nb;
  });
}
```
In `scripts/pack.ts`, replace lines 61-63:
```ts
  const files = sortMigrationFiles(
    readdirSync(MIGRATIONS_DIR).filter((f) => f.match(/^\d+\.MIGRATIONS.*\.md$/)),
  );
```
and add the import near the top: `import { sortMigrationFiles } from "../src/migration-order.js";`
Apply the identical replacement + import in `scripts/check-drift.ts` (lines 78-80). (`migration-order.ts` is imported only by build scripts, not by `src/index`/`src/cli`, so tsup does not bundle it into the published runtime.)

- [ ] **Step 4: Run → pass**

Run: `pnpm --filter @igrp/template-migrator exec vitest run src/__tests__/migration-order.test.ts` → PASS

### Item 16 — path containment guard

- [ ] **Step 5: Write the failing test**

Add to `src/__tests__/apply.test.ts`:
```ts
describe("executeStep refuses paths that escape the app root", () => {
  it("throws on a traversal path", () => {
    expect(() =>
      executeStep({ type: "file.create", path: "../../escape.ts", from: "x" }, appRoot, payloadDir),
    ).toThrow(/outside the app root/i);
  });
});
```

- [ ] **Step 6: Run → fail** (currently writes outside `appRoot`, no throw)

- [ ] **Step 7: Implement**

In `src/apply.ts`, extend the path import (line 2) to `import { dirname, join, resolve, sep } from "path";` and add after `ensureDir` (line 13):
```ts
function assertInsideAppRoot(appRoot: string, target: string): void {
  const root = resolve(appRoot);
  const resolved = resolve(target);
  if (resolved !== root && !resolved.startsWith(root + sep)) {
    throw new Error(`Refusing to operate outside the app root: ${target}`);
  }
}
```
Call it on the resolved target in each fs-mutating branch — `file.create`/`file.write` (after `const dest = join(appRoot, step.path)`), `file.delete` (after `const target = join(appRoot, step.path)`), `env.add`/`env.remove` (after computing `envPath`), and `deps.bump` (after `pkgPath`). E.g. for file.create/write: `assertInsideAppRoot(appRoot, dest);`.

- [ ] **Step 8: Run → pass**

### Item 15 — env idempotency + real undo

- [ ] **Step 9: Write the failing tests**

Add to `src/__tests__/apply.test.ts`:
```ts
import { readFileSync, writeFileSync } from "fs";

describe("env.add idempotency is line-anchored", () => {
  it("adds the key even when a commented-out occurrence exists", () => {
    const envPath = join(appRoot, ".env");
    writeFileSync(envPath, "# AUTH_PROVIDER=none\n", "utf8");
    executeStep({ type: "env.add", file: ".env", keys: { AUTH_PROVIDER: { doc: "auth", default: "none" } } }, appRoot, payloadDir);
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/).map((l) => l.trimStart());
    expect(lines.some((l) => l.startsWith("AUTH_PROVIDER=none"))).toBe(true);
  });
});

describe("env.add undo removes the keys it added", () => {
  it("returns an env.remove undo that strips the key", () => {
    const envPath = join(appRoot, ".env");
    writeFileSync(envPath, "EXISTING=1\n", "utf8");
    const undo = executeStep({ type: "env.add", file: ".env", keys: { NEW_KEY: { doc: "d", default: "v" } } }, appRoot, payloadDir);
    expect(undo.type).toBe("env.remove");
    executeStep(undo, appRoot, payloadDir);
    expect(readFileSync(envPath, "utf8")).not.toMatch(/^\s*NEW_KEY=/m);
  });
});
```

- [ ] **Step 10: Run → fail** (substring `includes` suppresses the add; undo is a no-op `env.add`)

- [ ] **Step 11: Implement**

In `src/types.ts`, add to the `MigrationStep` union (after the `env.add` line):
```ts
  | { type: "env.remove"; file: string; keys: string[] }
```
In `src/apply.ts`, replace the `env.add` idempotency check (`existing.includes(\`${key}=\`)`, line 44) with a line-anchored helper. Add near `ensureDir`:
```ts
function envHasKey(content: string, key: string): boolean {
  return content.split(/\r?\n/).some((line) => {
    const t = line.trimStart();
    return t.startsWith(`${key}=`) || t.startsWith(`${key} =`);
  });
}
```
Change line 44 to `      if (envHasKey(existing, key)) continue;` and change the `env.add` return (line 54) to:
```ts
      return { type: "env.remove", file: step.file, keys: Object.keys(step.keys) };
```
Add an `env.remove` case to the switch (before `deps.bump`):
```ts
    case "env.remove": {
      const envPath = join(appRoot, step.file);
      assertInsideAppRoot(appRoot, envPath);
      if (!existsSync(envPath)) return { type: "env.add", file: step.file, keys: {} };
      const original = readFileSync(envPath, "utf8");
      const removed: Record<string, EnvKeySpec> = {};
      const kept = original.split(/\r?\n/).filter((line) => {
        const t = line.trimStart();
        const hit = step.keys.find((k) => t.startsWith(`${k}=`) || t.startsWith(`${k} =`));
        if (hit) {
          removed[hit] = { doc: "", default: t.slice(t.indexOf("=") + 1) };
          return false;
        }
        return true;
      });
      writeFileSync(envPath, kept.join("\n"), "utf8");
      // Undo of a remove is re-adding the captured keys.
      return { type: "env.add", file: step.file, keys: removed };
    }
```
Import `EnvKeySpec` if not already: `import type { EnvKeySpec, MigrationStep } from "./types.js";`

- [ ] **Step 12: Run → pass**

### Item 18 — enforce `requires`

- [ ] **Step 13: Write the failing test**

Add to `src/__tests__/apply-command.test.ts`:
```ts
describe("apply enforces migration prerequisites", () => {
  it("refuses a migration whose requires are not applied", async () => {
    manifestRef.current = {
      version: 1, cliVersion: "test", template: "demo-v1",
      migrations: [{
        id: "needs-missing", date: "2026-06-26", requires: ["not-applied"],
        targetFrameworkVersion: null, guideHref: "x.md", contentHash: "f".repeat(16),
        steps: [{ type: "file.create", path: "src/x.ts", from: "x/src/x.ts" }],
      }],
    };
    await apply(appRoot, { yes: true, payloadDir });
    expect(readLock(appRoot).applied).toHaveLength(0);
  });
});
```

- [ ] **Step 14: Run → fail** (the migration applies despite the unmet requirement)

- [ ] **Step 15: Implement**

In `src/commands/apply.ts`, inside the `for (const migration of pending)` loop, immediately after `console.log(\`── ${migration.id}${ver}\`);` (line 39), add:
```ts
    const missingReqs = (migration.requires ?? []).filter((r) => !appliedIds.has(r));
    if (missingReqs.length > 0) {
      console.error(`  ✗ ${migration.id} requires unapplied migration(s): ${missingReqs.join(", ")}`);
      console.error("  Aborting — apply the prerequisite(s) first.");
      return;
    }
```
And after the successful `writeLock(appRoot, lock)` (line 93), add `    appliedIds.add(migration.id);` so later migrations in the same run see it as applied.

- [ ] **Step 16: Run all migrator tests + build + drift**

Run: `pnpm --filter @igrp/template-migrator test` → PASS (all of items 15-18 + existing)
Run: `pnpm --filter @igrp/template-migrator build && pnpm --filter @igrp/template-migrator check:drift` → clean / PASS

- [ ] **Step 17: Changeset + commit**

Create `.changeset/p3-migrator-hardening.md`:
```md
---
"@igrp/template-migrator": patch
---

Hardening: numeric migration-file ordering (9 < 10 < 100); line-anchored
`env.add` idempotency + a real `env.remove` undo (rollback now strips added
keys); path-containment guard in `executeStep`; and `apply` enforces each
migration's `requires` before running it.
```
```bash
git add packages/template-migrator/src/ packages/template-migrator/scripts/ .changeset/p3-migrator-hardening.md
git commit -m "$(cat <<'EOF'
fix(template-migrator): ordering, env undo, path guard, requires gate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: next-auth edge cases (items 21, 22)

**Files:**
- Modify: `packages/framework/next-auth/src/config.ts:652-654` (item 21)
- Modify: `packages/framework/next-auth/src/oidc.ts:340` (item 22)
- Test: `src/__tests__/config.test.ts`, `src/__tests__/oidc.test.ts`

### Item 21 — normalize the `NEXTAUTH_URL_INTERNAL` home join

- [ ] **Step 1: Write the failing test**

In `config.test.ts`, inside the `callbacks.redirect` describe, add (uses a no-trailing-slash internal URL + no-leading-slash slug):
```ts
  it('joins NEXTAUTH_URL_INTERNAL and a slug with exactly one slash', async () => {
    const redirect = await getRedirect({
      NEXTAUTH_URL_INTERNAL: 'http://localhost:3000/app',
      NEXT_PUBLIC_IGRP_APP_HOME_SLUG: 'home',
    });
    const result = await redirect({ url: APP_BASE, baseUrl: APP_BASE });
    expect(result).toBe('http://localhost:3000/app/home');
  });
```

- [ ] **Step 2: Run → fail** (currently returns `http://localhost:3000/apphome`)

- [ ] **Step 3: Implement**

In `config.ts`, replace the `home` computation (lines 652-654):
```ts
        const joinHome = (base: string, slug: string) =>
          slug ? `${base.replace(/\/+$/, '')}/${slug.replace(/^\/+/, '')}` : base;
        const home = nextInternalUrl
          ? joinHome(nextInternalUrl, igrpAppHomeSlug)
          : sanitizeRedirectUrl(igrpAppHomeSlug || '/', env.NEXTAUTH_URL ?? baseUrl, '/');
```
(The existing `slug='/'` test still yields `${url}/` — `joinHome(url, '/')` → `${url}/`.)

### Item 22 — validate `expires_in`

- [ ] **Step 4: Write the failing test**

In `oidc.test.ts`, mirroring its `mockFetch`/`MOCK_DISCOVERY`/`makeToken` helpers and `vi.resetModules()` discipline, add (with fake timers for a deterministic `expiresAt`):
```ts
  it('falls back to 3600s when the IdP returns a non-numeric expires_in', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.token_endpoint, body: { access_token: 'new-at', expires_in: 'not-a-number' } },
    ]);
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);
    expect(result.expiresAt).toBe(Date.now() + 3600 * 1000);
    vi.useRealTimers();
  });
```

- [ ] **Step 5: Run → fail** (`expiresAt` is `NaN`)

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run src/__tests__/oidc.test.ts -t "non-numeric expires_in"`

- [ ] **Step 6: Implement**

In `oidc.ts`, just above the `refreshed` object (line 336), add:
```ts
  const expiresInSec = Number(refreshedToken.expires_in);
  const safeExpiresIn = Number.isFinite(expiresInSec) && expiresInSec > 0 ? expiresInSec : 3600;
```
Change line 340 to:
```ts
    expiresAt: Date.now() + safeExpiresIn * 1000,
```

- [ ] **Step 7: Run tests + build**

Run: `pnpm --filter @igrp/framework-next-auth test` → PASS
Run: `pnpm build:auth` → clean

- [ ] **Step 8: Changeset + commit**

Create `.changeset/p3-next-auth-edge-cases.md`:
```md
---
"@igrp/framework-next-auth": patch
---

Normalize the post-login `home` URL join when `NEXTAUTH_URL_INTERNAL` is set
(exactly one slash between base and slug); coerce a non-numeric/absent OIDC
`expires_in` to the 3600s default so a malformed value can no longer yield a
`NaN` token expiry.
```
```bash
git add packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/oidc.ts packages/framework/next-auth/src/__tests__/ .changeset/p3-next-auth-edge-cases.md
git commit -m "$(cat <<'EOF'
fix(next-auth): normalize home join; validate refresh expires_in

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: next API-client + app-by-code (items 23, 24)

**Files:**
- Modify: `packages/framework/next/src/lib/api-client.ts:6` (item 23)
- Modify: `packages/framework/next/src/hooks/use-applications.ts` (`getCachedAppByCode`, item 24 — as rewritten in P2)
- Test: `packages/framework/next/src/lib/__tests__/api-client.test.ts` (extend), `src/hooks/__tests__/app-by-code.test.ts` (new)

### Item 23 — validate token alongside baseUrl

- [ ] **Step 1: Write the failing test**

Add to `src/lib/__tests__/api-client.test.ts` (it already mocks the SDK + `react`):
```ts
it('throws when baseUrl is set but token is empty', async () => {
  igrpSetAccessClientConfig({ token: '', baseUrl: 'http://am' });
  expect(() => igrpGetAccessClient()).toThrow(/not configured/i);
});
```

- [ ] **Step 2: Run → fail** (builds a client with `Authorization: Bearer ` empty)

- [ ] **Step 3: Implement**

In `api-client.ts`, change the guard (line 6) from `if (!baseUrl) {` to:
```ts
  if (!baseUrl || !token) {
```

### Item 24 — exact code match instead of `[0]`

- [ ] **Step 4: Write the failing test**

Create `packages/framework/next/src/hooks/__tests__/app-by-code.test.ts` (mocks the mapper so the `find` logic is isolated):
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getApplications = vi.fn();
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  ApiClientError: class extends Error { status = 0; },
  AccessManagementClient: { create: () => ({ applications: { getApplications } }) },
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }) }));
vi.mock('react', async (i) => ({ ...(await i<typeof import('react')>()), cache: <T,>(f: T) => f }));
vi.mock('@igrp/framework-next-auth/sanitize', () => ({ sanitizeRedirectUrl: () => '' }));
// Return the DTOs as-is so we assert the exact-match selection, not the mapping.
vi.mock('../../mappers/applications-mapper', () => ({ mapperApplications: (r: { data: unknown[] }) => r.data }));

const { fetchAppByCode } = await import('../use-applications');
const { igrpSetAccessClientConfig, igrpResetAccessClientConfig } = await import('../../lib/api-config');

describe('fetchAppByCode selects the exact code match', () => {
  beforeEach(() => { igrpResetAccessClientConfig(); igrpSetAccessClientConfig({ token: 'T', baseUrl: 'http://am' }); });
  it('returns the app whose code equals the request, not list[0]', async () => {
    getApplications.mockResolvedValueOnce({ data: [{ code: 'other' }, { code: 'app' }] });
    const result = await fetchAppByCode('app');
    expect(result).toEqual({ code: 'app' });
  });
});
```

- [ ] **Step 5: Run → fail** (returns `{ code: 'other' }` — the `[0]`)

- [ ] **Step 6: Implement**

In `use-applications.ts`, change `getCachedAppByCode`'s return (the `mapperApplications(result)[0] ?? null` line) to:
```ts
  const apps = mapperApplications(result);
  return apps.find((a) => a.code === appCode) ?? null;
```
(If `IGRPApplicationType` exposes the code under a different field name, use that — confirm against `mappers/applications-mapper.ts`. The conservative post-filter avoids needing the exact `getApplicationByCode` endpoint.)

- [ ] **Step 7: Run tests + build**

Run: `pnpm --filter @igrp/framework-next test` → PASS
Run: `pnpm build:auth && pnpm build:next` → clean

- [ ] **Step 8: Changeset + commit**

Create `.changeset/p3-next-apiclient-appbycode.md`:
```md
---
"@igrp/framework-next": patch
---

`igrpGetAccessClient` now requires a non-empty token (not just baseUrl),
throwing the clear "not configured" error instead of issuing `Authorization:
Bearer ` (empty). `fetchAppByCode` selects the exact `code` match from the
list response instead of blindly taking `[0]`.
```
```bash
git add packages/framework/next/src/lib/api-client.ts packages/framework/next/src/hooks/use-applications.ts packages/framework/next/src/lib/__tests__/api-client.test.ts packages/framework/next/src/hooks/__tests__/app-by-code.test.ts .changeset/p3-next-apiclient-appbycode.md
git commit -m "$(cat <<'EOF'
fix(next): require token in access client; exact app-by-code match

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: next-ui conventions + memo (items 25, 26)

**Files:**
- Modify: `packages/framework/next-ui/src/components/providers/active-theme.tsx:3,44-48` (item 25)
- Modify: `packages/framework/next-ui/src/components/auths/carousel.tsx:46,71` (item 26)

**Verification:** next-ui has **no test runner** — grep-assertion + `pnpm build:next-ui`. Do not add a harness.

### Item 25 — memoize the context value (compiler skips this file)

The React Compiler skips `providers/active-theme.tsx` (`babel.config.cjs` `skipPatterns` includes `provider`/`context`), so the memo must be manual.

- [ ] **Step 1: Implement**

In `active-theme.tsx`, line 3, add `useMemo`:
```ts
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
```
Replace the return (lines 44-48):
```tsx
  const value = useMemo(() => ({ activeTheme, setActiveTheme }), [activeTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
```

- [ ] **Step 2: Verify**

Run: `rg -n "value=\{\{ activeTheme" packages/framework/next-ui/src/components/providers/active-theme.tsx` → **no matches** (inline object replaced).
Run: `pnpm build:next-ui` → clean.

### Item 26 — semantic tokens + flex gap in the auth carousel

> **Scoping decision (documented):** the root backdrop and the dot-row spacing are clear violations and convert cleanly. The image-overlay **caption** (`text-white`/`bg-black/40` scrim over an arbitrary photo) legitimately needs fixed light-on-dark contrast independent of theme — semantic tokens (which invert with the theme) would *break* readability there. Convert the safe cases; leave the on-photo caption colors with an explanatory comment rather than forcing a token that regresses contrast.

- [ ] **Step 3: Implement the safe conversions**

In `carousel.tsx`:
- Line 46: change `bg-slate-900` → `bg-muted` (root surface): `'relative h-full w-full overflow-hidden bg-muted'`.
- Line 71: change `space-x-2` → `gap-2` (ui-rules: `flex gap-*`): `'mt-4 flex justify-start gap-2'`.
- Above the caption block (the `bg-black/40` scrim at line 65), add a comment:
```tsx
            {/* Fixed light-on-dark contrast: this caption sits over an arbitrary
                photo, so theme-inverting semantic tokens would harm readability. */}
```
Leave `bg-black/40`, `text-white`, `text-slate-200`, `bg-white/50`, `bg-white` on the on-photo caption/dots as the documented exception.

- [ ] **Step 4: Verify**

Run: `rg -n "bg-slate-900|space-x-2" packages/framework/next-ui/src/components/auths/carousel.tsx` → **no matches**.
Run: `pnpm build:next-ui` → clean. Optional: `pnpm dev:demo`, open `/login`, confirm the carousel renders across themes/dark.

- [ ] **Step 5: Changeset + commit**

Create `.changeset/p3-next-ui-conventions.md`:
```md
---
"@igrp/framework-next-ui": patch
---

Memoize `IGRPActiveThemeProvider`'s context value (the React Compiler skips
provider files, so it must be manual). Auth carousel: root backdrop uses the
`bg-muted` token and the dot row uses `flex gap-2`; on-photo caption colors are
kept as a documented fixed-contrast exception.
```
```bash
git add packages/framework/next-ui/src/components/providers/active-theme.tsx packages/framework/next-ui/src/components/auths/carousel.tsx .changeset/p3-next-ui-conventions.md
git commit -m "$(cat <<'EOF'
fix(next-ui): memoize theme context value; carousel tokens + gap

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: demo-v1 per-request waste, via migration 22 (items 19, 20)

**Files:**
- Modify (template source): `templates/demo-v1/src/app/layout.tsx:27`, `src/app/(igrp)/layout.tsx:20`, `src/lib/config/get-routes.ts`
- Create (migration): `packages/template-migrator/migrations/demo-v1/22.MIGRATIONS-26062026.md` + `payload/22/...`
- Test: `packages/template-migrator/src/__tests__/apply-command.test.ts` (add a case)

> **Drift note:** `(igrp)/layout.tsx` currently uses `IGRPLayoutFull` + `igrpGetClaims` + `IGRPSectionPermissions`. Write the payload against that exact current shape.

### Item 19 — use the existing per-request cache

- [ ] **Step 1: Fix `templates/demo-v1/src/app/layout.tsx`**

Add `getLayoutConfig` to the dal import and call it instead of `configLayout`:
- Replace the `configLayout` import from `@/actions/igrp/layout` — keep other imports, add `import { getLayoutConfig } from "@/lib/dal";`. If `configLayout` is no longer referenced in the file, remove it from the actions import.
- Line 27: `  const layoutConfig = await configLayout();` → `  const layoutConfig = await getLayoutConfig();`

- [ ] **Step 2: Fix `templates/demo-v1/src/app/(igrp)/layout.tsx`**

- Add `getLayoutConfig` to the existing `@/lib/dal` import (which already imports `verifySession`): `import { getLayoutConfig, verifySession } from "@/lib/dal";`. Remove the now-unused `configLayout` import from `@/actions/igrp/layout` if nothing else uses it.
- Line 20: `  const layoutConfig = await configLayout();` → `  const layoutConfig = await getLayoutConfig();`

(`getLayoutConfig = cache(configLayout)` already exists in `dal.ts`; both layouts render in the same per-request RSC tree, so `serverSession()` now runs once instead of twice. `dal.ts` itself is unchanged.)

### Item 20 — memoize `getRoutes`

- [ ] **Step 3: Fix `templates/demo-v1/src/lib/config/get-routes.ts`**

Add a module-level cache (the file is build-stable, so cross-request memoization is safe). Wrap the body:
```ts
import fs from "fs";
import path from "path";

let cached: { appRoutes: string[]; paramMapBody: string } | undefined;

export function getRoutes() {
  if (cached) return cached;
  try {
    const file = path.join(process.cwd(), ".next/types/routes.d.ts");
    const content = fs.readFileSync(file, "utf8");

    const appRoutesMatch = content.match(
      /type AppRoutes\s*=\s*([\s\S]*?)\n(?=type|interface)/,
    );
    if (!appRoutesMatch) {
      throw new Error("Could not find AppRoutes in routes.d.ts");
    }
    const appRoutes = appRoutesMatch[1]
      .split("|")
      .map((r) => r.trim().replace(/"/g, ""))
      .filter((r) => r.length > 0 && !r.startsWith("type"));

    const paramMapMatch = content.match(/interface ParamMap\s*{([\s\S]*?)^}/m);
    if (!paramMapMatch) {
      throw new Error("Could not find ParamMap in routes.d.ts");
    }
    const paramMapBody = paramMapMatch[1];

    cached = { appRoutes, paramMapBody };
    return cached;
  } catch (error) {
    console.warn("Could not read routes file:", error);
  }
}
```

- [ ] **Step 4: Format the template**

Run: `pnpm --filter @igrp/framework-next-template format` (Biome) → clean.

### Migration 22

- [ ] **Step 5: Author payloads**

Copy each corrected file to `packages/template-migrator/migrations/demo-v1/payload/22/...` (byte-identical to the template source after Biome formatting):
- `payload/22/app/layout.tsx`
- `payload/22/app/(igrp)/layout.tsx`
- `payload/22/lib/config/get-routes.ts`

- [ ] **Step 6: Author the descriptor**

Create `packages/template-migrator/migrations/demo-v1/22.MIGRATIONS-26062026.md`:
```md
---
id: 22-per-request-layout-and-routes-cache
date: 2026-06-26
targetFrameworkVersion: null
requires: ["21-session-args-auth-bypass"]
steps:
  - type: file.write
    path: src/app/layout.tsx
    mode: replace
    from: payload/22/app/layout.tsx
  - type: file.write
    path: src/app/(igrp)/layout.tsx
    mode: replace
    from: payload/22/app/(igrp)/layout.tsx
  - type: file.write
    path: src/lib/config/get-routes.ts
    mode: replace
    from: payload/22/lib/config/get-routes.ts
---

# Migration Guide — Per-request layout config + routes cache (`22-per-request-layout-and-routes-cache`)

## What changed

Both layouts now call the existing `getLayoutConfig` (a `cache()`-wrapped
`configLayout`) instead of the raw action, so the NextAuth session decode runs
once per request instead of once per layout. `getRoutes()` memoizes its
synchronous read of the build-stable `.next/types/routes.d.ts` at module level
instead of re-reading + re-parsing on every layout render.

| File | Change |
|---|---|
| `src/app/layout.tsx` | `configLayout()` → `getLayoutConfig()` |
| `src/app/(igrp)/layout.tsx` | `configLayout()` → `getLayoutConfig()` |
| `src/lib/config/get-routes.ts` | module-level memoization of the routes read |

## Notes

- Run `igrp-migrate plan` first to preview, then `igrp-migrate apply`.
```

- [ ] **Step 7: Verify drift + apply test + build**

Run: `pnpm --filter @igrp/template-migrator check:drift` → PASS (reconcile payloads byte-for-byte with the template if it fails).
Add to `apply-command.test.ts`:
```ts
describe("migration 22 rewrites the routes helper", () => {
  it("applies the get-routes payload", async () => {
    writeFileAt(appRoot, "src/lib/config/get-routes.ts", "OLD\n");
    writeFileAt(payloadDir, "22/lib/config/get-routes.ts", "let cached;\nexport function getRoutes() {}\n");
    manifestRef.current = {
      version: 1, cliVersion: "test", template: "demo-v1",
      migrations: [{
        id: "22-per-request-layout-and-routes-cache", date: "2026-06-26",
        requires: [], targetFrameworkVersion: null, guideHref: "22.MIGRATIONS-26062026.md", contentHash: "2".repeat(16),
        steps: [{ type: "file.write", mode: "replace", path: "src/lib/config/get-routes.ts", from: "22/lib/config/get-routes.ts" }],
      }],
    };
    await apply(appRoot, { yes: true, payloadDir });
    expect(readFileSync(join(appRoot, "src/lib/config/get-routes.ts"), "utf8")).toContain("cached");
  });
});
```
Run: `pnpm --filter @igrp/template-migrator exec vitest run src/__tests__/apply-command.test.ts -t "migration 22"` → PASS
Run: `pnpm build:demo` → clean (Biome + next build).

- [ ] **Step 8: Changeset + commit**

Create `.changeset/p3-migrator-migration-22.md`:
```md
---
"@igrp/template-migrator": patch
---

Add migration `22-per-request-layout-and-routes-cache`: demo-v1 layouts use the
existing `getLayoutConfig` cache (one session decode per request) and
`getRoutes()` memoizes its routes-file read.
```
```bash
git add templates/demo-v1/src/app/layout.tsx "templates/demo-v1/src/app/(igrp)/layout.tsx" templates/demo-v1/src/lib/config/get-routes.ts packages/template-migrator/migrations/demo-v1/22.MIGRATIONS-26062026.md packages/template-migrator/migrations/demo-v1/payload/22/ packages/template-migrator/src/__tests__/apply-command.test.ts .changeset/p3-migrator-migration-22.md
git commit -m "$(cat <<'EOF'
fix(demo-v1): per-request layout config + routes cache (migration 22)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Final verification (run before handing off P3)

- [ ] `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/components/horizon/charts src/components/horizon/data-table/lib` — green
- [ ] `pnpm --filter @igrp/template-migrator test && pnpm --filter @igrp/template-migrator check:drift` — green
- [ ] `pnpm --filter @igrp/framework-next-auth test && pnpm --filter @igrp/framework-next test` — green
- [ ] `pnpm build:framework` — clean (full order)
- [ ] `pnpm build:demo` — clean
- [ ] One `patch` changeset per package: design-system, template-migrator (×3: hardening + migration 22; note migration 21 was P2), next-auth, next, next-ui
- [ ] No `dist/` staged; no version bumps; nothing published

## Self-review notes

- **Spec coverage:** Task 1 = items 12-14; Task 2 = items 15-18; Task 3 = items 21-22; Task 4 = items 23-24; Task 5 = items 25-26; Task 6 = items 19-20.
- **Item 17** is implemented as a shared, unit-tested `src/migration-order.ts` (DRY across `pack.ts` + `check-drift.ts`) rather than duplicated inline comparators.
- **Item 24** uses the conservative post-filter `find(a => a.code === appCode)` (no new endpoint/mapper); confirm the mapped type's code field name against `applications-mapper.ts` during implementation.
- **Item 26** deliberately does NOT blanket-convert on-photo caption colors to semantic tokens (which invert with theme and would break contrast over a photo); only the root surface + spacing violations are converted, with the exception documented in-code. Flag for design review if a stricter interpretation is required.
- **Items 25** must be a manual `useMemo` — the React Compiler skips provider/context files per `babel.config.cjs`.
- **Migration order:** Task 6 creates migration `22` with `requires: ["21-..."]` (P2). Implement P2 before P3.
- **next-ui (Task 5)** has no unit harness — verification is grep + build + manual, per repo reality.
