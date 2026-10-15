---
'@igrp/igrp-framework-react-design-system': patch
---

i18n: English and French string catalogs (`IGRP_I18N_DEFAULTS_EN`, `IGRP_I18N_DEFAULTS_FR`) with a parity test against `IGRP_I18N_DEFAULTS_PT` (the renamed `_PT_PT`, kept as a deprecated alias). `IGRPI18nProvider` accepts a full catalog or a partial override (`strings`) over a `base`, merged generically. The calendar's date-fns locale and the chart tooltip's number formatting follow `useIGRPLocale()`.
