# Framework i18n: `@igrp/framework-next-i18n`

Date: 2026-09-30
Status: design approved, pending implementation plan

## Problem

A generated IGRP app has three unconnected string mechanisms:

- the design-system catalog (`IGRPI18nProvider`, closed, pt-PT only);
- `next-ui` chrome components with per-component label props (pt-PT defaults);
- whatever the app adds itself (igrp-application-center uses next-intl).

Picking English in an app therefore still leaves design-system and chrome strings in Portuguese. `demo-v1` hardcodes pt-PT and mounts no provider. The application center already has a working, mostly generic i18n setup in `src/i18n/` that was shaped to be promoted into the framework.

## Decisions

| Topic | Decision |
|---|---|
| Library | Commit to next-intl. New package `@igrp/framework-next-i18n`, used by `templates/demo-v1`. |
| Locales | Platform list fixed to `pt`, `en`, `fr`. Each app sets its own default. |
| Routing | No `[locale]` URL segment. Cookie and session only. |
| Auth coupling | None. The app passes `getSessionLocale()` and optional `persistLocale()`. |
| User-locale endpoint | None in the template. Cookie only (`persistLocale` omitted). |
| Framework strings | Both phases: design-system en/fr catalogs and a `next-ui` chrome string context. |
| Messages | Package ships generic `common`, `i18n`, `errors` namespaces; apps own the rest. |
| Test guards | Exported as reusable helpers; the template runs them. |
| Migration of existing apps | Out of scope. Separate spec (application center is the first consumer). |

## Package: `packages/framework/next-i18n`

Published like the other framework packages (patch changeset only). Build order: next-auth, next-types, design-system, next-ui, **next-i18n**, next. Documented subpath exports only.

- `./config`: `defineI18n({ defaultLocale, getSessionLocale?, persistLocale? })`. Fixed platform locales, format-region map (pt to pt-CV, en to en-GB, fr to fr-FR), native names, `normalizeLocale` (`pt-CV`, `pt_PT` to `pt`). Throws at startup if `defaultLocale` is not a platform locale.
- `./server`: `createRequestConfig(i18n, messages)`, `resolveLocale()`, `setLocale` server action. Resolution order: session locale, `IGRP_LOCALE` cookie, `Accept-Language` (q-values honoured), default. `setLocale` validates, calls `persistLocale` if provided, sets the cookie (path `/`, 1 year, sameSite lax, not httpOnly).
- `./middleware`: `syncLocaleCookie(request, response, sessionLocale)` rewrites the cookie when it differs from the session locale.
- `./client`: `I18nProvider`, `LocaleSwitcher`, `useFormat()`. `I18nProvider` wraps next-intl (error and fallback handlers wired client-side) and mounts `IGRPI18nProvider` and `IGRPChromeI18nProvider` with the catalogs for the current locale.
- `./messages`: `mergeMessages` (requested locale over default, then the key itself with a warning) and the generic pt/en/fr namespaces.
- `./testing`: `renderWithIntl`, `assertNoLiteralStrings(folders)`, `assertCatalogConsistency(catalogs)` (orphan keys, invalid ICU, argument mismatches, camelCase segments).

`<html lang>` is set through the existing `lang` prop on `IGRPRootLayout`. The package imports neither `next-auth` nor any API client.

## `design-system` changes

- `IGRP_I18N_DEFAULTS_EN` and `IGRP_I18N_DEFAULTS_FR`, typed against `IGRPI18nStrings`, explicitly re-exported from the root barrel.
- `IGRPI18nProvider` accepts a full `strings` object as well as partial overrides. The hardcoded group list in `i18n/context.tsx` is replaced by a generic deep merge.
- `primitives/chart.tsx`: `toLocaleString(locale)` using `useIGRPLocale()` (removes hydration mismatch risk).
- `primitives/calendar.tsx`: date-fns locale derived from the provider unless the `locale` prop is passed.
- Parity test: en and fr have exactly the pt-PT keys.
- Docs: note in `COMPONENTS.md` and the plugin references.

## `next-ui` changes

- `IGRPChromeI18nProvider` and `useChromeI18n()`, falling back to pt-PT with no provider.
- Strings interface covering header, sidebar, nav-user, notifications, theme and mode selector, command search, breadcrumbs, app switcher, auth form and carousel, forbidden and not-found screens, and the menu labels now in `templates/menus/labels.ts`.
- Components read the context; existing label props still override (no breaking change).
- pt-PT, en and fr catalogs exported next to the interface.
- Tests: default and override behaviour.

## `templates/demo-v1` changes

- Dependencies: `@igrp/framework-next-i18n`, `next-intl`.
- `src/i18n/index.ts`: `defineI18n({ defaultLocale: 'pt', getSessionLocale })`, with `getSessionLocale` reading the session token locale (undefined if absent). No `persistLocale`.
- `src/i18n/messages/{pt,en,fr}.json`: template strings only.
- Wiring: next-intl plugin in `next.config`; root layout passes `lang` and wraps children in `I18nProvider`; `middleware.ts` calls `syncLocaleCookie`; `LocaleSwitcher` in the header `actions` slot and on the login page.
- `config/error-messages.ts` replaced by `errors.*` keys; call sites unchanged.
- `global-error.tsx` reads the cookie and renders an inline pt/en/fr table (it renders outside all providers); remove hardcoded `lang="pt-PT"`.
- Runs the two test helpers with its own `src` as the migrated folders.
- `docs/I18N.md`.

## Testing

- `next-i18n`: resolution order, `normalizeLocale`, cookie options, `setLocale` with and without `persistLocale`, merge fallback, ICU validation.
- `design-system`: catalog parity. `next-ui`: default and override.
- Template: the literal-string and catalog-consistency helpers.

## Rollout order

1. Design-system catalogs and locale fixes.
2. `next-ui` chrome context.
3. `next-i18n` package.
4. Template wiring.
5. Patch changesets, then `pnpm build:framework`.

## Out of scope

- Migration guide for existing apps and the application center migration (separate spec). Changing `demo-v1` files that shipped migrations contain also requires a new migration guide, `check:drift` and `sync:template-lock`; this is handled in that spec.
- Translating app-specific feature strings.
- Locale in URLs.

## Open items for the plan

- Confirm that `IGRPRootProviders` in `next-ui` does not already mount `IGRPI18nProvider`.
- Confirm how the zip script resolves `workspace:*` for the new package.
