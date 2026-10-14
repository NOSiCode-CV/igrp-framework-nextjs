---
'@igrp/framework-next': patch
---

i18n runtime as subpath entries: `./i18n` (Edge-safe config, `igrpDefineI18n`, `igrpPickLocale`, `igrpSyncLocaleCookie`, format helpers), `./i18n/server` (`igrpResolveLocale`, `igrpCreateRequestConfig`, `igrpSetLocale`, catalog selection), `./i18n/client` (`IGRPIntlProvider`, `IGRPLocaleSwitcher`, `useIGRPFormat`, `useIGRPLocaleInfo`), `./i18n/messages` (generic `common`, `i18n`, `errors` namespaces and the layered merge) and `./i18n/testing` (`IGRPIntlTestProvider`). `igrpBuildConfig({ i18n })` makes `IGRPRootLayout` resolve the locale, mount the providers and set `<html lang>` to the format locale; `IGRPLayoutFull` seeds `Accept-Language` on framework API calls. Apps without `i18n` are unchanged. New dependencies: `next-intl`, the design system (already transitive).
