---
'@igrp/framework-next': patch
---

`IGRPGlobalLoading` reads its text from the framework message catalog (`common.actions.loading`, new `common.actions.loadingApp`), so it follows the active locale. In an app without `config.i18n` it uses the built-in copy for the `IGRP_LOCALE` cookie's language instead of throwing.
