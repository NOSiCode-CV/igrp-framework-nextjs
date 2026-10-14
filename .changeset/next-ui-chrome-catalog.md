---
'@igrp/framework-next-ui': patch
---

i18n: one typed chrome catalog (`IGRPChromeStrings`) in Portuguese, English and French, covering the header, user menu, notifications, mode and theme switchers, command palette, breadcrumbs, app switcher, sidebar menus, auth screens, loading, forbidden, not-found, the error screens and the platform error codes. `IGRPChromeI18nProvider` supplies it; `useIGRPChromeI18n()` reads it, or, with no provider, the `IGRP_LOCALE` cookie on the client and Portuguese on the server. Every existing label prop still wins. `IGRPGlobalError` / `IGRPSegmentError` resolve copy by platform code by default and accept a partial `resolveCopy`. The `IGRP_*_LABELS_PT_PT` constants are deprecated aliases into `IGRP_CHROME_STRINGS_PT`.
