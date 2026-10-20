---
"@igrp/igrp-framework-react-design-system": patch
---

The combobox's heading for ungrouped options (`combobox.otherGroup`) and `CommandDialog`'s default screen-reader title and description (`commandDialog.title` / `commandDialog.description`) come from the i18n catalog instead of English literals. `command.tsx` is now a `"use client"` leaf.
