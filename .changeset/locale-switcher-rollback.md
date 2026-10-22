---
"@igrp/framework-next": patch
---

Locale switcher: when `onChanged` fails after a persisted (session-first) change, roll the profile and cookie back to the previous locale and skip the refresh instead of refreshing into the old session locale. `igrpRunLocaleChange` takes an optional `previous` locale; without it the old behaviour is kept.
