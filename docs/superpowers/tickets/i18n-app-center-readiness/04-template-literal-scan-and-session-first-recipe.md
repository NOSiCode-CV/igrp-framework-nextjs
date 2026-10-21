# 04: Template literal-scan coverage and session-first recipe

**What to build:** The demo-v1 template scans its error screens, global error and authenticated layout for hardcoded strings, so an app started from it is fully translatable. A developer making an app session-first can copy a documented, Edge-safe middleware cookie sync and a switcher wrapper. The wrapper awaits the session update, so the new language shows straight away.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-app-center-readiness-spec.md` (stories 14–17) · **Plan:** Task 4

- [ ] `lint:i18n` lists the root and `(igrp)` error screens, `global-error` and the `(igrp)` layout. `check-literals` takes paths only, so each file is listed.
- [ ] Every finding is moved to the template catalogs in all three locales, or marked `igrp-i18n-ignore`. Catalog coverage stays at 100%.
- [ ] The middleware comment shows the session-first sync using only `@igrp/framework-next/i18n` imports.
- [ ] The template I18N doc has a "Session-first" section: middleware sync, a switcher `onChanged` that awaits the session update, and a `persistLocale` that resolves `false` without a session.
- [ ] The template's `pnpm build` passes (lint, lint:i18n and next build).
