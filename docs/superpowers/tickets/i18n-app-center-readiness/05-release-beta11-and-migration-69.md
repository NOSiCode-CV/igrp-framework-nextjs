# 05: Release beta.11 and migration 69

**What to build:** Template-based apps can run the migrator to reach framework 0.2.0-beta.11 with tickets 01–04 included. The migration tells them about the stricter catalog check and the one manual script edit.

**Blocked by:** 01, 02, 03, 04

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-app-center-readiness-spec.md` (stories 18–19) · **Plan:** Task 5

- [ ] Changesets are versioned; the resulting versions are recorded in the migration.
- [ ] Migration `69-resync-framework-beta11`:
  - requires `68-dev-lucide-icon-map`;
  - bumps the framework dependencies;
  - writes the template files changed in ticket 04 from its payload.
- [ ] The migration's "After migrating" section covers `--allow-missing` and the manual `lint:i18n` path change.
- [ ] The template's migrations lock records 69, and a template-migration changeset exists, as migration 63 had.
- [ ] The template-migrator tests pass.
- [ ] `pnpm build:framework` and the template build pass.
