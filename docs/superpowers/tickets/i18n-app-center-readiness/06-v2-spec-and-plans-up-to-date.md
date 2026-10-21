# 06: Update the v2 spec and old plans

**What to build:** Readers of the v2 i18n spec and its plans see the real state: the spec is implemented, migration 58 is cited where 56 was, the test provider has its correct name, and D-5 is recorded as verified with its backend evidence. The plans' implemented steps are ticked.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-app-center-readiness-spec.md` (stories 20–22) · **Plan:** Task 6

- [ ] The spec status says it is implemented, with the beta range, and points to this readiness work.
- [ ] Every "migration 56" reference for i18n says 58.
- [ ] `igrpRenderWithIntl` references say `IGRPIntlTestProvider`.
- [ ] D-5 reads: verified 2026-10-21; the IdP emits `locale` from user metadata under the `profile` scope and copies the upstream IdP's `locale` into metadata.
- [ ] The appendix shows the switcher `onChanged(locale, persisted)` signature, awaiting the session update.
- [ ] The checkboxes of plans 1–5 and the review-fixes plan are ticked where a commit exists. Any step left unticked carries a note.
