# Framework i18n v2: `@igrp/framework-next/i18n`

Date: 2026-10-12
Status: approved 2026-10-12 (decisions D-1 to D-5 resolved below), Implemented in 0.2.0-beta.8 to beta.10; follow-ups in `2026-10-21-i18n-app-center-readiness.md`. Supersedes `2026-09-30-framework-i18n-design.md` (approved, never implemented).
Vocabulary: `packages/framework/CONTEXT.md`. Decision record: `packages/framework/docs/adr/0001-cookie-first-locale-resolution.md` (amended by D-1 below).

## Why a v2

The 2026-09-30 design was written before the application center shipped its own i18n (`igrp-auth/frontend/igrp-application-center/src/i18n`, spec `access-management/_specs/i18n`). That code has now run for several weeks, carries 46 test files, and was deliberately shaped "like the future framework package so the move is an import change". This document reviews that implementation, keeps what it proved, and fixes the four places where it and the 09-30 design disagree. Everything else from 09-30 is carried forward unchanged.

## Review of the application-center implementation

Verified by reading `src/i18n/*`, `src/lib/auth-instance.ts`, `src/middleware.ts`, `src/app/global-error.tsx`, `src/components/errors/use-error-copy.ts`, `src/actions/access-client.ts`, `docs/I18N.md` and the six tests under `src/__tests__/i18n/`.

### What works and is promoted as-is

| Piece | Verdict |
|---|---|
| `config.ts`: fixed platform locales, module default vs platform default, `normalizeLocale`, cookie name and options, startup assertion | Correct, pure, Edge-safe. Becomes `@igrp/framework-next/i18n` almost verbatim. |
| `resolve-locale.ts`: `parseAcceptLanguage` (q-values, `*`, `q=0`), pure `pickLocale` separated from the `headers()`/`cookies()` reader | Correct and well tested. Promoted; the order becomes strategy-dependent (D-1). |
| `messages.ts`: per-locale deep merge over the complete default catalog, cached per locale, server-only so catalogs never reach the client bundle | Correct. Promoted as `igrpMergeMessages`, extended with framework namespaces and shadowing. |
| `fallback.ts`: missing key warns and renders `namespace.key`; any other error logs | Correct. Promoted; warning is dev-only in the framework. |
| `format.ts`: `formatDate` / `formatDateTime` / `formatNumber` / `compare` over a fixed region per language, collator cache, `useFormat()` | Correct. Promoted; the region map becomes per-deployment (`formatLocales`). |
| `actions.ts`: validate, persist when signed in, write cookie, report `authenticated` so the client can refresh the token | Correct ordering (persist first, cookie only on success). Promoted as `igrpSetLocale` with `persistLocale` injected. |
| `locale-switcher.tsx`: icon-sized trigger, native names, pending and failure states, `router.refresh()` | Good UX, matches the theme toggle footprint. Promoted as `IGRPLocaleSwitcher` minus its `next-auth` import. |
| `global.d.ts`: `AppConfig.Locale` / `AppConfig.Messages` typed from the default catalog, so `tsc` rejects unknown keys | Correct. Kept as the app's responsibility, with a framework type to intersect. |
| Tests: consistency (orphan keys, ICU parse, argument parity, camelCase), literal-string guard over migrated folders, resolver, action, request config | Correct and the right set of checks. Promoted into the `igrp-i18n` CLI (D-3). |
| Zod schemas as factories taking a translator; enum-code-to-key mapping per feature (`features/users/lib/i18n.ts`) | Correct pattern. Documented as the template convention, not framework code. |

### Findings that change the design

1. **Resolution order contradicts ADR 0001.** The app resolves session → cookie → `Accept-Language`; the ADR says cookie → session. The ADR rejected session-first because "without a write-back endpoint the switcher cannot override it" and "tokens keep a stale locale". The app has both a write-back (`PUT /api/users/me/locale`) and `update({ locale })`, so neither objection applies to it, and its middleware `syncLocaleCookie` (FR-27) is exactly the "seed the cookie from the session" the ADR rejected. Both are right for their situation. Resolved by D-1: the strategy follows from whether the app can write back.
2. **Session locale lives at `session.locale`;** 09-30 puts it at `session.user.locale`. The user attribute is the right home (it is a property of the signed-in person, like `name`). Framework: `token.locale` and `session.user.locale`. The app center moves on migration.
3. **The switcher imports `next-auth/react`** to run `update({ locale })`. A framework client component must not depend on next-auth. Resolved: `IGRPLocaleSwitcher` takes the server action as a prop and an optional `onChanged` callback; the app wraps it when the session token must follow.
4. **Copy is duplicated four times**: `errors.codes.*` in `pt/en/fr.json`, the inline `COPY` and `CODE_COPY` tables in `global-error.tsx` (120 lines, three languages), `use-error-copy.ts`, and the template's `config/error-messages.ts`. All describe the six `IGRP_*` platform codes. Resolved: error copy is part of the chrome catalog in `next-ui`, and `useIGRPChromeI18n()` has a cookie fallback for `global-error`.
5. **Design-system strings never change language.** `IGRPI18nProvider` is mounted with pt-PT defaults regardless of locale, accepted as FR-14. Resolved: `en`/`fr` design-system catalogs, selected by the framework provider.
6. **`<html lang>` is hardcoded to `pt`**, and the framework's `IGRPRootLayout` default is also the bare `pt`. Resolved: the format locale (`pt-CV`) is the document language, set by the framework when i18n is configured.
7. **The literal-string guard and the catalog checks are Vitest tests** that parse `.tsx` with the TypeScript compiler API. The template has no Vitest. Resolved by D-3: a CLI the template runs as `pnpm lint:i18n`.
8. **`Accept-Language` on API calls** is done by the app's own access client (`getAccessClientConfig`). The framework's `igrpSetAccessClientConfig` has no header hook, so framework-owned calls (menus, current user) never carry the language. Resolved: an optional `locale` on `IGRPClientRuntimeConfig`, sent as `Accept-Language`.
9. **Minor**: `getSessionLocale()` re-reads the session instead of taking it from the cached layout config (harmless, `getServerSession` is per-request cached); `LOCALE_COOKIE_OPTIONS` is `sameSite: "lax"` without `secure` (fine behind the TLS proxy; the framework adds `secure` in production, mirroring `resolveSecureCookie`).

## Decisions

Rows marked **Δ** differ from 09-30.

| Topic | Decision |
|---|---|
| Library | next-intl 4, regular dependency of `@igrp/framework-next`. The template adds `createNextIntlPlugin` to `next.config.ts`. |
| Placement | Subpath exports of `@igrp/framework-next`: `./i18n`, `./i18n/server`, `./i18n/client`, `./i18n/messages`, `./i18n/testing`. Build order unchanged. |
| Checks **Δ** | New dev-only package `@igrp/framework-next-i18n` (bin `igrp-i18n`), built like `template-migrator`. Not inside `framework-next`, which would otherwise ship `typescript` as a runtime dependency (D-3). |
| Locales | Platform locales fixed: `pt`, `en`, `fr`. Each app sets `defaultLocale` and may enable a subset, in code. |
| Format locale | Per deployment via `IGRP_FORMAT_LOCALES`, read by the template, defaults `pt-CV`, `en-GB`, `fr-FR`. |
| next-intl locale **Δ** | next-intl's `locale` is the base `IGRPLocale`, typed. Formatting goes through the framework helpers with the format locale; `useFormatter`/`getFormatter` from next-intl are flagged by `igrp-i18n` (D-4). |
| Routing | No `[locale]` URL segment (ADR 0001). |
| Resolution **Δ** | `cookie-first` (cookie → session → `Accept-Language` → default) when the app has no `persistLocale`; `session-first` (session → cookie → `Accept-Language` → default) when it has one. Derived, not configurable (D-1). |
| Cookie | `IGRP_LOCALE`, path `/`, one year, `SameSite=Lax`, `Secure` in production, not `httpOnly`. Written by `igrpSetLocale`, and under `session-first` also by the Edge helper `igrpSyncLocaleCookie`. |
| Session **Δ** | `framework-next-auth` maps the OIDC `locale` claim to `token.locale` and `session.user.locale` as a raw string, and accepts `update({ locale })` from the client. |
| Config entry **Δ** | `igrpBuildConfig({ i18n })`; `IGRPRootLayout`, `IGRPLayoutFull` and `IGRPLayoutBlank` read `config.i18n`. No new layout prop (D-2). |
| Framework strings | Design-system `pt`/`en`/`fr` catalogs; a `next-ui` chrome catalog in three languages holding the platform error copy. |
| Overrides | `igrpDefineI18n({ overrides })`, merged server-side per locale. The design system and `next-ui` never import next-intl. |
| App messages | Framework ships `common`, `i18n`, `errors` namespaces in three languages; apps own every other namespace and may shadow framework keys. |
| API language **Δ** | `igrpSetAccessClientConfig({ locale })` adds `Accept-Language`. The layouts seed it from the resolved locale. |
| Migration | The demo-v1 migration ships with this work. The application-center migration is a separate plan; its deltas are listed in the appendix so this design is checked against them. |

## Locales and resolution

- **`IGRPLocale`** (`'pt' | 'en' | 'fr'`) selects catalogs. It is what the cookie, the session, `useLocale()` and `AppConfig.Locale` speak.
- **Format locale** is the region tag derived per locale (`pt-CV`, `en-GB`, `fr-FR` by default). It drives the framework format helpers, the design-system `locale`, the chrome, and `<html lang>`. A bare `pt` never reaches `Intl` (it resolves to Brazilian conventions).
- **`igrpNormalizeLocale`** maps `pt-CV`, `pt_PT`, `PT` to `pt`; anything else to `undefined`.

### `igrpDefineI18n`

```ts
import { igrpDefineI18n } from '@igrp/framework-next/i18n';

export const i18n = igrpDefineI18n({
  defaultLocale: 'pt',                       // must be in `locales`
  locales: ['pt', 'en', 'fr'],               // default: all platform locales
  formatLocales: { pt: 'pt-CV' },            // merged over the defaults
  timeZone: 'Atlantic/Cape_Verde',           // optional, forwarded to next-intl
  getSessionLocale: async () => (await getSession())?.user?.locale,  // optional
  persistLocale: async (locale) => { ... },  // optional; its presence selects `session-first`
  overrides: { en: { designSystem: {...}, chrome: {...} } },          // optional
});
```

Validation at call time, thrown as `IgrpConfigError('IGRP_I18N_CONFIG_INVALID')`:

- a `locales` entry outside the platform locales;
- `defaultLocale` not in `locales`;
- a `formatLocales` entry whose language is not its key, or that `Intl.getCanonicalLocales` rejects.

The result carries `resolution: 'cookie-first' | 'session-first'`, computed from `persistLocale`. The framework never reads `process.env`; the template parses `IGRP_FORMAT_LOCALES` (comma-separated, e.g. `pt-PT` or `pt-AO,en-US`) in its own `src/i18n/index.ts`. Unset uses the defaults; a non-platform language or a duplicate language throws.

### Resolution (D-1)

`igrpPickLocale(candidates, i18n)` is pure and tested; `igrpResolveLocale(i18n)` feeds it from `cookies()`, `headers()` and `getSessionLocale`, wrapped in React `cache` so one request resolves once.

| Strategy | Order | When |
|---|---|---|
| `cookie-first` | cookie → session → `Accept-Language` → default | no `persistLocale`. The cookie is the only record of a choice, so it wins (ADR 0001). |
| `session-first` | session → cookie → `Accept-Language` → default | `persistLocale` present. The profile is the source of truth; `igrpSetLocale` keeps cookie and profile equal, and `igrpSyncLocaleCookie` (Edge, called from the app's middleware with the token it already decoded) rewrites the cookie when a session arrives with a different profile locale, so pages rendered without a session (login after logout, invitations) follow the last signed-in user. |

Under both strategies a candidate outside the enabled locales is skipped, every candidate is normalised, and the value never comes from or goes to the URL. ADR 0001 gets an amendment paragraph recording the second strategy and its precondition.

## Package changes

### `framework-next-auth`

- Default IGRP provider `profile()` mapping: `locale: typeof profile.locale === 'string' ? profile.locale : undefined`.
- `jwt` callback: on sign-in copy `user.locale` to `token.locale`; on `trigger === 'update'` with a string `session.locale`, replace `token.locale`. Raw strings, no normalisation (that is the i18n layer's job), no validation beyond `typeof`.
- `session` callback: `session.user.locale = token.locale`.
- `JWT.locale?: string`, `Session.user.locale?: string` in `jwt.ts`, `session.ts` and the `types.ts` augmentation; the `types-augmentation.type-check.ts` guard covers the new field.
- Open item carried from 09-30: whether the IGRP Authorization Server emits `locale` is unconfirmed. The application center seeds from `profile.locale` today, so the field exists in at least one deployment, but it has not been verified against the IdP's claim set (D-5). If absent, the field stays `undefined` and resolution falls through.

### `design-system`

- `IGRP_I18N_DEFAULTS_PT`, `IGRP_I18N_DEFAULTS_EN`, `IGRP_I18N_DEFAULTS_FR`, typed `IGRPI18nStrings`, exported from the root barrel. `IGRP_I18N_DEFAULTS_PT_PT` stays as a `@deprecated` alias of `_PT`.
- `IGRPI18nProvider` accepts `strings` as a full catalog or a deep-partial override; the hardcoded 28-group merge in `i18n/context.tsx` becomes a generic deep merge over the group keys of the defaults.
- Strings keep the `{token}` format (`igrpFormatMessage`); no plurals. Plural-sensitive wording is rephrased ("Selected: {count}").
- `primitives/chart.tsx`: `toLocaleString(useIGRPLocale())` instead of the bare call (removes a hydration-mismatch risk).
- `primitives/calendar.tsx`: date-fns locale from `useIGRPLocale()` unless the `locale` prop is given. Exact-tag map first (`pt-BR`, `en-US`, `fr-CA`), then by language (`pt-CV` → `pt`, `en-GB` → `enGB`, `fr-FR` → `fr`).
- Parity test: `en` and `fr` have exactly the `pt` keys with the same `{token}` arguments.
- `COMPONENTS.md` and the plugin references note the three catalogs.

### `framework-next-ui`

- `IGRPChromeI18nProvider({ strings, children })` and `useIGRPChromeI18n()`. With no provider mounted the hook returns the `pt` catalog on the server and, on the client, the catalog for the `IGRP_LOCALE` cookie, via `useSyncExternalStore` with a `pt` server snapshot so hydration never mismatches. This is what `global-error.tsx` relies on, because it renders outside every provider.
- `IGRPChromeStrings` interface covering: header (settings link), nav-user, notifications, mode switcher, theme selector, command search, breadcrumbs, app switcher, sidebar menus (`IGRPMenuLabels` moves in), auth form (`IGRPLoginTexts` minus the app-specific `welcome`, `description`, `copyright`, URLs), forbidden, not-found, global and segment error screens (labels plus the generic `unexpected` title/description), session watcher, and `errorCodes` keyed by the six `IgrpErrorCode` values with `{ title, description }`.
- `IGRP_CHROME_STRINGS_PT`, `_EN`, `_FR` exported; the existing `*_LABELS_PT_PT` constants stay as `@deprecated` aliases pointing into `_PT`.
- Every component reads the context; its existing label props still win when passed. No breaking change.
- `IGRPGlobalError` and `IGRPSegmentError` gain `resolveCopy` defaults: when the error carries a known `IGRP_*` code, the catalog's `errorCodes` entry; else the `unexpected` pair. Apps that passed their own `resolveCopy` keep working.
- Tests (jsdom per file, since the package runs Vitest in `node`): defaults, cookie fallback, override precedence, error-code lookup.

### `framework-next`

New dependency: `next-intl`. New subpaths in `exports`, each a file-per-module leaf so Turbopack `optimizePackageImports` and the client-boundary rules keep working:

**`./i18n`** (Edge-safe: no React, no `next/headers`, no import from the root barrel, which pulls `node:async_hooks`):

```ts
export const IGRP_LOCALES: readonly ['pt', 'en', 'fr'];
export type IGRPLocale = 'pt' | 'en' | 'fr';
export const IGRP_LOCALE_NATIVE_NAMES: Record<IGRPLocale, string>;
export const IGRP_LOCALE_COOKIE = 'IGRP_LOCALE';
export function igrpLocaleCookieOptions(secure: boolean): CookieOptions;
export function igrpIsLocale(v: unknown): v is IGRPLocale;
export function igrpNormalizeLocale(tag: unknown): IGRPLocale | undefined;
export function igrpParseAcceptLanguage(header: string | null | undefined): IGRPLocale | undefined;
export function igrpParseFormatLocales(raw: string | undefined): Partial<Record<IGRPLocale, string>>;
export function igrpDefineI18n(options: IGRPI18nOptions): IGRPI18nConfig;
export function igrpPickLocale(c: IGRPLocaleCandidates, i18n: IGRPI18nConfig): IGRPLocale;
export function igrpSyncLocaleCookie(req: NextRequest, res: NextResponse, tokenLocale: unknown, i18n: Pick<IGRPI18nConfig, 'locales' | 'resolution'>): NextResponse;
export function igrpFormatDate(value, formatLocale: string, options?): string;
export function igrpFormatDateTime(value, formatLocale: string, options?): string;
export function igrpFormatNumber(value, formatLocale: string, options?): string;
export function igrpCompare(a, b, formatLocale: string): number;
export type IGRPI18nConfig, IGRPI18nOptions, IGRPLocaleCandidates, IGRPSetLocaleResult;
```

Type placement follows the dependency order (`next-types` precedes the design system and `next-ui`, so it cannot name their string types): `framework-next-types` declares `IGRPI18nConfigBase` with `overrides` typed as `Partial<Record<IGRPLocale, { designSystem?: object; chrome?: object }>>` and `IGRPConfigArgs.i18n?: IGRPI18nConfigBase`; `framework-next/i18n` declares `IGRPI18nConfig extends IGRPI18nConfigBase` narrowing `overrides` to deep partials of `IGRPI18nStrings` and `IGRPChromeStrings`. `igrpDefineI18n` returns the narrow type, which is assignable to the base.

**`./i18n/server`** (`server-only`):

```ts
export function igrpCreateRequestConfig(i18n, appCatalogs: Partial<Record<IGRPLocale, AbstractIntlMessages>>);
  // → the function to pass to next-intl's getRequestConfig: resolves the locale,
  //   returns { locale, messages, timeZone, onError, getMessageFallback }.
export const igrpResolveLocale: (i18n) => Promise<IGRPLocale>;        // React cache
export const igrpResolveFormatLocale: (i18n) => Promise<string>;
export async function igrpSetLocale(i18n, value: string): Promise<IGRPSetLocaleResult>;
  // validate against enabled locales → persistLocale (if any; failure aborts, nothing written)
  // → write cookie → { success: true, data: { locale, persisted } }
export async function igrpGetChromeStrings(i18n, locale): Promise<IGRPChromeStrings>;
export async function igrpGetDesignSystemStrings(i18n, locale): Promise<IGRPI18nStrings>;
```

`igrpSetLocale` is a plain server function, not a server action: Next only accepts function declarations as exports of a `'use server'` file, so the app owns the one-liner action and passes it to the switcher (see the template section).

**`./i18n/client`** (`'use client'` leaves):

```ts
export function IGRPIntlProvider({ locale, formatLocale, messages, designSystemStrings, chromeStrings, children });
  // NextIntlClientProvider (error + fallback handlers wired here, because functions
  // cannot cross from the server layout) → IGRPI18nProvider (DS) → IGRPChromeI18nProvider.
export function IGRPLocaleSwitcher({ action, onChanged?, className? });
  // Renders nothing when fewer than two locales are enabled. On change:
  // await action(next) → on failure show the error state and stop
  // → await onChanged?.(locale) → router.refresh().
export function useIGRPFormat(): { locale, formatLocale, formatDate, formatDateTime, formatNumber, compare };
export function useIGRPLocaleInfo(): { locale: IGRPLocale; formatLocale: string; locales: readonly IGRPLocale[] };
```

**`./i18n/messages`**:

```ts
export function igrpMergeMessages(i18n, locale, appCatalogs): AbstractIntlMessages;
  // framework[locale]  ⊕  (app[defaultLocale] ⊕ app[locale]); cached per locale.
  // The framework catalogs are complete in all three languages, so they need no fallback.
export const IGRP_MESSAGES_PT, IGRP_MESSAGES_EN, IGRP_MESSAGES_FR;   // common, i18n, errors
export type IGRPFrameworkMessages = typeof IGRP_MESSAGES_PT;
```

Missing keys render `namespace.key` and warn in development only. Keys an app shadows are reported by `igrp-i18n` as info.

**`./i18n/testing`**: `IGRPIntlTestProvider(ui, { locale?, messages? })`, the application center's helper, mounting the same three providers as `IGRPIntlProvider`.

**Layouts and config**:

- `igrpBuildConfig({ i18n })` stores the config; `IGRPConfigArgs.i18n` is optional, so apps without i18n change nothing.
- `IGRPRootLayout`: when `config.i18n` is set, resolve locale and format locale, load merged messages via next-intl `getMessages()`, load DS and chrome strings, set `<html lang={formatLocale}>`, and mount `IGRPIntlProvider` inside `IGRPNestedProviders`. An explicit `lang` prop still wins. The default `lang` stays `'pt'` for apps without i18n (unchanged behaviour).
- `IGRPLayoutFull` / `IGRPLayoutBlank`: seed `igrpSetAccessClientConfig({ ..., locale })` from `igrpResolveLocale(config.i18n)` when configured.
- `IGRPClientRuntimeConfig.locale?: string` → the api client sends `Accept-Language`. `igrpEnsureAccessClientConfig` (actions path) leaves it undefined; apps that need the header in their own actions pass it, as the application center does today.

### `@igrp/framework-next-i18n` (new, dev-only; D-3)

`packages/framework/i18n-tools`, bin `igrp-i18n`, tsup build and Vitest like `template-migrator`, dependencies `typescript` and `@formatjs/icu-messageformat-parser`. Published to the internal registry with the same `release` script shape.

- `igrp-i18n check-catalogs <dir> --default <locale>`: every file in `<dir>` is `<locale>.json`; fails on orphan keys (present in a non-default file, absent from the default), non-string values, invalid ICU, argument or tag mismatches against the default, and a key segment that is not `^[a-z][a-zA-Z0-9]*$`. Prints per-locale coverage as information. Keys that shadow `IGRPFrameworkMessages` are listed as info.
- `igrp-i18n check-literals <folder...>`: parses every non-test `.tsx` under the folders with the TypeScript compiler API and fails on JSX text containing letters, string or template literals as JSX children, string literals in user-facing props (`placeholder`, `title`, `label`, `aria-label`, `aria-description`, `description`, `alt`, `helperText`, `errorText`, `searchText`, `selectLabel`), and imports of `useFormatter`/`getFormatter` from next-intl (D-4). Text without letters is allowed.
- Both are also exported as functions for programmatic use in Vitest.

### `templates/demo-v1`

- Dependencies: `next-intl` (via `@igrp/framework-next`); `@igrp/framework-next-i18n` as a devDependency; script `"lint:i18n": "igrp-i18n check-catalogs src/i18n/messages --default pt && igrp-i18n check-literals src/components src/i18n src/app/(igrp)/page.tsx"`, added to `build` after `lint`. The folder list is the template's equivalent of the application center's `MIGRATED_FOLDERS`: the `(demo)` pages keep their Portuguese literals and are added to the list only when migrated.
- `src/i18n/index.ts`: `igrpDefineI18n({ defaultLocale: 'pt', formatLocales: igrpParseFormatLocales(process.env.IGRP_FORMAT_LOCALES), getSessionLocale })` with `getSessionLocale` reading `session.user.locale` through the cached `getLayoutConfig()`. No `persistLocale`, so the template is `cookie-first`.
- `src/i18n/request.ts`: `export default getRequestConfig(igrpCreateRequestConfig(i18n, { pt, en, fr }))`.
- `src/i18n/actions.ts` (`'use server'`): `export async function setLocale(value: string) { return igrpSetLocale(i18n, value); }`.
- `src/i18n/global.d.ts`: `AppConfig.Locale = IGRPLocale`, `AppConfig.Messages = typeof pt & IGRPFrameworkMessages`.
- `src/i18n/messages/{pt,en,fr}.json`: template strings only (login texts, demo pages, site name are left as they are; only the home overview and the demo navigation labels are migrated as the worked example).
- `next.config.ts`: `createNextIntlPlugin('./src/i18n/request.ts')`, and `@igrp/framework-next/i18n` added to `optimizePackageImports`.
- `src/igrp.template.config.ts`: `igrpBuildConfig({ i18n, ... })`.
- `src/app/layout.tsx`: unchanged apart from the config (the framework mounts the provider).
- `src/app/(igrp)/layout.tsx`: `headerSlots.actions: <IGRPLocaleSwitcher action={setLocale} />`.
- `src/app/(auth)/login/page.tsx`: the switcher in the top-right corner, as the application center places it.
- `src/middleware.ts`: unchanged (`cookie-first` needs no sync). The file documents that a `session-first` app adds `return igrpSyncLocaleCookie(request, nextWithPath(), token.locale, i18n)` at the end of the authenticated branch.
- `src/config/error-messages.ts`: deleted. `global-error.tsx` and `error.tsx` drop `resolveCopy` and the `lang="pt-PT"` literal; `global-error.tsx` reads `useIGRPChromeI18n()` for the document language.
- Preview mode: mock users carry no `locale`; resolution is cookie → `Accept-Language` → default.
- `.env.example`: `IGRP_FORMAT_LOCALES`. `docs/I18N.md` adapted from the application center's guide. `CLAUDE.md` gains the i18n pointers and fixes the stale claim that `app/layout.tsx` mounts `IGRPRootProviders`.
- Template-migrator: one migration (`56-i18n`) with `deps.bump`, `file.create` for every new file, `file.write` for the edited ones, `file.delete` for `config/error-messages.ts`, and the `.env.example` key; then `sync:template-lock` so `check:drift` passes.

## Testing

- `framework-next/i18n`: `igrpNormalizeLocale`; `igrpParseAcceptLanguage` (q-values, `*`, `q=0`, ties keep header order); `igrpPickLocale` under both strategies, including a cookie outside the enabled locales and a session value needing normalisation; `igrpDefineI18n` validation (bad locale, default outside `locales`, bad `formatLocales`, derived `resolution`); cookie options in dev and production; `igrpSetLocale` with and without `persistLocale`, including a failing `persistLocale` writing no cookie; `igrpMergeMessages` fallback and shadowing; `igrpSyncLocaleCookie` no-ops under `cookie-first`; the switcher renders nothing with one locale; format helpers with `pt-CV`, `en-GB`, `fr-FR`.
- `framework-next-auth`: claim mapped raw; absent claim leaves `undefined`; `update({ locale })` replaces `token.locale`; the type-check guard covers `user.locale`.
- `design-system`: catalog parity, generic deep merge, calendar locale mapping, chart formatting.
- `next-ui`: context defaults, cookie fallback with a `pt` server snapshot, prop override, error-code lookup.
- `i18n-tools`: the application center's two test files ported as fixtures, plus the `useFormatter` rule.
- Template: `lint:i18n` and `check:drift` in CI.

## Rollout order

Follows `.claude/shared/dependency-order.md`; each step is a patch changeset.

1. `framework-next-auth`: locale claim, `update({ locale })`, types.
2. `framework-next-types`: `IGRPI18nConfig`, `IGRPConfigArgs.i18n`.
3. `design-system`: catalogs, generic merge, calendar and chart locale.
4. `framework-next-ui`: chrome catalog, provider, hook, error-copy defaults.
5. `framework-next`: `i18n` subpaths, config field, layouts, `Accept-Language`.
6. `@igrp/framework-next-i18n`.
7. Template wiring, migration 58, `sync:template-lock`.
8. `pnpm build:framework`, template build with `lint:i18n`, release per package.

## Out of scope

- The application-center migration (separate plan; deltas in the appendix).
- Translating app-specific feature strings, in the template or elsewhere.
- Locale in URLs (ADR 0001).
- A generic user-locale write-back endpoint. `persistLocale` is the seam; the application center plugs its own.
- Pluralisation in design-system and chrome strings.

## Decisions resolved (2026-10-12)

- **D-1 Resolution strategy derived from `persistLocale`.** Accepted. ADR 0001 gets an amendment recording `session-first` and its precondition. The alternative (always `cookie-first`) would have cost the application center FR-6/FR-27.
- **D-2 `igrpBuildConfig({ i18n })` instead of an `IGRPRootLayout` prop.** Accepted. The field reaches `IGRPLayoutFull`/`IGRPLayoutBlank`, which need the locale for `Accept-Language`, and the root layout call stays unchanged.
- **D-3 Checks as the separate dev-only package `@igrp/framework-next-i18n`.** Accepted. A bin inside `framework-next` would have made `typescript` and the ICU parser runtime dependencies of a server package.
- **D-4 next-intl `locale` stays the base `IGRPLocale`.** Accepted. Formatting goes through `useIGRPFormat()`; the `igrp-i18n` check flags `useFormatter`/`getFormatter`.
- **D-5 The IdP `locale` claim.** Verified 2026-10-21: the access-management IdP emits `locale` from `metadata.locale` under the `profile` scope (`ClaimsEnrichmentService.java:308`), and stores the upstream IdP's `locale` claim into metadata (`IgrpOidcUserService.java:387`).

## Appendix: application-center deltas after this lands

For the separate migration plan; listed here so the design is known to cover them.

| Today (`src/i18n`) | After |
|---|---|
| `config.ts`, `resolve-locale.ts`, `messages.ts`, `fallback.ts`, `format.ts` | deleted; imports from `@igrp/framework-next/i18n*`. `pickLocale` call sites use `igrpPickLocale(c, i18n)`. |
| `getSessionLocale()` reading `session.locale` | reads `session.user.locale`; the custom `jwt`/`session` callback extensions in `auth-instance.ts` are deleted (framework does it). |
| `actions.ts` | `igrpSetLocale(i18n, value)` with `persistLocale: updateCurrentUserLocale`; the app stays `session-first`. |
| `middleware.ts` `syncLocaleCookie` | `igrpSyncLocaleCookie(..., i18n)`. |
| `locale-switcher.tsx` | a 10-line client wrapper: `<IGRPLocaleSwitcher action={setLocale} onChanged={async (locale, persisted) => { if (persisted) await update({ locale }); }} />`; `onChanged(locale, persisted)` fires after the switch, and `persisted` says whether the server stored it, so the wrapper awaits the session update only then. |
| `components/i18n-provider.tsx`, root layout `I18nProvider` | deleted; `igrpBuildConfig({ i18n })`. The `<html lang>` TODO closes. |
| `global-error.tsx` copy tables, `errors.codes.*` in the catalogs, `use-error-copy.ts` code map | deleted; chrome catalog. `useErrorCopy` keeps only the API-detail precedence. |
| `access-client.ts` `Accept-Language` | unchanged for app actions; framework calls now carry it too. |
| `__tests__/i18n/messages.consistency.test.ts`, `literal-strings.test.ts` | replaced by `lint:i18n`; `MIGRATED_FOLDERS` becomes the CLI argument list. |
| `__tests__/helpers/intl.tsx` | `IGRPIntlTestProvider`. |
| `common`, `i18n`, `errors` namespaces in `pt/en/fr.json` | removed where identical to the framework's; app-specific keys stay and shadow. |
