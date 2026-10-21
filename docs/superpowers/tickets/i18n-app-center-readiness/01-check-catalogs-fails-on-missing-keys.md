# 01: `check-catalogs` fails on missing keys

**What to build:** A team that ships a non-default locale with missing translations gets a failing `igrp-i18n check-catalogs` run. The failure names each missing key and its locale. A team mid-translation can pass `--allow-missing` to get today's coverage-only behaviour. Coverage per locale is still printed either way.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-app-center-readiness-spec.md` (stories 1–6) · **Plan:** Task 1

- [ ] A catalog set where en lacks a key that pt has fails with `en: missing key "<key>" (present in pt)`, and the CLI exits 1.
- [ ] The same set with `--allow-missing` exits 0 and still reports coverage, for example `en: 50%`.
- [ ] `--allow-missing` takes no value, so a path written after it is still read as a positional argument.
- [ ] An unknown flag is still a usage error (exit 2).
- [ ] The existing deliberately partial test fixture opts out explicitly.
- [ ] The CLI usage text documents the flag.
- [ ] The demo-v1 template's `lint:i18n` still passes.
- [ ] A changeset marks `@igrp/framework-next-i18n` as a minor bump, and its summary describes the behaviour change.
