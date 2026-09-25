---
'@igrp/igrp-framework-react-design-system': patch
---

Restore the light `--border` and `--sidebar-border` tokens to `oklch(0.929 …)`.

The WCAG pass on 2026-09-14 darkened `--border`, `--input` and `--ring` to 0.64
together. WCAG 1.4.11 (3:1 non-text contrast) applies to the boundaries that
identify a control, and the form controls draw theirs with `--input` / `--ring`,
which stay at 0.64. `--border` is decorative: separators, card edges, table rules,
and the base `* { border-color }`. At 0.64 every divider in the app became a
heavy dark line. Dark mode is unchanged.
