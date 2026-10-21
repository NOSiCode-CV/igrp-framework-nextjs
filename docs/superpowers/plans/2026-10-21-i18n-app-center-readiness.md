# i18n App Center Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the framework i18n gaps found while reviewing the Application Center's migration, so the App Center can run session-first on the framework alone, then release them as `0.2.0-beta.11`.

**Architecture:** Four small fixes, each in the package that owns it:
- `next-i18n`: missing keys fail `check-catalogs`.
- `next`: one Secure-cookie rule shared by both cookie writers.
- `next-ui`: chrome copy for `IGRP_I18N_CONFIG_INVALID`.
- Template: lints the files it skips today and documents the Edge-safe session-first middleware recipe.

A resync migration (69) ships the release. The App Center adoption is a separate plan in that repo (`igrp-application-center/docs/superpowers/plans/2026-10-21-i18n-framework-adoption.md`), and its session-first task waits for this release.

**Tech Stack:** TypeScript, Next 15.5, next-intl 4, Vitest, changesets, template-migrator.

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-app-center-readiness-spec.md`, which builds on `2026-10-12-framework-i18n-v2-design.md` (v2, implemented).

## Global Constraints

- Platform locales stay `pt`, `en`, `fr`; `pt` is the default and the complete catalog.
- No new runtime dependencies. No `process.env` reads inside framework packages; env is read only by the template/app.
- `@igrp/framework-next/i18n` must stay Edge-safe (no `next/headers`, no `server-only`).
- Catalog parity: every next-ui chrome string exists in pt, en and fr (`next-ui/src/i18n/__tests__/parity.test.ts`).
- Each task ends with `pnpm build:framework` green from the repo root.

## Review Focus

1. **App behind a TLS-terminating proxy.** `request.nextUrl.protocol` is `http:`, but `x-forwarded-proto: https`. The locale cookie written by middleware must be `Secure` (Task 2 test).
2. **`x-forwarded-proto: https,http` (proxy chain).** Only the first value counts (Task 2 test).
3. **Catalog with a key missing in one non-default locale.** It must fail by default and pass with `--allow-missing` (Task 1 tests).
4. **A new `IgrpErrorCode` added to `next/src/errors.ts` later.** It must fail compilation until the chrome catalog has copy for it (Task 3 type test).
5. **Template-migrated apps.** Migration 69 bumps versions only; the `lint:i18n` path change is a documented manual step and must not be silently skipped (Task 5 migration doc).

---

### Task 1: `check-catalogs` fails on missing keys

Today missing keys only lower `coverage`. An App Center locale missing 13 keys passed.

**Files:**
- Modify: `packages/framework/next-i18n/src/catalogs.ts` (`CheckCatalogsOptions`, `checkCatalogs`)
- Modify: `packages/framework/next-i18n/src/main.ts` (`VALUE_FLAGS` → also a boolean flag set, `USAGE`, `check-catalogs` branch)
- Test: `packages/framework/next-i18n/src/__tests__/catalogs.test.ts`, `packages/framework/next-i18n/src/__tests__/cli.test.ts`
- Modify: `packages/framework/next-i18n/README.md` (if it documents the checks)

**Interfaces:**
- Produces: `CheckCatalogsOptions.allowMissing?: boolean` (default `false`). CLI flag `--allow-missing` (boolean, takes no value).
- Error text, exact: `` `${locale}: missing key "${key}" (present in ${defaultLocale})` ``.

- [ ] **Step 1: Write the failing tests**

In `catalogs.test.ts`:
- `"fails on keys missing from a non-default locale"`. The pt catalog has `users.title` and `users.count`; en has only `users.title`. Expect `report.errors` to contain `en: missing key "users.count" (present in pt)`, and `report.coverage` to equal `{ pt: 100, en: 50 }`.
- `"allowMissing reports coverage without failing"`. Same catalogs with `allowMissing: true`. Expect `report.errors` to be `[]`.
- Update the existing `"passes a consistent set and reports coverage"` test to pass `allowMissing: true`. Its en catalog is deliberately partial.

In `cli.test.ts`:
- `main(["check-catalogs", dir, "--default", "pt"])` returns `1` for the partial set.
- The same call plus `"--allow-missing"` returns `0`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @igrp/framework-next-i18n test -- src/__tests__/catalogs.test.ts src/__tests__/cli.test.ts`
Expected: FAIL. No "missing key" error is produced, and `--allow-missing` is rejected as an unknown flag (exit 2).

- [ ] **Step 3: Implement**

In `checkCatalogs`, after the per-key loop of each non-default locale, push one error per `base` key absent from `flat`, unless `allowMissing` is set. Keep the existing coverage computation.

In `main.ts`, add `BOOLEAN_FLAGS = new Set(["--allow-missing"])`. `hasUnknownFlag` accepts both sets; `positionals` skips a value only after a `VALUE_FLAGS` entry. Add the flag to `USAGE`: `[--allow-missing]  report missing keys as coverage only`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @igrp/framework-next-i18n test`
Expected: PASS (all files).

- [ ] **Step 5: Check the template still passes**

Run: `pnpm build:i18n-tools && pnpm --dir templates/demo-v1 lint:i18n`
Expected: exit 0. The template catalogs are at 100%.

- [ ] **Step 6: Changeset and commit**

Add a changeset: `@igrp/framework-next-i18n` minor (pre mode makes it a beta). Summary: "check-catalogs fails on keys missing from a non-default locale; pass --allow-missing to keep the old coverage-only behaviour."

```bash
git add packages/framework/next-i18n .changeset
git commit -m "feat(next-i18n): check-catalogs fails on missing keys (--allow-missing opts out)"
```

---

### Task 2: One Secure-cookie rule for both locale writers

Behind the gateway's TLS proxy, `igrpSyncLocaleCookie` reads `request.nextUrl.protocol` (`http:`) and writes the cookie without `Secure`, while `igrpSetLocale` reads `x-forwarded-proto` and writes it with `Secure`.

**Files:**
- Modify: `packages/framework/next/src/i18n/config.ts`: add the helper next to `igrpLocaleCookieOptions`
- Modify: `packages/framework/next/src/i18n/index.ts`: export it
- Modify: `packages/framework/next/src/i18n/sync-cookie.ts:27`
- Modify: `packages/framework/next/src/i18n/server/set-locale.ts:52-56`
- Test: `packages/framework/next/src/i18n/__tests__/config.test.ts`, `sync-cookie.test.ts`, `set-locale.test.ts`

**Interfaces:**
- Produces: `igrpIsSecureRequest(headers: Pick<Headers, 'get'>, fallbackProtocol?: string): boolean`. It is exported from `@igrp/framework-next/i18n` and is Edge-safe.
- Rule:
  1. First comma-separated `x-forwarded-proto` value, trimmed. `https` means true; any other value means false.
  2. Else, when `fallbackProtocol` is given, it is `=== 'https:'`.
  3. Else, `origin` starts with `https:`.

- [ ] **Step 1: Write the failing tests**

`config.test.ts`, `describe("igrpIsSecureRequest")`:
- `new Headers({ "x-forwarded-proto": "https" })` → `true`.
- `new Headers({ "x-forwarded-proto": "https,http" })` → `true`.
- `new Headers({ "x-forwarded-proto": "http" })` with fallback `"https:"` → `false` (the header wins).
- `new Headers()` with fallback `"https:"` → `true`.
- `new Headers({ origin: "https://a.b" })` → `true`.
- `new Headers()` → `false`.

`sync-cookie.test.ts`: `"marks the cookie Secure behind a TLS proxy"`. Build `new NextRequest('http://app.internal/x', { headers: { 'x-forwarded-proto': 'https' } })` with the token locale `en`, session-first. Expect `res.cookies.get('IGRP_LOCALE')?.secure` to be `true`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @igrp/framework-next test -- src/i18n/__tests__/config.test.ts src/i18n/__tests__/sync-cookie.test.ts`
Expected: FAIL. `igrpIsSecureRequest` is not exported, and `secure` is `false`.

- [ ] **Step 3: Implement**

Add `igrpIsSecureRequest` to `config.ts`.
- `sync-cookie.ts`: `const secure = igrpIsSecureRequest(request.headers, request.nextUrl.protocol);`
- `set-locale.ts`: `const secure = igrpIsSecureRequest(await headers());`. The existing `set-locale.test.ts` cases must stay green unchanged.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @igrp/framework-next test -- src/i18n`
Expected: PASS.

- [ ] **Step 5: Changeset and commit**

Add a changeset: `@igrp/framework-next` patch. Summary: "igrpSyncLocaleCookie honours x-forwarded-proto, like igrpSetLocale (new igrpIsSecureRequest)."

```bash
git add packages/framework/next/src/i18n .changeset
git commit -m "fix(next): one Secure rule for both locale cookie writers"
```

---

### Task 3: Chrome copy for every framework error code

`IGRPChromeErrorCode` (next-ui) restates `IgrpErrorCode` (next) by hand and lacks `IGRP_I18N_CONFIG_INVALID`. That error therefore shows the generic copy.

**Files:**
- Modify: `packages/framework/next-ui/src/i18n/strings.ts:11-18` (type), `:232` (pt `errorCodes`)
- Modify: `packages/framework/next-ui/src/i18n/strings.en.ts:86`, `strings.fr.ts:87`
- Test: `packages/framework/next/src/i18n/__tests__/strings.test.ts` (type-level check that the two unions match; it lives in `next` because `next` depends on `next-ui`)

**Interfaces:**
- Produces: `IGRPChromeErrorCode` gains `'IGRP_I18N_CONFIG_INVALID'`.
- Copy, exact:
  - pt: title `Configuração de idiomas inválida`; description `A configuração de idiomas da aplicação (IGRP_FORMAT_LOCALES ou i18n) contém valores em falta ou inválidos. Corrija a configuração e reinicie o servidor.`
  - en: title `Invalid language configuration`; description `The application's language settings (IGRP_FORMAT_LOCALES or i18n) have missing or invalid values. Fix the configuration and restart the server.`
  - fr: title `Configuration des langues invalide`; description `Les paramètres de langue de l'application (IGRP_FORMAT_LOCALES ou i18n) contiennent des valeurs manquantes ou invalides. Corrigez la configuration et redémarrez le serveur.`

- [ ] **Step 1: Write the failing type test**

In `strings.test.ts`, add the check below with a `it("chrome copy covers every IgrpErrorCode", () => expect(true).toBe(true))` wrapper. `tsc` is the real check.

```ts
import type { IGRPChromeErrorCode } from '@igrp/framework-next-ui';
import type { IgrpErrorCode } from '../../errors.js';
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const sameCodes: Exact<IgrpErrorCode, IGRPChromeErrorCode> = true;
```

- [ ] **Step 2: Verify it fails**

Run: `pnpm --filter @igrp/framework-next exec tsc --noEmit -p .`
Expected: FAIL. `Type 'true' is not assignable to type 'false'` on `sameCodes`.

- [ ] **Step 3: Add the code to the union and the three catalogs, using the copy above**

- [ ] **Step 4: Verify it passes**

Run: `pnpm build:next-ui && pnpm --filter @igrp/framework-next exec tsc --noEmit -p . && pnpm --filter @igrp/framework-next-ui test -- src/i18n`
Expected: no type errors; parity test PASS.

- [ ] **Step 5: Changeset and commit**

Add changesets: `@igrp/framework-next-ui` patch and `@igrp/framework-next` patch (the test only, so a patch is fine). Summary: "Chrome copy for IGRP_I18N_CONFIG_INVALID; a type test keeps the chrome codes equal to IgrpErrorCode."

```bash
git add packages/framework/next-ui/src/i18n packages/framework/next/src/i18n/__tests__/strings.test.ts .changeset
git commit -m "fix(next-ui): chrome copy for IGRP_I18N_CONFIG_INVALID; type-check code parity"
```

---

### Task 4: Template lints its error and layout files; session-first recipe

The template's `check-literals` list skips `src/app/global-error.tsx`, every `error.tsx`, and `src/app/(igrp)/layout.tsx`. The middleware comment also says "import from `@/i18n` never" without showing what a session-first app passes instead, since `i18n` is not Edge-safe.

**Files:**
- Modify: `templates/demo-v1/package.json:23` (`lint:i18n`)
- Modify: any template file the widened scan flags (expected: none or a few in `error.tsx` / `global-error.tsx`)
- Modify: `templates/demo-v1/src/middleware.ts:245-249` (comment)
- Modify: `templates/demo-v1/docs/I18N.md` ("Session-first" section)

**Interfaces:**
- Produces: the documented recipe that the App Center plan copies.

```ts
// middleware.ts, session-first apps only
import { IGRP_LOCALES, igrpSyncLocaleCookie } from "@igrp/framework-next/i18n";
const LOCALE_SYNC = { locales: IGRP_LOCALES, resolution: "session-first" } as const;
// …at the end of the authenticated branch:
return igrpSyncLocaleCookie(request, nextWithPath(), token.locale, LOCALE_SYNC);
```

Switcher wrapper (client), so the session reflects the change without a new login:

```tsx
const { update } = useSession();
<IGRPLocaleSwitcher action={setLocale} onChanged={async (locale, persisted) => { if (persisted) await update({ locale }); }} />
```

`onChanged` must return the `update` promise. `igrpRunLocaleChange` awaits it before `router.refresh()`. A fire-and-forget `void update(…)` lets the refresh render with the old session locale, so a session-first page stays in the previous language.

`persistLocale` must resolve `false` without calling the API when there is no session (login and invite pages).

- [ ] **Step 1: Widen the scan**

Append these to the `check-literals` paths in `lint:i18n`. It takes paths, not globs, and `src/app/(auth)` is already covered.
- `src/app/global-error.tsx`
- `src/app/error.tsx`
- `"src/app/(igrp)/error.tsx"`
- `"src/app/(igrp)/layout.tsx"`

- [ ] **Step 2: Run it**

Run: `pnpm --dir templates/demo-v1 lint:i18n`
Expected: either `no hardcoded strings`, or a list of findings.

- [ ] **Step 3: Fix each finding**

Move the string to the template catalogs (pt/en/fr) under the namespace the file already uses, or mark a non-language literal with `// igrp-i18n-ignore`. Rerun until `no hardcoded strings`. `check-catalogs` must stay at 100%.

- [ ] **Step 4: Replace the middleware comment and write the docs section**

Replace the middleware comment with the recipe above, kept as a comment because the template is cookie-first. Add the same three snippets under "Session-first" in `templates/demo-v1/docs/I18N.md`.

- [ ] **Step 5: Verify the template builds**

Run: `pnpm --dir templates/demo-v1 build`
Expected: lint, lint:i18n and next build succeed.

- [ ] **Step 6: Commit**

```bash
git add templates/demo-v1
git commit -m "fix(template): lint error screens and the app layout for literals; document session-first middleware"
```

---

### Task 5: Release 0.2.0-beta.11 and migration 69

**Files:**
- Create: `packages/framework/template-migrator/migrations/demo-v1/69.MIGRATIONS-21102026.md`
- Create: `packages/framework/template-migrator/migrations/demo-v1/payload/69/…` (only for template files Task 4 changed, apart from `package.json`)
- Modify: `templates/demo-v1/package.json` (dependency versions after `changeset version`)
- Modify: `templates/demo-v1/.igrp-migrations-lock.json`: record 69 as applied, as 63 did
- Create: `.changeset/template-migration-69.md`, modelled on `.changeset/template-migration-63-i18n.md`

**Interfaces:**
- Consumes: the package versions that `pnpm changeset version` produces (expected `@igrp/framework-next` and `-ui` `0.2.0-beta.11`, `@igrp/framework-next-i18n` `0.2.0-beta.3`). Use the versions it actually writes.

- [ ] **Step 1: Version the packages**

Run `pnpm changeset version` and note the new versions. Commit `chore: version packages`, as the release flow does.

- [ ] **Step 2: Write migration 69**

Model it on `67.MIGRATIONS-20102026.md`:
- `id: 69-resync-framework-beta11`
- `requires: ["68-dev-lucide-icon-map"]`
- one `deps.bump` step with the new ranges
- `file.write` steps for the template files Task 4 changed (middleware comment, docs, any `error.tsx` fixes)

The "After migrating" section must say:
- `check-catalogs` now fails on missing keys, so add `--allow-missing` while a locale is incomplete.
- Manual step: append the new paths to `lint:i18n` (the migrator has no `scripts` step).

- [ ] **Step 3: Verify the migrator accepts it**

Run: `pnpm --filter @igrp/template-migrator test`
Expected: PASS, including the requires-chain and step validation tests.

- [ ] **Step 4: Bump the template's own dependencies to the same versions**

Then run `pnpm build:framework && pnpm --dir templates/demo-v1 build`.
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add packages/framework/template-migrator templates/demo-v1
git commit -m "feat(template-migrator): migration 69 pins framework 0.2.0-beta.11"
```

---

### Task 6: Bring the i18n spec and plans up to date

**Files:**
- Modify: `docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md`
- Modify: `docs/superpowers/plans/2026-10-12-framework-i18n-v2-plan-{1..5}-*.md`, `docs/superpowers/plans/2026-10-20-i18n-review-fixes.md`

- [ ] **Step 1: Update the spec**

- Status line: "pending implementation plan" becomes "Implemented in 0.2.0-beta.8 to beta.10; follow-ups in `2026-10-21-i18n-app-center-readiness.md`".
- Correct every "migration 56" to "migration 58".
- Rename `igrpRenderWithIntl` to `IGRPIntlTestProvider`.
- Update D-5 to: "Verified 2026-10-21: the access-management IdP emits `locale` from `metadata.locale` under the `profile` scope (`ClaimsEnrichmentService.java:308`), and stores the upstream IdP's `locale` claim into metadata (`IgrpOidcUserService.java:387`)."
- Appendix: show the switcher wrapper's `onChanged(locale, persisted)` signature.

- [ ] **Step 2: Tick the implemented plans**

Tick the checkboxes of plans 1–5 and the review-fixes plan, whose commits are on this branch. Leave any step whose commit you cannot find unticked, with a note.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers
git commit -m "docs(i18n): mark v2 implemented, record D-5, fix migration numbers"
```
