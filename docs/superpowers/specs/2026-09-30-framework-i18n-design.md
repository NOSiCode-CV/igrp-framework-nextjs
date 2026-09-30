# Framework i18n: `@igrp/framework-next/i18n`

Date: 2026-09-30
Status: design approved after review, pending implementation plan

Vocabulary: `packages/framework/CONTEXT.md` (Locale, Format locale, Locale choice, Session locale, Catalog, Chrome, Error copy).
Decision record: `packages/framework/docs/adr/0001-cookie-first-locale-resolution.md`.

## Problem

A generated IGRP app has three unconnected string mechanisms:

- the design-system catalog (`IGRPI18nProvider`, closed, pt-PT only, mounted nowhere today);
- `next-ui` chrome components with per-component label props (pt-PT defaults, ~60 strings over ~14 surfaces);
- whatever the app adds itself (igrp-application-center uses next-intl).

Picking English in an app therefore still leaves design-system and chrome strings in Portuguese. `demo-v1` hardcodes pt-PT and mounts no provider. The application center already has a working, mostly generic i18n setup in `src/i18n/` that was shaped to be promoted into the framework.

## Decisions

| Topic | Decision |
|---|---|
| Library | next-intl, as a regular dependency of `@igrp/framework-next`. |
| Placement | Subpath exports of `@igrp/framework-next`, no new package. Build order unchanged. |
| Locales | Platform locales fixed to `pt`, `en`, `fr`. Each app sets its default and may enable a subset, in code. |
| Format locale | Per deployment via server-only `IGRP_FORMAT_LOCALES`; defaults `pt-CV`, `en-GB`, `fr-FR`. |
| Routing | No `[locale]` URL segment. |
| Resolution | Locale choice cookie → session locale → `Accept-Language` → default. The cookie is never seeded (ADR 0001). |
| Session | `framework-next-auth` maps the OIDC `locale` claim onto token and session as a raw string. |
| Framework strings | Design-system en/fr catalogs and a `next-ui` chrome catalog; error copy lives in the chrome catalog. |
| Overrides | Declared in `defineI18n({ overrides })`, merged server-side for the current locale. DS and next-ui never import next-intl. |
| Messages | Framework ships generic `common`, `i18n`, `errors` namespaces; apps own the rest and may shadow them. |
| Checks | Literal-string and catalog checks ship as a CLI; the template runs `pnpm lint:i18n`. |
| Migration | The demo-v1 migration ships with this work. Existing apps and the application center are a separate spec. |

## Locales

- **Locale** (`pt | en | fr`) selects catalogs and is what the cookie, session resolution and `useLocale()` speak.
- **Format locale** is derived per locale and drives `Intl` formatting, the DS locale and `<html lang>`. A bare `pt` must never reach `Intl` (it resolves to Brazilian conventions).
- `defineI18n({ defaultLocale, locales?, formatLocales?, getSessionLocale?, persistLocale?, overrides? })`:
  - `locales` defaults to all platform locales; anything outside them, or a `defaultLocale` not in `locales`, throws at startup.
  - `formatLocales` is `Partial<Record<Locale, string>>`. Each entry must be a valid BCP-47 tag whose language is its key; defaults `pt-CV`, `en-GB`, `fr-FR`.
- `normalizeLocale` maps `pt-CV`, `pt_PT`, `PT` etc. to `pt`; unknown values to `undefined`.
- The framework never reads `process.env`. The template reads `IGRP_FORMAT_LOCALES` (comma-separated, e.g. `pt-PT` or `pt-AO,en-US`) in `src/i18n/index.ts` at request time, so one image can serve different regions. Unset or empty uses the defaults; an entry for a non-platform language or a duplicate language throws. Documented in `.env.example`.

## `framework-next` subpaths

- `./i18n` (config): `defineI18n`, platform locales, native names, `normalizeLocale`, types.
- `./i18n/server`: `createRequestConfig(i18n, messages)`, `resolveLocale()`, `setLocale` server action.
  - `resolveLocale()` order: `IGRP_LOCALE` cookie (ignored if not an enabled locale), `getSessionLocale()` normalised, `Accept-Language` (q-values honoured, normalised), default.
  - `setLocale` validates against enabled locales, calls `persistLocale` if provided, sets the cookie (path `/`, 1 year, sameSite lax, not httpOnly). It is the only writer of the cookie. The cookie is shared by every IGRP app on the host.
  - next-intl receives the Locale for message selection and the Format locale for formatting.
- `./i18n/client`: `I18nProvider`, `LocaleSwitcher`, `useFormat()`.
  - `I18nProvider` wraps next-intl (error and fallback handlers wired client-side) and mounts `IGRPI18nProvider` and `IGRPChromeI18nProvider` with the already-merged catalogs for the current locale and the Format locale.
  - `LocaleSwitcher` renders nothing when fewer than two locales are enabled.
- `./i18n/messages`: `mergeMessages` (app over framework namespaces; requested locale over default; then the key itself) and the generic pt/en/fr namespaces. Missing keys warn in development, silent in production.
- `./i18n/testing`: `renderWithIntl`.
- CLI bin (e.g. `igrp-i18n check <folders>`): no literal strings in the given folders; catalog consistency (orphan keys, invalid ICU, argument mismatches, camelCase segments, keys missing from the default locale). Shadowed framework keys are reported as info, not failure.

`IGRPRootLayout` gains an `i18n` prop: when given, it resolves the locale, mounts `I18nProvider` and sets `<html lang>` to the Format locale. An explicit `lang` prop still wins. The i18n code imports neither `next-auth` nor any API client.

## `framework-next-auth` changes

- Map the OIDC `locale` claim (profile / ID token) onto `token.locale` and `session.user.locale` in the default provider mapping and JWT/session callbacks, stored raw as `string | undefined`.
- Type augmentation for Session and JWT.
- Whether the IGRP Authorization Server emits `locale` today is to be confirmed; if it does not, the field stays undefined and resolution falls through.

## `design-system` changes

- Canonical `IGRP_I18N_DEFAULTS_PT`, `IGRP_I18N_DEFAULTS_EN`, `IGRP_I18N_DEFAULTS_FR`, typed against `IGRPI18nStrings`, explicitly re-exported from the root barrel. `IGRP_I18N_DEFAULTS_PT_PT` stays as a `@deprecated` alias.
- `IGRPI18nProvider` accepts a full `strings` object as well as deep-partial overrides. The hardcoded 28-group list in `i18n/context.tsx` is replaced by a generic deep merge.
- Strings keep the `{token}` format (`igrpFormatMessage`); no plurals. Plural-sensitive wording is rephrased (e.g. "Selected: {count}").
- `primitives/chart.tsx`: `toLocaleString(locale)` using `useIGRPLocale()` (removes the hydration mismatch risk).
- `primitives/calendar.tsx`: date-fns locale derived from `useIGRPLocale()` unless the `locale` prop is passed. Exact-tag map first (`pt-BR` → `ptBR`, `en-US` → `enUS`, `fr-CA` → `frCA`), then by language (`pt-CV` → `pt`, `en-GB` → `enGB`, `fr-FR` → `fr`).
- Parity test: en and fr have exactly the pt keys and the same `{token}` arguments.
- Docs: note in `COMPONENTS.md` and the plugin references.

## `next-ui` changes

- `IGRPChromeI18nProvider` and `useChromeI18n()`. With no provider mounted, `useChromeI18n()` reads the `IGRP_LOCALE` cookie on the client, then falls back to pt; this covers `global-error`, which renders outside all providers.
- Chrome catalog interface covering header, sidebar, nav-user, notifications, theme and mode selector, command search, breadcrumbs, app switcher, auth form and carousel, forbidden, not-found, global and segment error screens, session watcher, and the menu labels now in `templates/menus/labels.ts`.
- Error copy keyed by `IGRP_*` platform error code is part of the chrome catalog.
- Components read the context; existing label props still override (no breaking change).
- Canonical `_PT`, `_EN`, `_FR` catalogs exported next to the interface; existing `*_LABELS_PT_PT` exports stay as `@deprecated` aliases.
- Tests: default, cookie fallback and override behaviour.

## `templates/demo-v1` changes

- Dependency: `next-intl` (via `@igrp/framework-next`).
- `src/i18n/index.ts`: `defineI18n({ defaultLocale: 'pt', formatLocales: parsed IGRP_FORMAT_LOCALES, getSessionLocale })`, `getSessionLocale` reading `session.user.locale`. No `persistLocale`.
- `src/i18n/messages/{pt,en,fr}.json`: template strings only.
- Wiring: next-intl plugin in `next.config` (and the i18n subpath in `optimizePackageImports`); root layout passes `i18n` to `IGRPRootLayout`; `LocaleSwitcher` in the header `actions` slot and on the login page. `middleware.ts` is unchanged.
- `config/error-messages.ts` shrinks to code-to-key mapping or is removed; error copy comes from the chrome catalog.
- `global-error.tsx`: drop hardcoded `lang="pt-PT"`; strings come from `useChromeI18n()`'s cookie fallback.
- Preview mode: mock users carry no `locale`; resolution goes cookie → `Accept-Language` → default.
- `lint:i18n` script running the CLI over `src`.
- `.env.example`: `IGRP_FORMAT_LOCALES`.
- `docs/I18N.md`.
- Template-migrator migration guide and payloads for every changed or new file, then `sync:template-lock`, so `check:drift` passes.

## Testing

- `framework-next` i18n: resolution order (cookie outside enabled locales ignored, session normalised), `normalizeLocale`, `formatLocales` validation, cookie options, `setLocale` with and without `persistLocale`, merge fallback and shadowing, ICU validation, switcher hidden with one locale.
- `framework-next-auth`: `locale` claim mapped raw, absent claim leaves it undefined.
- `design-system`: catalog parity, deep merge, calendar locale mapping.
- `next-ui`: default, cookie fallback and override.
- Template: `lint:i18n` and `check:drift` in CI.

## Rollout order

1. `framework-next-auth` locale claim.
2. Design-system catalogs and locale fixes.
3. `next-ui` chrome catalog and context.
4. `framework-next` i18n subpaths, CLI and `IGRPRootLayout` `i18n` prop.
5. Template wiring and its migration.
6. Patch changesets, then `pnpm build:framework`.

## Out of scope

- Migration guide for existing generated apps and the application center migration (separate spec).
- Translating app-specific feature strings.
- Locale in URLs (ADR 0001).
- A user-locale write-back endpoint.

## Open items for the plan

- Confirm whether the IGRP Authorization Server emits the OIDC `locale` claim.
- `next-ui` Vitest runs in `node`; chrome component tests need a per-file jsdom environment.
- `templates/demo-v1/CLAUDE.md` says `app/layout.tsx` mounts `IGRPRootProviders`; it does not. Fix while wiring.
