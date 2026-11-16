---
'@igrp/framework-next': patch
---

Performance fixes for the server layouts:

- The sidebar fetches `getSidebarData()` at the same time as the Access Management calls, instead of before them. The root layout resolves the locale and the branding together.
- The sidebar client component only receives the app and menu fields it reads. Menu `roles` and app `departments` are no longer sent to the browser.
- New optional `i18n.clientNamespaces`: when set, `IGRPRootLayout` sends only those top-level message namespaces (plus `i18n`) to the browser. When unset, the whole catalog is sent, as before.
- `IGRPGlobalLoading` takes an optional `name`. With it, the loading fallback shows at once without an Access Management call.
- The startup sync is no longer scheduled on every request once it has succeeded. The Access Management client is created once per request instead of once per call.
