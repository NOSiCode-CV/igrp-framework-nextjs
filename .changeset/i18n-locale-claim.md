---
'@igrp/framework-next-auth': patch
'@igrp/framework-next-types': patch
---

i18n groundwork: the default provider maps the OIDC `locale` claim, the `jwt` callback carries it as `token.locale` (seeded at sign-in, replaced by `update({ locale })`) and the `session` callback exposes `session.user.locale`. `framework-next-types` declares `IGRPI18nConfigBase` and the optional `IGRPConfigArgs.i18n`. No behaviour change for apps that do not use i18n.
