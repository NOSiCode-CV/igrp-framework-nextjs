# Auth Bypass Production Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A production build refuses to start while the auth bypass is on unless the operator opts in explicitly, and the framework's bypass predicate tolerates quoted `AUTH_PROVIDER` values like the other three copies do.

**Architecture:** The check lives in `@igrp/framework-next` next to `isIgrpAuthBypass()` (one predicate, unit-tested) and the template calls it once from `register()` in `src/instrumentation.ts`, before the first request. The predicate itself does not change behaviour per request. Existing apps receive the template change through a new `@igrp/template-migrator` migration.

**Tech Stack:** TypeScript, Next.js 15 (`instrumentation.ts`), Vitest, changesets (pre-release mode), `@igrp/template-migrator`.

**Spec:** `docs/qa-auth-bypass-reply.md` §4 (in pt-PT).

## Global Constraints

- Changesets are `patch` only. Never `major`/`minor` (`.claude/shared/hard-rules.md`).
- Do not version, build for release, or publish. `pnpm version:changesets` and any `release` script need the user's explicit authorization for this task (Task 4 has a gate).
- Opt-in variable name, exactly: `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION`. Only the value `true` opts in, parsed like `IGRP_PREVIEW_MODE` (trim, strip one pair of surrounding quotes, case-insensitive).
- Bypass means `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`, as already defined by `isIgrpAuthBypass()`.
- Error messages are pt-PT, like the existing `IgrpConfigError` messages in `packages/framework/next/src/lib/build.ts`.
- Framework packages: ESLint + Prettier. `templates/demo-v1`: Biome. Do not cross-apply.
- No `Co-Authored-By` trailers in commits.
- Every change to `templates/demo-v1` ships as a migration (`check:drift` enforces it).

## Review Focus

1. `next dev` with preview on must keep working: `NODE_ENV=development` never throws. Covered in Task 2 tests.
2. The opt-in flag set to `false`, empty, or `"true"` with quotes: only a parsed `true` opts in. Covered in Task 2 tests.
3. `AUTH_PROVIDER=none` alone (preview off) in production also throws; the guard is not preview-only. Covered in Task 2 tests.
4. A consumer app that deleted `docker/development/`: the migration's `env.add` on `docker/development/.env.development` creates a one-key file there. Accepted; Task 4's changelog says so.
5. The error must name which variable turned the bypass on, so an operator can fix the deploy from the pod log alone. Covered in Task 2 tests.

---

### Task 1: Strip quotes from `AUTH_PROVIDER` in `isIgrpAuthBypass`

**Files:**
- Modify: `packages/framework/next/src/lib/permissions.ts:162-165`
- Test: `packages/framework/next/src/lib/__tests__/permissions.test.ts:44-59`

**Interfaces:**
- Produces: `isIgrpAuthBypass(env?: Record<string, string | undefined>): boolean`, unchanged signature.

- [ ] **Step 1: Write the failing test**

Add to the existing `describe('isIgrpAuthBypass')` block:

```ts
it('strips surrounding quotes from AUTH_PROVIDER like the other bypass predicates', () => {
  expect(isIgrpAuthBypass({ AUTH_PROVIDER: '"none"' })).toBe(true);
  expect(isIgrpAuthBypass({ AUTH_PROVIDER: "'none'" })).toBe(true);
  expect(isIgrpAuthBypass({ AUTH_PROVIDER: ' "None" ' })).toBe(true);
  expect(isIgrpAuthBypass({ AUTH_PROVIDER: '"igrp-auth"' })).toBe(false);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/lib/__tests__/permissions.test.ts -t "strips surrounding quotes"`
Expected: FAIL on the first `expect` (received `false`).

- [ ] **Step 3: Apply the same normalisation as `IGRP_PREVIEW_MODE`**

In the `noneProvider` expression add `.replace(/^["']|["']$/g, '')` after `.trim()`, then a second `.trim()` before `.toLowerCase()` (the third case has spaces outside the quotes).

- [ ] **Step 4: Run the whole file and confirm it passes**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/lib/__tests__/permissions.test.ts`
Expected: PASS, no other test changed.

- [ ] **Step 5: Commit**

```bash
git add packages/framework/next/src/lib/permissions.ts packages/framework/next/src/lib/__tests__/permissions.test.ts
git commit -m "fix(framework-next): isIgrpAuthBypass tolerates quoted AUTH_PROVIDER"
```

### Task 2: `igrpAssertAuthBypassAllowed` in the framework

**Files:**
- Modify: `packages/framework/next/src/lib/permissions.ts` (new function directly below `isIgrpAuthBypass`)
- Modify: `packages/framework/next/src/index.ts` (add the name to the existing `./lib/permissions.js` export list, next to `isIgrpAuthBypass`)
- Test: `packages/framework/next/src/lib/__tests__/permissions.test.ts`
- Create: `.changeset/auth-bypass-production-guard.md`

**Interfaces:**
- Consumes: `isIgrpAuthBypass(env)` from Task 1; `IgrpConfigError` from `../errors.js`.
- Produces: `igrpAssertAuthBypassAllowed(env?: Record<string, string | undefined>): void`, exported from the `@igrp/framework-next` root. Defaults `env` to `process.env`. Throws `IgrpConfigError` with code `'IGRP_CONFIG_INVALID'` and `context: { variable: string }`; returns nothing otherwise.

- [ ] **Step 1: Write the failing tests**

Import `igrpAssertAuthBypassAllowed` with the existing imports, then add:

```ts
describe('igrpAssertAuthBypassAllowed', () => {
  const prod = { NODE_ENV: 'production' };

  it('allows bypass outside production', () => {
    expect(() => igrpAssertAuthBypassAllowed({ NODE_ENV: 'development', IGRP_PREVIEW_MODE: 'true' })).not.toThrow();
    expect(() => igrpAssertAuthBypassAllowed({ NODE_ENV: 'test', AUTH_PROVIDER: 'none' })).not.toThrow();
  });

  it('allows production without bypass', () => {
    expect(() => igrpAssertAuthBypassAllowed({ ...prod, AUTH_PROVIDER: 'igrp-auth' })).not.toThrow();
    expect(() => igrpAssertAuthBypassAllowed(prod)).not.toThrow();
  });

  it('throws in production when preview mode is on without the opt-in', () => {
    expect(() => igrpAssertAuthBypassAllowed({ ...prod, IGRP_PREVIEW_MODE: 'true' })).toThrow(IgrpConfigError);
    expect(() => igrpAssertAuthBypassAllowed({ ...prod, IGRP_PREVIEW_MODE: 'true' })).toThrow(/IGRP_PREVIEW_MODE/);
  });

  it('throws in production when AUTH_PROVIDER=none without the opt-in', () => {
    expect(() => igrpAssertAuthBypassAllowed({ ...prod, AUTH_PROVIDER: 'none' })).toThrow(/AUTH_PROVIDER/);
  });

  it('accepts only a parsed true as the opt-in', () => {
    const on = { ...prod, IGRP_PREVIEW_MODE: 'true' };
    expect(() => igrpAssertAuthBypassAllowed({ ...on, IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: 'true' })).not.toThrow();
    expect(() => igrpAssertAuthBypassAllowed({ ...on, IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: ' "TRUE" ' })).not.toThrow();
    expect(() => igrpAssertAuthBypassAllowed({ ...on, IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: 'false' })).toThrow();
    expect(() => igrpAssertAuthBypassAllowed({ ...on, IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: '' })).toThrow();
    expect(() => igrpAssertAuthBypassAllowed({ ...on, IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: '1' })).toThrow();
  });
});
```

Import `IgrpConfigError` from `'../../errors.js'` (the test file does not import it yet).

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/lib/__tests__/permissions.test.ts -t "igrpAssertAuthBypassAllowed"`
Expected: FAIL, `igrpAssertAuthBypassAllowed` is not a function.

- [ ] **Step 3: Implement `igrpAssertAuthBypassAllowed(env = process.env): void` in `permissions.ts`**

Return early when `!isIgrpAuthBypass(env)`, when `env.NODE_ENV !== 'production'`, or when the opt-in parses as `true`. Otherwise throw. `variable` is `'IGRP_PREVIEW_MODE'` when preview is on, else `'AUTH_PROVIDER'`. Exact message:

```ts
`[igrp-auth-bypass]: ${variable} desliga a autenticação num build de produção. ` +
  'Remova a variável deste deploy, ou defina IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true ' +
  'se este ambiente é intencionalmente uma demo sem login.'
```

Reuse the preview-mode parsing already inside `isIgrpAuthBypass` for the opt-in flag (extract a local `envFlag(value)` helper in the file if that avoids writing the regex a third time). Add a one-line JSDoc saying it runs once at startup, from the template's `instrumentation.ts`.

- [ ] **Step 4: Export it from the package root**

Add `igrpAssertAuthBypassAllowed` to the `./lib/permissions.js` export list in `src/index.ts`.

- [ ] **Step 5: Run the package gates**

Run: `pnpm --filter @igrp/framework-next test`, then `pnpm --filter @igrp/framework-next lint`, then `pnpm --filter @igrp/framework-next typecheck`
Expected: all pass. Then run `pnpm build:i18n-tools` and `pnpm lint:i18n:framework`; if the new message is flagged, mark it with an `igrp-i18n-ignore` comment the way `build.ts` handles its messages.

- [ ] **Step 6: Write the changeset**

`.changeset/auth-bypass-production-guard.md`:

```md
---
"@igrp/framework-next": patch
---

`igrpAssertAuthBypassAllowed()` refuses a production start while `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`, unless `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true`. Call it from `register()` in `instrumentation.ts`. `isIgrpAuthBypass()` now accepts a quoted `AUTH_PROVIDER` (`"none"`), like the other bypass checks.
```

- [ ] **Step 7: Commit**

```bash
git add packages/framework/next/src .changeset/auth-bypass-production-guard.md
git commit -m "feat(framework-next): refuse auth bypass in production without explicit opt-in"
```

### Task 3: Call the guard from the template

**Files:**
- Modify: `templates/demo-v1/src/instrumentation.ts`
- Modify: `templates/demo-v1/docker/development/.env.development`
- Modify: `templates/demo-v1/docs/ENVIRONMENT.md` (table at lines 30-38)
- Modify: `templates/demo-v1/docs/DOCKER-RUN.md`

**Interfaces:**
- Consumes: `igrpAssertAuthBypassAllowed()` from `@igrp/framework-next` (Task 2).

- [ ] **Step 1: Call the guard first in `register()`**

Inside the existing `if (process.env.NEXT_RUNTIME === "nodejs")` block and before the `IGRP_SESSION_STORE_URL` early return: `const { igrpAssertAuthBypassAllowed } = await import("@igrp/framework-next"); igrpAssertAuthBypassAllowed();`. Keep the import inside the block, for the reason the file's header comment gives. Extend the header comment with one short paragraph: the auth-bypass guard runs first and stops the server before any request when bypass is on in a production build without the opt-in.

- [ ] **Step 2: Opt the development image in**

Append to `docker/development/.env.development`, after `IGRP_SYNC_ACCESS=false`:

```
# This image is a production build that runs in preview mode on purpose.
IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true
```

- [ ] **Step 3: Document the variable**

`ENVIRONMENT.md`: a new row below `IGRP_PREVIEW_MODE`: `` `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION` `` | Allows `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none` in a production build (`next start`, Docker). Without it the server refuses to start. Set it only for demo deploys without login | `false`.
`DOCKER-RUN.md`: in "Quick start (preview, no IdP)" add one sentence saying the image's `.env.development` already sets `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true`, and a row in the troubleshooting table for the `[igrp-auth-bypass]` startup error pointing at that variable.

- [ ] **Step 4: Format with Biome**

Run: `pnpm --filter @igrp/framework-next-template exec biome format --write src/instrumentation.ts`
Expected: no errors.

- [ ] **Step 5: Verify the three runtime cases**

Run `pnpm build:framework` (the template consumes `dist/`), then `pnpm build:demo`. Expected: build succeeds. If it fails because `instrumentation.ts` imports the `@igrp/framework-next` root, stop and report; do not move the function to another entry point without asking.
`pnpm build:demo` rewrites about 60 template files to LF. Restore the ones you did not touch with `git restore` before committing.
Then, from the repo root, start the production server three times with `pnpm start:demo` (the template's `.env`, which has `AUTH_PROVIDER=igrp-auth`, plus these variables set in the shell; shell variables win over `.env`):
1. `IGRP_PREVIEW_MODE=true`: the process exits with `[igrp-auth-bypass]: IGRP_PREVIEW_MODE ...` in the log.
2. `IGRP_PREVIEW_MODE=true IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true`: the server starts and `/` renders without login.
3. Neither variable: the server starts and `/` redirects to `/login`.
Finally `pnpm dev:demo` with `IGRP_PREVIEW_MODE=true`: starts, `/` renders without login.

- [ ] **Step 6: Commit**

```bash
git add templates/demo-v1/src/instrumentation.ts templates/demo-v1/docker/development/.env.development templates/demo-v1/docs/ENVIRONMENT.md templates/demo-v1/docs/DOCKER-RUN.md
git commit -m "feat(template): refuse auth bypass in production builds without opt-in"
```

### Task 4: Migration 71

**Gate:** Do not start until the user has authorized versioning and `packages/framework/next/package.json` holds the version that contains Task 2 (expected `0.2.0-beta.13`). Check with `pnpm view @igrp/framework-next version --registry=https://sonatype.nosi.cv/repository/igrp/` and the local `package.json`. If neither shows it, stop and ask.

**Files:**
- Create: `packages/framework/template-migrator/migrations/demo-v1/71.MIGRATIONS-<DDMMYYYY>.md` (date of authoring, same pattern as 70)
- Create: `packages/framework/template-migrator/migrations/demo-v1/payload/71/src/instrumentation.ts` (byte copy of the template file after Task 3)
- Create: `packages/framework/template-migrator/migrations/demo-v1/payload/71/.env.example` (byte copy of the template file after Task 3)
- Modify: `templates/demo-v1/.igrp-migrations-lock.json` (generated)
- Create: `.changeset/template-migration-71.md`

**Interfaces:**
- Consumes: the template files from Task 3; the released `@igrp/framework-next` version.

- [ ] **Step 1: Write the migration**

Front matter, modelled on `56.MIGRATIONS-14102026.md` and `70.MIGRATIONS-21102026.md`:
- `id: 71-auth-bypass-production-guard`, `requires: ["70-resync-framework-beta12"]`, `targetFrameworkVersion` = the `@igrp/framework-next` version from the gate.
- `deps.bump` on `package.json` for `@igrp/framework-next` to that version. Include any other `@igrp/*` package whose local version moved in the same versioning run.
- `file.write`, `mode: replace`, `path: src/instrumentation.ts`, `from: payload/71/src/instrumentation.ts`.
- `file.write`, `mode: replace`, `path: .env.example`, `from: payload/71/.env.example`.
- `env.add` on `docker/development/.env.development` with key `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION: { default: "true", doc: "This image is a production build that runs in preview mode on purpose." }`.

Body: "What changed" table (files and dependency), "Why" (one paragraph: a production deploy with preview mode left on now logs the error and answers every request with 500 instead of serving every visitor as super-admin), "After migrating": run `pnpm install`; if your real deploys set `IGRP_PREVIEW_MODE` or `AUTH_PROVIDER=none` on purpose, add `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true` there; note that `env.add` creates `docker/development/.env.development` if the app had deleted that folder. Apps that edited `instrumentation.ts` must hand-merge: the replace overwrites it, so re-apply their edits around the two-line dynamic import and call of the guard, which sits first inside the `NEXT_RUNTIME === "nodejs"` block.

Changelog note for the body: apps with a literally quoted `AUTH_PROVIDER="none"` now get the super-admin mock for permission checks, because `isIgrpAuthBypass()` strips the quotes.

The `deps.bump` is mandatory in the same migration: without the new `@igrp/framework-next`, `register()` throws (500) even in `next dev`, since the import of the guard fails.

- [ ] **Step 2: Copy the payload**

Copy `templates/demo-v1/src/instrumentation.ts` to `payload/71/src/instrumentation.ts` unchanged, and `templates/demo-v1/.env.example` to `payload/71/.env.example` unchanged (byte copies).

- [ ] **Step 3: Regenerate the lock and run the migrator gates**

Run: `pnpm --filter @igrp/template-migrator sync:template-lock`, then `pnpm --filter @igrp/template-migrator typecheck`, `pnpm --filter @igrp/template-migrator test`, `pnpm --filter @igrp/template-migrator check:drift`
Expected: all pass, and `check:drift` reports no drift and no orphans.

- [ ] **Step 4: Write the changeset**

`.changeset/template-migration-71.md`:

```md
---
"@igrp/template-migrator": patch
---

Migration 71: `instrumentation.ts` refuses auth bypass in production builds without `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true`; the development Docker image opts in.
```

- [ ] **Step 5: Commit**

```bash
git add packages/framework/template-migrator/migrations/demo-v1 templates/demo-v1/.igrp-migrations-lock.json .changeset/template-migration-71.md
git commit -m "feat(template-migrator): migration 71 adds the auth-bypass production guard"
```

### Task 5: Align the QA reply with what shipped

**Files:**
- Modify: `docs/qa-auth-bypass-reply.md` §4.1 and §4.3

- [ ] **Step 1: Update the text**

§4.1: say the check is `igrpAssertAuthBypassAllowed()` from `@igrp/framework-next`, called from `register()` in `instrumentation.ts`. §4.3: name the changesets and migration 71. Keep pt-PT. Change nothing else.

- [ ] **Step 2: Commit**

```bash
git add docs/qa-auth-bypass-reply.md
git commit -m "docs: QA reply names the shipped auth-bypass guard"
```
