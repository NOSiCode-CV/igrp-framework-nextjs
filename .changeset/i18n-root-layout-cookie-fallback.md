---
"@igrp/framework-next": patch
---

i18n follow-ups:

- `IGRPRootLayout` without `config.i18n` now reads the `IGRP_LOCALE` cookie on the server. When it names a platform locale, the layout mounts that language's built-in design-system and chrome catalogs and sets `<html lang>` to its default region. Design-system strings no longer stay Portuguese while the chrome switches, and the chrome no longer flashes Portuguese before hydration. The root layout now calls `cookies()` on that path, so the route renders dynamically.
- New `igrpLastFormatLocale()` in `@igrp/framework-next/i18n/client` returns the format locale `IGRPIntlProvider` last rendered with. `global-error.tsx` uses it to give `<html lang>` the deployment's region (`IGRP_FORMAT_LOCALES`), which it can't read itself.
