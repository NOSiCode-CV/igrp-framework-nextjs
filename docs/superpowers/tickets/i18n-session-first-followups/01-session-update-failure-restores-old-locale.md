# 01: A failed session update after a saved language brings the old language back

**What to build:** In a session-first app, a signed-in user changes the language and it is saved to their profile. If the client-side session update (`update({ locale })` in the app's `onChanged`) then fails, the user must not see the page silently snap back to the old language. Either the new language sticks, or the switcher shows its error state and says the change will apply at the next sign-in.

**Blocked by:** None (can start immediately)

**Status:** resolved (2026-10-22): option D, roll back. `igrpRunLocaleChange` re-runs `action(previous)` and skips the refresh when `onChanged` fails after a persisted change; template docs and migration 73 show the wrapper that throws on a failed `update()`. The latency item below is still open.

**Found:** 2026-10-22, while the Application Center adopted session-first (App Center spec `2026-10-21-i18n-framework-adoption-spec.md`, Task 5 review).

## What happens today
1. `igrpSetLocale` persists (`persistLocale` resolves `true`) and writes the `IGRP_LOCALE` cookie with the new locale.
2. `igrpRunLocaleChange` (`packages/framework/next/src/i18n/client/locale-change.ts`) awaits `onChanged`. If that throws, it logs, marks `failed`, and still calls `router.refresh()`.
3. On the refresh, middleware runs `igrpSyncLocaleCookie` with the token's locale. The token wasn't updated, so it still holds the OLD locale, and the cookie is rewritten back to the old value.
4. `getSessionLocale` also returns the old token locale, and session-first resolution prefers it. The page renders in the old language. The profile holds the new one, so the user gets it at their next sign-in.

The result: the switcher shows a failure dot, but the page returns to the old language, and on the next sign-in it changes "by itself".

## Options (pick one in the ticket)
- **A. Skip the refresh on `onChanged` failure under session-first,** and keep the new cookie. Without a refresh, the old token cannot overwrite it until the next navigation. This is weak.
- **B. Let `igrpSyncLocaleCookie` defer to a fresher cookie.** For example, the set-locale path stamps the cookie with the time of the change; the sync skips the rewrite when that stamp is newer than the token's `iat`. This needs care with Edge-safe parsing.
- **C. Retry `update()` once,** then show the switcher's `changeError` with copy that says the change applies at the next sign-in. This changes copy only, plus one key in the i18n catalog.

## Acceptance criteria
- [x] A test in `locale-change.test.ts` (or the sync-cookie tests) reproduces the stale-token rewrite, and it fails before the fix.
- [x] After the fix, a failed `onChanged` under session-first never leaves the UI showing success while the page is in the old language.
- [x] Cookie-first apps behave exactly as before.
- [x] Docs: the template `docs/I18N.md` "Session-first" section describes the failure behaviour.
- [x] A changeset is added for `@igrp/framework-next`.

## Also worth measuring (same area)
In dev mode, a language switch in the App Center takes about 4–5 seconds: the server action, then `update()`, then `router.refresh()`. Measure it in a production build. If it's still slow, consider an optimistic `<html lang>` switch, or a clearer pending state on the switcher than the spinner alone.
