---
"@igrp/template-migrator": patch
---

- Add migration 26: bring 9 previously untracked files under migration coverage (`utilities.ts`, `query-client.tsx`, config/login, config/site, fonts, forbidden, loading, health route, generated layout); update 18 drifted tracked files to current template state; add `file.delete` steps for 4 stale paths removed from the template (`auth-helpers.ts`, `auth-options.ts`, `[...not-found]/page.tsx`, `types/next-auth.d.ts`)
