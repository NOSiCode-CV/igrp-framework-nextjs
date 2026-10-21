# i18n App Center Readiness: Spec

**Status:** ready-for-agent · **Plan:** `docs/superpowers/plans/2026-10-21-i18n-app-center-readiness.md` · **Builds on:** `2026-10-12-framework-i18n-v2-design.md` (implemented)

## Problem Statement

The framework's i18n (v2) is shipped. A review of the Application Center's move onto it found gaps that only show up in a real app.

- **Missing translations pass the check.** A team can ship a locale with missing translations and `igrp-i18n check-catalogs` still passes, because missing keys only lower a coverage number. The App Center shipped French 13 keys short this way.
- **The locale cookie can lose `Secure`.** A session-first app behind the platform's TLS-terminating gateway gets its language cookie written without `Secure` whenever middleware syncs it. The server action that writes the same cookie does set `Secure`. Which copy a user ends up with depends on which path wrote it last.
- **One framework error has no copy.** A misconfigured language setup (`IGRP_I18N_CONFIG_INVALID`) shows the generic error screen. Nothing stops the next new framework error code from having the same problem.
- **The template has blind spots and an incomplete recipe.** Its error screens and authenticated layout are outside the literal scan. It also doesn't show how a session-first app should sync the cookie, since the app's i18n object can't be imported in middleware.
- **The spec is out of date.** It still says "pending", names the wrong migration number, and leaves the IdP `locale` question (D-5) open.

## Solution

A `0.2.0-beta.11` release:
- **Catalog check:** missing keys fail it, with an explicit opt-out.
- **Cookie:** one rule decides whether the language cookie is `Secure`, used by both writers and honouring the gateway's forwarded protocol.
- **Error copy:** every framework error code has localized copy, enforced at compile time.
- **Template:** lints its error screens and layout, and documents the session-first middleware and switcher recipe.
- **Migration 69:** carries the release to template-based apps.
- **Docs:** the spec and old plans are brought up to date, with D-5 recorded as verified.

## User Stories

1. As an app developer, I want `check-catalogs` to fail when a non-default locale lacks a key, so that untranslated screens never reach production silently.
2. As an app developer mid-translation, I want an `--allow-missing` flag, so that I can merge partial work without disabling the whole check.
3. As an app developer, I want the failure to name the locale and the exact key, so that I can fix it without diffing JSON by hand.
4. As an app developer, I want coverage still reported per locale, so that I can track translation progress.
5. As a CI maintainer, I want the CLI to keep exit codes 0 (clean), 1 (findings) and 2 (usage error), so that pipelines need no change.
6. As a CI maintainer, I want an unknown flag to still be a usage error, so that typos don't pass silently.
7. As an end user behind the gateway, I want my language cookie to be `Secure` no matter which code path wrote it, so that it is never sent over plain HTTP.
8. As an operator, I want the cookie's `Secure` decision to follow `x-forwarded-proto`, using its first value in a proxy chain, so that TLS termination at the gateway is respected.
9. As an operator running locally over HTTP, I want the cookie not to be `Secure`, so that the language switcher still works in development.
10. As a framework maintainer, I want one exported helper for that decision, so that the two cookie writers can't drift apart again.
11. As an end user, I want a clear, translated message when the app's language configuration is invalid, so that I know it is a configuration problem and not my fault.
12. As an operator, I want that message to name `IGRP_FORMAT_LOCALES` / i18n configuration, so that I know what to fix.
13. As a framework maintainer, I want the build to fail when a new framework error code lacks chrome copy, so that no error ever falls back to generic text unnoticed.
14. As a template user, I want the error screens and authenticated layout scanned for hardcoded strings, so that the template I start from is fully translatable.
15. As a developer of a session-first app, I want a documented middleware snippet that needs only Edge-safe imports, so that I can sync the cookie without importing server-only code.
16. As a developer of a session-first app, I want a documented switcher wrapper that refreshes the session before the page re-renders, so that the new language shows immediately.
17. As a developer of a session-first app, I want to be told that `persistLocale` must resolve `false` without a session, so that login and invite pages don't redirect or call the API.
18. As a template-based app maintainer, I want migration 69 to bump the versions and tell me about the stricter catalog check and the manual `lint:i18n` change, so that upgrading doesn't surprise my CI.
19. As a template-based app maintainer, I want migration 69 to apply cleanly after 68, so that the migrator's chain and lock stay valid.
20. As a framework maintainer, I want the v2 spec to say it is implemented and give the right migration number, so that readers don't act on stale guidance.
21. As a framework maintainer, I want D-5 recorded as verified with its evidence, so that session-first apps can rely on the IdP `locale` claim.
22. As a reader of old plans, I want implemented steps ticked, so that their state matches the code.

## Implementation Decisions

- **Catalog checker (`next-i18n`):**
  - The options gain `allowMissing` (default false).
  - The CLI gains a boolean `--allow-missing`.
  - The missing-key error reads: `<locale>: missing key "<key>" (present in <default>)`.
  - Coverage reporting stays unchanged.
  - This is a deliberate behaviour change, released as a minor bump in pre mode.
- **Cookie security (`framework-next/i18n`, Edge-safe):**
  - A new `igrpIsSecureRequest(headers, fallbackProtocol?)` decides in this order: the first `x-forwarded-proto` value, then the given fallback protocol, then `origin`.
  - `igrpSetLocale` and `igrpSyncLocaleCookie` both use it.
  - The cookie options themselves don't change.
- **Error copy (`framework-next-ui`):**
  - `IGRPChromeErrorCode` gains `IGRP_I18N_CONFIG_INVALID`, with pt/en/fr copy.
  - A compile-time equality check in `framework-next` ties the chrome code union to `IgrpErrorCode`.
- **Template:**
  - The literal scan lists the root and `(igrp)` error screens, `global-error`, and the `(igrp)` layout. The CLI takes paths, not globs.
  - The middleware comment and docs carry the session-first recipe:
    - a constant `{ locales: IGRP_LOCALES, resolution: 'session-first' }` built from Edge-safe imports;
    - a switcher `onChanged` that awaits the session update, because the framework refreshes only after `onChanged` settles.
- **Release:**
  - The changesets are versioned to beta.11 (next, next-ui) and the matching next-i18n.
  - Migration `69-resync-framework-beta11` requires `68-dev-lucide-icon-map`, bumps the dependencies, writes the changed template files from its payload, and updates the template's migrations lock.
  - Script changes stay a documented manual step, because the migrator has no scripts step.
- **Docs:**
  - The v2 spec status becomes implemented, and migration references are corrected to 58.
  - D-5 is recorded as verified: the IdP emits `locale` from user metadata under the `profile` scope.
  - The test-provider name is corrected.

## Testing Decisions

- **What a good test is:** it tests behaviour through the public seam (CLI exit code and output, exported functions, cookies on a response, compile errors), never internals.
- **Seams** (agreed with Fidel 2026-10-21): the `igrp-i18n` CLI `main(argv)` and `checkCatalogs`; the exported `igrpIsSecureRequest`, `igrpSetLocale` and `igrpSyncLocaleCookie`; a type-level equality test; the template's own `pnpm build`.
- **Prior art:** `next-i18n` catalogs and cli tests (temp-dir fixtures); `framework-next` `sync-cookie`, `set-locale` and `config` tests (`NextRequest` fixtures); `next-ui` parity test; template-migrator validation tests.
- **Edge cases that must be covered:**
  - a proxy chain `https,http`
  - a header that contradicts the URL protocol
  - no headers at all
  - a partial catalog with and without `--allow-missing`
  - an existing deliberately partial fixture, updated to opt out

## Out of Scope

- **Relaxing the camelCase key rule for code-keyed entries.** No current app needs it.
- **Translating `igrpSetLocale`'s English error strings.** The switcher never shows them; it uses `i18n.localeSwitcher.changeError`.
- **The pt default fallback in `getDisplayableErrorMessage`.** It is documented, and callers pass translated copy.
- **A Zod/validation localization helper.** The convention of a translator-taking schema factory is enough.
- **Automating script edits in the migrator.**
- **Translating the template's `(demo)` pages.**
- **Application Center changes.** They are covered by the App Center's own spec and plan.

## Further Notes

The Application Center's session-first ticket waits on this release. The D-5 evidence is in the access-management backend: claims enrichment emits `locale` from `metadata.locale`, and the OIDC user service copies the upstream IdP's `locale` into metadata.
