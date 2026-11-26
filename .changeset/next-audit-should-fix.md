---
"@igrp/framework-next": patch
---

Two fixes from the 2026-11-25 audit:

- `fetchMenusAction` rejects an `appCode` that is not a valid application code (letters, digits and underscores, 2 to 64 characters) with `MENUS_LOAD_FAILED`, before any Access Management call. Before, a value such as `../../admin/x?q=` reached another AM endpoint with the user's token.
- Branding cache: a fetch records the time it started, not the time it returned, so a brand save made during the fetch still triggers a refetch. `igrpInvalidateBranding` also discards a fetch that is already running, so it cannot write the old brand back.
