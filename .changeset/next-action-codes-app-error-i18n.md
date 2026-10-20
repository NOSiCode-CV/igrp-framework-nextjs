---
'@igrp/framework-next': patch
---

i18n of the remaining server-side user text:

- `ActionResult` failures from `@igrp/framework-next/actions` carry a machine-stable `code` (`IGRPActionErrorCode`: `SESSION_INVALID`, `MENUS_LOAD_FAILED`, `USER_LOAD_FAILED`, `APPS_LOAD_FAILED`, `APP_LOAD_FAILED`). Show users the next-intl message `errors.actions.<code>`, which the framework messages translate in pt, en and fr; `error` keeps its pt-PT text for logs.
- `AppError` without a `publicMessage` no longer encodes a Portuguese default into `digest`, so the error boundary shows its own translated generic copy.
- `getDisplayableErrorMessage(error, fallback?)` takes the copy to fall back to; the default stays pt-PT.
