# 03: Error copy for every framework error code

**What to build:** When an app's language configuration is invalid, users see a translated error screen in pt, en or fr that names the configuration to fix. They no longer get the generic copy. Adding a framework error code without chrome copy fails the build.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-app-center-readiness-spec.md` (stories 11–13) · **Plan:** Task 3 (it has the exact copy)

- [ ] The chrome error-code union includes `IGRP_I18N_CONFIG_INVALID`, with the pt, en and fr copy from the plan.
- [ ] A compile-time check in `framework-next` fails when the chrome code union and `IgrpErrorCode` differ. Before the fix, the check fails as expected.
- [ ] The next-ui catalog parity test passes.
- [ ] Changesets cover next-ui and next as patches.
