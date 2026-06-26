---
"@igrp/template-migrator": patch
---

Add migration 21 (template-resync-catchup): re-capture 9 demo-v1 files and the
next/react/react-dom dep pins that had drifted from the shipped migrations, so
`check:drift` passes again. No template behavior change — a drift-parity snapshot.
