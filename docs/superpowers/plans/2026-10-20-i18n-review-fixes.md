# i18n Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 13 findings of the 2026-10-20 i18n deep review across `framework-next`, `design-system`, `framework-next-ui`, `framework-next-i18n`, `templates/demo-v1`, the template migrator and CI.

**Architecture:** The fixes stay inside the existing layering: the design-system (DS) catalog owns DS strings, the chrome catalog owns next-ui strings, and app messages own template strings. Primitives read `useIGRPi18n()` for their defaults; they already read `useIGRPLocale()`, so this adds no new prop plumbing. The DS context gains a `timeZone` alongside `locale`. Template edits ship as migration 63, and migration 58 gets prose-only edits (its `steps` hash must not change).

**Tech Stack:** Next 15, next-intl 4, React 19, Vitest, TypeScript compiler API (CLI), date-fns, react-phone-number-input, GitLab CI.

**Spec:** the review findings in this session, restated per task below (no separate spec file).

## Global Constraints

- Read `.claude/shared/hard-rules.md` first. Every changeset is `patch`. No `Co-Authored-By` trailers. Don't edit `dist/`.
- Build order: `framework-next-auth → framework-next-types → design-system → framework-next-ui → framework-next`. Run `pnpm build:framework` before consuming changed APIs downstream.
- Lint/format: framework packages use ESLint + Prettier; `templates/demo-v1` uses Biome.
- Every `templates/demo-v1` change ships as a template-migrator migration (63). Run `pnpm --filter @igrp/template-migrator sync:template-lock` after adding it, and keep `check:drift` green.
- Don't change the `steps` of migration 58. `contentHash` = `hashSteps(steps)`, so a steps edit marks it stale in every app that applied it. Edits to its front-matter fields other than `steps`, and to its prose, are safe.
- DS default strings stay pt-PT and are overridable via the catalog (pt/en/fr parity tests must pass).
- Format locales are always region-qualified. Never pass a bare `pt` to `Intl`.
- No release in this plan. Don't run `version:changesets` or publish.

## Review Focus

1. A date-only string (`"2026-10-20"`) in any zone west of UTC must render as 20/10/2026, on both server and client. Pinned in Tasks 1 and 4.
2. `formatDateTime(v, { dateStyle: "short", timeStyle: "short" })` must not throw. Pinned in Task 1.
3. A server action that calls the Access Management (AM) API, made by a user with the `IGRP_LOCALE=en` cookie, must send `Accept-Language: en`. Pinned in Task 2.
4. `{ok ? "Guardado" : "Erro"}` in JSX must be flagged by `check-literals`. Pinned in Task 8.
5. A user who picks FR on `/login` must see the heading, description and carousel in French. Pinned in Task 9 (manual check in the preview).

---

### Task 1: framework-next format helpers (findings #1 framework part, #2, relative-time rounding)

**Files:**
- Modify: `packages/framework/next/src/i18n/format.ts`
- Test: `packages/framework/next/src/i18n/__tests__/format.test.ts`
- Create: `.changeset/i18n-format-date-only.md` (patch, `@igrp/framework-next`)

**Interfaces:**
- Produces: unchanged public signatures of `igrpFormatDate`, `igrpFormatDateTime` and `igrpFormatRelativeTime`. Adds the module-private `isDateOnly(value: IGRPDateInput): value is string`.

- [ ] **Step 1: Write the failing tests**

```ts
it('formats a date-only string as that calendar day in any zone', () => {
  expect(igrpFormatDate('2026-10-20', 'pt-CV', undefined, 'Atlantic/Cape_Verde')).toBe('20/10/2026');
  expect(igrpFormatDate('2026-10-20', 'pt-CV', undefined, 'America/New_York')).toBe('20/10/2026');
  expect(igrpFormatDate('2026-10-20', 'pt-CV', undefined, 'Asia/Tokyo')).toBe('20/10/2026');
});
it('accepts dateStyle/timeStyle in igrpFormatDateTime', () => {
  expect(() =>
    igrpFormatDateTime(new Date(), 'en-GB', { dateStyle: 'short', timeStyle: 'short' }),
  ).not.toThrow();
});
it('promotes a rounded value that fills the next unit', () => {
  const now = new Date('2026-10-20T12:00:00Z');
  expect(igrpFormatRelativeTime(new Date(now.getTime() + 59_600), now, 'en-GB')).toBe('in 1 minute');
  expect(igrpFormatRelativeTime(new Date(now.getTime() + 30_000), now, 'en-GB')).toBe('in 30 seconds');
});
```

- [ ] **Step 2: Run, expect 3 FAILs**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n/__tests__/format.test.ts`
Expected: 3 failures: `19/10/2026`, `TypeError: Invalid option`, `in 60 seconds`.

- [ ] **Step 3: Implement**
  - `isDateOnly`: tests `/^\d{4}-\d{2}-\d{2}$/` on strings. In `igrpFormatDate`, when it holds, format with `timeZone: 'UTC'`, overriding both `timeZone` and `options.timeZone`, because `new Date('YYYY-MM-DD')` is UTC midnight. Comment the why in one line.
  - `igrpFormatDateTime`: when `options.dateStyle || options.timeStyle`, pass `options` unmerged; otherwise keep `{ ...DATE_TIME_OPTIONS, ...options }`.
  - `igrpFormatRelativeTime`: after picking `[unit, size]` at index `i`, if `i + 1 < RELATIVE_UNITS.length && Math.abs(Math.round(diff / size)) * size >= RELATIVE_UNITS[i + 1][1]`, step up one unit.

- [ ] **Step 4: Run the whole i18n suite, expect PASS**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n`

- [ ] **Step 5: Commit** — `fix(next/i18n): date-only strings, dateStyle in formatDateTime, relative-time rounding`

---

### Task 2: Accept-Language in server actions (finding #3)

**Files:**
- Modify: `packages/framework/next/src/lib/permissions.ts:159-187` (`igrpEnsureAccessClientConfig`)
- Test: `packages/framework/next/src/lib/__tests__/permissions-action-context.test.ts`
- Changeset: `@igrp/framework-next` patch

**Interfaces:**
- Consumes: `IGRP_LOCALE_COOKIE`, `igrpNormalizeLocale` and `igrpParseAcceptLanguage` from `../i18n/config.js` (pure, Edge-safe).
- Produces: the module-private `async function recoverLocaleFromRequest(): Promise<IGRPLocale | undefined>`. It reads the cookie first, then the `accept-language` header, via dynamic `import('next/headers')` like `recoverAccessTokenFromCookies`, and returns `undefined` on any throw.

- [ ] **Step 1: Write the failing test** (use the `resetModules` + `doMock` pattern already in this file; seed the ALS store inside the test, not in `beforeEach`)

```ts
it('seeds locale from the IGRP_LOCALE cookie in an action context', async () => {
  // mock next/headers: cookies() → [{ name: 'IGRP_LOCALE', value: 'en' }, <session cookie>], headers() → accept-language 'fr'
  const cfg = await igrpEnsureAccessClientConfig();
  expect(cfg.locale).toBe('en');
});
it('falls back to Accept-Language when there is no locale cookie', async () => {
  // cookies() → session cookie only, headers() → 'fr-FR,fr;q=0.9'
  expect((await igrpEnsureAccessClientConfig()).locale).toBe('fr');
});
```

- [ ] **Step 2: Run, expect FAIL** (`locale` is `undefined`)

Run: `pnpm --filter @igrp/framework-next exec vitest run src/lib/__tests__/permissions-action-context.test.ts`

- [ ] **Step 3: Implement.** Keep the synchronous `igrpSetAccessClientConfig({ token: '', baseUrl })` prologue as the first statement before any `await`. Then `const [token, locale] = await Promise.all([recoverAccessTokenFromCookies(), recoverLocaleFromRequest()])`, and pass `...(locale ? { locale } : {})` into the second `igrpSetAccessClientConfig`. Keep `current.locale` when it is already set.

- [ ] **Step 4: Run all `src/lib` tests, expect PASS**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/lib`

- [ ] **Step 5: Commit** — `fix(next): send Accept-Language from server actions`

---

### Task 3: framework-next small i18n fixes (findings #9, #11, #13: merge cache, switcher live region)

**Files:**
- Modify: `packages/framework/next/src/i18n/server/strings.ts` (`mergeChrome`)
- Modify: `packages/framework/next/src/i18n/server/set-locale.ts` (secure detection)
- Modify: `packages/framework/next/src/i18n/messages/index.ts` (cache key)
- Modify: `packages/framework/next/src/i18n/client/locale-switcher.tsx` (live region)
- Tests: `__tests__/strings.test.ts`, `__tests__/set-locale.test.ts`, `__tests__/messages.test.ts`, `__tests__/client.test.tsx`
- Changeset: `@igrp/framework-next` patch

- [ ] **Step 1: Write failing tests**

```ts
// strings.test.ts
it('ignores undefined chrome overrides', () => {
  const i18n = igrpDefineI18n({ defaultLocale: 'pt', overrides: { pt: { chrome: { navUser: { logout: undefined } } } } });
  expect(igrpGetChromeStrings(i18n, 'pt').navUser.logout).toBe(IGRP_CHROME_STRINGS_PT.navUser.logout);
});
// set-locale.test.ts — headers(): no x-forwarded-proto, origin 'https://app.cv'
it('marks the cookie Secure when the origin is https', async () => {
  await igrpSetLocale(i18n, 'en');
  expect(cookieSet).toHaveBeenCalledWith('IGRP_LOCALE', 'en', expect.objectContaining({ secure: true }));
});
// messages.test.ts
it('does not reuse a merge across defaultLocales for the same catalogs object', () => {
  const app = { pt: { x: { a: 'pt' } }, en: { x: { a: 'en' } } };
  expect(igrpMergeMessages({ defaultLocale: 'pt' }, 'fr', app).x).toEqual({ a: 'pt' });
  expect(igrpMergeMessages({ defaultLocale: 'en' }, 'fr', app).x).toEqual({ a: 'en' });
});
// client.test.tsx — action resolves { success: false, ... }
it('announces a failed change in a status region', async () => {
  // open the menu, pick 'en'
  expect(await screen.findByRole('status')).toHaveTextContent(IGRP_MESSAGES_PT.i18n.localeSwitcher.changeError);
});
```

- [ ] **Step 2: Run, expect 4 FAILs**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n`

- [ ] **Step 3: Implement**
  - `mergeChrome`: copy only the patch entries whose value is a `string`, the same rule as the DS `merge.ts`.
  - `set-locale.ts`: `secure = proto ? proto === 'https' : headerStore.get('origin')?.startsWith('https:') === true`.
  - `messages/index.ts`: key the inner `Map` by `` `${i18n.defaultLocale}:${locale}` `` and widen its type to `Map<string, …>`.
  - Switcher: render `<span role="status" className="sr-only">{failed ? t('changeError') : ''}</span>` as a sibling of the `DropdownMenu`, wrapped in a fragment.

- [ ] **Step 4: Run, expect PASS** (same command)
- [ ] **Step 5: Commit** — `fix(next/i18n): chrome override merge, Secure cookie, merge cache key, switcher status`

---

### Task 4: DS time zone and date-only dates (finding #1 DS part)

**Files:**
- Modify: `packages/design-system/src/i18n/context.tsx`: add a `timeZone?: string` prop on `IGRPI18nProvider` and a `useIGRPTimeZone(): string | undefined` hook backed by a third context.
- Modify: `packages/design-system/src/lib/utilities.ts`: add `export function igrpIsDateOnly(value: unknown): value is string` (same regex as Task 1).
- Modify: `packages/design-system/src/index.ts`: export `useIGRPTimeZone` and `igrpIsDateOnly` next to `useIGRPLocale`.
- Modify: `horizon/data-table/cell.tsx:169-173`, `horizon/data-table/filter.tsx:53-58`, `horizon/pdf-viewer.tsx:108-119`
- Modify: `packages/framework/next/src/i18n/client/provider.tsx`: pass `timeZone={timeZone}` to `IGRPI18nProvider`.
- Test: `packages/design-system/src/i18n/__tests__/context.test.tsx` and `packages/design-system/src/components/horizon/data-table/__tests__/cell-date.test.tsx` (create)
- Changesets: `@igrp/igrp-framework-react-design-system` patch, `@igrp/framework-next` patch

**Interfaces:**
- Produces: `useIGRPTimeZone(): string | undefined` and `igrpIsDateOnly(value: unknown): value is string`. Task 6 relies on both.

- [ ] **Step 1: Write failing tests**

```tsx
it('renders a date-only cell as that calendar day', () => {
  render(<IGRPI18nProvider locale="pt-CV" timeZone="Atlantic/Cape_Verde"><IGRPDataTableCellDate date="2026-10-20" /></IGRPI18nProvider>);
  expect(screen.getByText('20/10/2026')).toBeInTheDocument();
});
it('formats timestamps in the provider time zone', () => {
  render(<IGRPI18nProvider locale="pt-CV" timeZone="Asia/Tokyo"><IGRPDataTableCellDate date="2026-10-12T23:30:00Z" /></IGRPI18nProvider>);
  expect(screen.getByText('13/10/2026')).toBeInTheDocument();
});
it('useIGRPTimeZone is undefined without a provider', () => { /* renderHook → undefined */ });
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/i18n src/components/horizon/data-table`

- [ ] **Step 3: Implement.**
  - Intl path: `timeZone: igrpIsDateOnly(date) ? 'UTC' : (dateOptions?.timeZone ?? tz)`.
  - date-fns `format` path (`dateFormat`): parse date-only strings with the existing `parseLocalDate`. Add a comment: `shortcut: date-fns formats timestamps in the runtime zone, upgrade to @date-fns/tz if a dateFormat cell must show times across zones`.
  - Apply the same rule in `filter.tsx` and `pdf-viewer.tsx`.
- [ ] **Step 4: Run, expect PASS.** Then run `pnpm build:ds` and the framework-next `src/i18n` tests.
- [ ] **Step 5: Commit** — `fix(ds): time zone in i18n context; date-only values keep their calendar day`

---

### Task 5: DS catalog-driven primitive and Horizon strings (finding #6 DS part)

**Files:**
- Modify: `packages/design-system/src/i18n/strings.ts`, `strings.en.ts`, `strings.fr.ts`. Add these keys, with the pt values given; write en/fr equivalents.

| Key (new unless noted) | pt |
| --- | --- |
| `dialog.close` | `Fechar` |
| `sheet.close` | `Fechar` |
| `sidebar.toggle` | `Alternar barra lateral` |
| `sidebar.title` | `Barra lateral` |
| `sidebar.description` | `Mostra a barra lateral em dispositivos móveis.` |
| `carousel.previous` / `carousel.next` | `Diapositivo anterior` / `Diapositivo seguinte` |
| `pagination.previous` / `pagination.next` | `Anterior` / `Seguinte` |
| `pagination.goToPrevious` / `pagination.goToNext` | `Ir para a página anterior` / `Ir para a página seguinte` |
| `stepper.step` (existing group) | `Passo` |
| `copyTo.copied` / `copyTo.copyFailed` / `copyTo.clickToCopy` (existing group) | the current literals in `copy-to.tsx:44-46` |
| `datePicker.startDate` / `datePicker.endDate` (existing group) | `Data Início` / `Data Fim` |
| `modalDialog.contentDescription` (existing group) | `Conteúdo do diálogo` |
| `inputAddons.selectOption` | `Selecionar opção` |

- Modify: `primitives/{dialog,sheet,sidebar,carousel,pagination,stepper}.tsx`. Each reads `useIGRPi18n()` for its default. Where a prop already exists (e.g. command `title`), the prop still wins.
- Modify: `horizon/copy-to.tsx:44-46`, `horizon/calendar/{single,range,multiple}-time.tsx:28-29`, `horizon/data-table/filter.tsx:119` (use the existing `dataTable.filterSelectPlaceholder`), `horizon/data-table/action-button-icon.tsx:325`, `horizon/input/with-addons.tsx:74`
- Test: `src/i18n/__tests__/parity.test.ts` (existing, must pass) and `src/components/primitives/__tests__/i18n-defaults.test.tsx` (create)
- Changeset: DS patch

- [ ] **Step 1: Write failing tests**

```tsx
it.each(['en', 'fr'] as const)('primitives use the %s catalog', (l) => {
  const strings = l === 'en' ? IGRP_I18N_DEFAULTS_EN : IGRP_I18N_DEFAULTS_FR;
  render(<IGRPI18nProvider strings={strings}><Dialog open><DialogContent><DialogTitle>t</DialogTitle></DialogContent></Dialog></IGRPI18nProvider>);
  expect(screen.getByText(strings.dialog.close)).toBeInTheDocument();
});
it('sidebar trigger is labelled from the catalog', () => { /* SidebarProvider + SidebarTrigger → getByRole('button', { name: IGRP_I18N_DEFAULTS_PT.sidebar.toggle }) */ });
```

- [ ] **Step 2: Run, expect FAIL** (types missing)
- [ ] **Step 3: Add the keys to all three catalogs and wire each file listed above**
- [ ] **Step 4: Run** `pnpm --filter @igrp/igrp-framework-react-design-system test`. **Expect PASS**, including parity.
- [ ] **Step 5: Commit** — `fix(ds): translate primitive and Horizon defaults via the catalog`

---

### Task 6: DS locale-aware formatting (finding #10, phone names, currency, calendar Intl locale)

**Files:**
- Modify: `horizon/input/date-picker/{single,range,multiple}.tsx`, `lib/calendar-utils.ts:42`, `horizon/data-table/cell.tsx:172`. Pass `{ locale: igrpDateFnsLocale(useIGRPLocale()) }` to date-fns `format`/`parse`; non-hook utilities take a `locale` parameter.
- Modify: `horizon/input/file.tsx:228-232`. `formatFileSize` uses `new Intl.NumberFormat(locale, { style: 'unit', unit: 'kilobyte' | 'megabyte' | 'byte', maximumFractionDigits: 1 })`.
- Modify: `horizon/charts/lib.ts:12-22`. Add a `locale: string` parameter and use `Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 })`. Update its callers to pass `useIGRPLocale()`.
- Modify: `horizon/input/phone.tsx:161,206`. Pass `labels` built from `getCountries()` and `new Intl.DisplayNames([locale], { type: 'region' }).of(code)`, memoised on `locale`.
- Modify: `horizon/data-table/cell.tsx:116`. Remove the `"USD"` default. Without `currency`, a `formatStyle: "currency"` cell formats as `decimal`.
- Modify: `primitives/calendar.tsx:33`. Use `locale?.code` only when `new Intl.Locale(locale.code).region` is set; otherwise use `igrpLocale`.
- Update: `lib/date-input-format.test.ts:85` to the locale-correct expectation.
- Test: `src/components/horizon/__tests__/locale-formatting.test.tsx` (create)
- Changeset: DS patch

- [ ] **Step 1: Write failing tests**

```tsx
it('formats dd MMM yyyy with the pt month', () => { /* IGRPInputDatePicker dateFormat="dd MMM yyyy", locale pt-CV, value 2026-08-26 → '26 ago. 2026' (assert via igrpDateFnsLocale output, not a hard-coded string, if the abbreviation differs) */ });
it('file sizes use the locale decimal separator', () => { /* pt-PT: 1572864 bytes → contains '1,5' */ });
it('compact chart values follow the locale', () => { expect(formatChartValue(1200, 'pt-PT')).toBe('1,2 mil'); });
it('phone country names follow the locale', () => { /* fr-FR → option 'Cap-Vert' present */ });
it('amount cell without currency shows no currency symbol', () => { /* value 10 → not contain 'US$' or '$' */ });
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement as listed above.** `formatChartValue` keeps a `locale` default of `IGRP_DEFAULT_LOCALE`, so existing external callers still compile.
- [ ] **Step 4: Run the full DS suite plus storybook verify** (`pnpm --filter @igrp/igrp-framework-react-design-system test`, then `storybook build`, per memory `reference_storybook_verify`). **Expect PASS.**
- [ ] **Step 5: Commit** — `fix(ds): locale-aware dates, sizes, chart values, phone countries; no USD default`

---

### Task 7: next-ui chrome fixes (finding #6 next-ui part, dead catalog group, no-config note)

**Files:**
- Modify: `packages/framework/next-ui/src/auths/form.tsx:90-92`. Always call `setAuthError(texts.signInError ?? chrome.authForm.signInError)` and keep `console.error`.
- Modify: `packages/framework/next-ui/src/errors/global.tsx:93`. Set `alt=""` (the image is decorative).
- Modify: `packages/framework/next-ui/src/templates/header.tsx:176-188`. Show the toast only when `process.env.NODE_ENV !== 'production'`; this is a developer message, so it stays untranslated.
- Delete the `themeSelector` group and `IGRPThemeSelectorLabels` from `next-ui/src/i18n/strings{,.en,.fr}.ts` and any barrel export.
- Modify: `packages/framework/next/README.md`, i18n section. Add one line: without `config.i18n`, chrome follows the `IGRP_LOCALE` cookie but DS strings stay pt; set `config.i18n` to localise both.
- Test: `next-ui/src/auths/__tests__/form.test.tsx` (create or extend)
- Changesets: `@igrp/framework-next-ui` patch (note the removed type), `@igrp/framework-next` patch (README)

- [ ] **Step 1: Write the failing test**

```tsx
it('shows the catalog sign-in error, not the thrown message', async () => {
  signIn.mockRejectedValue(new TypeError('Failed to fetch'));
  // submit
  expect(await screen.findByText(IGRP_CHROME_STRINGS_PT.authForm.signInError)).toBeInTheDocument();
  expect(screen.queryByText('Failed to fetch')).toBeNull();
});
```

- [ ] **Step 2: Run, expect FAIL** — `pnpm --filter @igrp/framework-next-ui exec vitest run src/auths`
- [ ] **Step 3: Implement the four edits above**
- [ ] **Step 4: Run** `pnpm --filter @igrp/framework-next-ui test && pnpm --filter @igrp/framework-next-ui typecheck`. **Expect PASS**, including parity.
- [ ] **Step 5: Commit** — `fix(next-ui): localized sign-in error, dev-only header toast, drop dead themeSelector strings`

---

### Task 8: next-i18n CLI (findings #4 literal checks, #12)

**Files:**
- Modify: `packages/framework/next-i18n/src/literals.ts`
  - Change `literalText(node): string | undefined` to `literalTexts(node): string[]`. It recurses into `ConditionalExpression` (`whenTrue`, `whenFalse`), into `&&` (right operand only), and into `||`/`??` (both operands).
  - Add `text`, `message` and `emptyText` to `USER_FACING_PROPS`.
  - New rule `hardcoded locale`: a string-literal first argument to `new Intl.<Ctor>(…)` or to `.toLocaleString/.toLocaleDateString/.toLocaleTimeString(…)` is flagged as `hardcoded locale "<tag>": use useIGRPFormat`.
  - `listTsxFiles` becomes `listSourceFiles`, matching `.ts` and `.tsx` and excluding `.test.` and `.d.ts`. JSX rules only fire in `.tsx`, because TS parses `.ts` without JSX.
- Modify: `packages/framework/next-i18n/src/cli.ts`
  - `positionals()` consumes a value only for `--default` and `--framework-namespaces`, and accepts `--name=value`.
  - An unknown `--flag` prints usage and returns 2.
  - `main` wraps both commands in `try/catch`. On error it prints `error <message>` and returns 2.
- Modify: `packages/framework/next-i18n/src/catalogs.ts`
  - Wrap `JSON.parse` so it reports `"<locale>: invalid JSON (<message>)"`.
  - Flag `""` in non-default catalogs: `"<locale>: "<key>" is empty"`.
  - Plural categories: options outside `new Intl.PluralRules(locale).resolvedOptions().pluralCategories`, other than `=N`, produce `"<locale>: "<key>" uses plural category "<c>" that <locale> never selects"`.
- Tests: `src/__tests__/literals.test.ts`, `src/__tests__/catalogs.test.ts`, and `src/__tests__/cli.test.ts` (create; spawn `node dist/cli.js` after `build`, or export `main` and test it directly)
- Changeset: `@igrp/framework-next-i18n` patch

- [ ] **Step 1: Write failing tests**

```ts
it.each([
  ['<p>{ok ? "Guardado" : "Erro"}</p>', 2],
  ['<p>{err && "Falhou"}</p>', 1],
  ['<X placeholder={ok ? "Nome" : "Apelido"} />', 2],
  ['<Spinner text="Aguarde..." />', 1],
])('flags %s', (src, n) => expect(findLiteralStrings(src, 'a.tsx')).toHaveLength(n));
it('flags hardcoded Intl locales in .ts', () => {
  expect(findLiteralStrings('new Intl.DateTimeFormat("pt").format(d); d.toLocaleDateString("pt-BR")', 'a.ts')).toHaveLength(2);
});
it('does not flag {cond && <Foo/>} or className ternaries', () => {
  expect(findLiteralStrings('<p className={a ? "x" : "y"}>{a && <b/>}</p>', 'a.tsx')).toHaveLength(0);
});
// catalogs
it('reports invalid JSON instead of throwing', () => { /* fr.json = '{' → errors contains 'fr: invalid JSON' */ });
it('reports empty translations', () => { /* en.json { a: "" } → 'en: "a" is empty' */ });
it('reports plural categories the locale never selects', () => { /* fr: {n, plural, few {x} other {y}} → mentions "few" */ });
// cli
it('does not swallow the path after an unknown flag', () => { /* main(['check-literals','src/a','--verbose','src/b']) → 2 */ });
```

- [ ] **Step 2: Run, expect FAIL** — `pnpm --filter @igrp/framework-next-i18n test`
- [ ] **Step 3: Implement as listed above**
- [ ] **Step 4: Run** `pnpm --filter @igrp/framework-next-i18n test && pnpm --filter @igrp/framework-next-i18n build && pnpm --filter @igrp/framework-next-template lint:i18n`. **Expect** tests PASS. The template lint now reports the strings Task 9 removes; record the list.
- [ ] **Step 5: Commit** — `fix(next-i18n): catch literals in conditionals, hardcoded Intl locales, robust CLI and catalog checks`

---

### Task 9: Template strings and migration 63 (findings #5, #7, #8 docs, global-error note)

**Files (template; Biome formatting):**
- `src/config/login.ts`: drop `welcome`, `description` and `copyright` from `texts`, and drop `title`/`description` from `carouselItems`. Keep the image, labels, URLs and `sliderPosition`. Export `carouselImages` (the three image paths).
- `src/app/(auth)/login/page.tsx`: `const t = await getTranslations('login')`. Build `texts` (`welcome`, `description`, `copyright`) and the carousel items from `t('carousel.workflow.title')` etc. (keys `workflow`, `security`, `collaboration`, each with `title` and `description`).
- `src/i18n/messages/{pt,en,fr}.json`: new namespace `login` with the keys above, using the current en carousel copy translated to pt/fr. Add `notFound.description`. Add `auth.signingOut` (`A terminar sessão...`) and `auth.pleaseWait` (`Aguarde...`), plus a key for every other finding that `lint:i18n` reported under `src/app/(auth)` in Task 8 Step 4.
- `src/app/(auth)/login/logout-completion.tsx:59`, `src/app/(auth)/logout/page.tsx:203`, `silent-sign-in.tsx:49`: use those keys.
- `src/app/not-found.tsx`: `generateMetadata` with the title from `getTranslations('errors.status')('404')` and the description from `t('notFound.description')`. This removes the Brazilian phrasing.
- `src/app/layout.tsx:23-24`: `title` and `description` come from `getTranslations('app')('title')`.
- `src/components/home-overview.tsx:120-122`: change the placeholders to `<module>`, `<route>`, `<permission>`.
- `src/app/global-error.tsx:32-38`: add a one-line comment that it uses the default format locales because env isn't readable in that client-only boundary (accepted limit).
- `package.json` `lint:i18n`: append `src/config "src/app/(auth)" src/app/not-found.tsx src/app/layout.tsx`.
- `docs/I18N.md`: line 41 now matches the real check. Add a rule: "plural messages always include `=0`, because next-intl receives the bare base locale (`pt` uses Brazilian plural rules)". Update demo-v1 `CLAUDE.md:27` the same way.
- `docker/development/Dockerfile:37-38`: fix the stale comment (`build` also runs `lint:i18n`).

**Files (migrator):**
- Create: `packages/framework/template-migrator/migrations/demo-v1/63.MIGRATIONS-<DDMMYYYY>.md` with `id: 63-i18n-review-fixes`, `requires: ["62-i18n-time-zone"]` and `file.write` (`mode: replace`) steps with payloads under `payload/63/` for each template file above except `package.json`. The `lint:i18n` script change goes in Manual steps, like 58.
  - If Tasks 1–8 are released first, add a `deps.bump` step with the registry versions (query them with `pnpm view <pkg> version --registry=https://sonatype.nosi.cv/repository/igrp/`). Otherwise leave it out and note it in the file the way 58 did.
  - Include the "If you customised these files" table.
- Modify: `migrations/demo-v1/58.*.md`, **prose and front matter only (not `steps`)**:
  - `targetFrameworkVersion: "0.2.0-beta.8"`
  - Manual step 1 names `@igrp/framework-next*` `0.2.0-beta.8`, `next-intl ^4.14.0` and `@igrp/framework-next-i18n 0.2.0-beta.1`. Confirm each version against the registry before writing it.
  - Delete the "Before publishing this migration" section.
- Run `pnpm --filter @igrp/template-migrator sync:template-lock`.
- Changeset: `@igrp/template-migrator` patch.

- [ ] **Step 1: Make the template edits.** Run `pnpm --filter @igrp/framework-next-template lint:i18n`. **Expect** `no hardcoded strings` and coverage 100% for en and fr.
- [ ] **Step 2: Preview check.** Run `pnpm build:framework`, then `preview_start` the demo with `IGRP_PREVIEW_MODE=true`.
  - Problem: preview mode redirects `/login` to `/`, so test the login page with preview off if a dev auth setup exists. Otherwise verify through `pnpm build:demo` plus a unit render of `login/page.tsx`.
  - Switch to FR and confirm that the heading, carousel, 404 title and tab title are in French.
- [ ] **Step 3: Write migration 63 and its payloads, edit 58's prose, then sync the lock**
- [ ] **Step 4: Run** `pnpm --filter @igrp/template-migrator typecheck && pnpm --filter @igrp/template-migrator test && pnpm --filter @igrp/template-migrator check:drift`. **Expect PASS.** `git diff templates/demo-v1/.igrp-migrations-lock.json` shows only the new 63 entry; 58's `manifestHash` is unchanged.
- [ ] **Step 5: Commit** — `fix(demo-v1): localize login, 404, metadata and auth screens; migration 63`
  - `build:demo` rewrites about 60 files to LF. Run `git restore` on the EOL-only ones before committing (memory `project_build_demo_biome_eol_side_effect`).

---

### Task 10: CI gate (finding #7 part)

**Files:**
- Modify: `.gitlab-ci.yml`. Add `check_i18n` in stage `verify`, modelled on `check_template_drift`:
  - `rules.changes`: `templates/demo-v1/src/**/*`, `templates/demo-v1/package.json`, `packages/framework/next-i18n/**/*`
  - `before_script`: `corepack enable`, then `pnpm install --frozen-lockfile --ignore-scripts --filter @igrp/framework-next-i18n --filter @igrp/framework-next-template`
  - `script`: `pnpm --filter @igrp/framework-next-i18n test`, `pnpm --filter @igrp/framework-next-i18n build`, `pnpm --filter @igrp/framework-next-template lint:i18n`
  - Add a comment explaining why: `lint:i18n` otherwise ran only inside local `pnpm build`, and the Dockerfile skips it.

- [ ] **Step 1: Run the three script lines locally in the same order. Expect all PASS.** GitLab itself can't be exercised here, so this local run is the only proof before the MR pipeline.
- [ ] **Step 2: Commit** — `ci: run i18n catalog and literal checks per MR`

---

### Task 11: Whole-branch verification

- [ ] `pnpm build:framework`: PASS.
- [ ] `pnpm --filter <pkg> test` for design-system, framework-next-ui, framework-next, framework-next-i18n and template-migrator: PASS.
- [ ] `pnpm lint`: PASS. Run `pnpm --filter @igrp/framework-next-template lint:i18n`: PASS.
- [ ] `pnpm changeset status`: every touched publishable package has a `patch` changeset and none is `minor`/`major`.
- [ ] Report anything not covered: GitLab job runtime, login-page check under real auth, Storybook visual snapshots (`pnpm test:storybook`, which needs Storybook running).
