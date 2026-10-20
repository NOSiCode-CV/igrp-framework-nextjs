---
'@igrp/framework-next-types': patch
---

`IGRPI18nConfigBase.persistLocale` may resolve `boolean`: `false` reports that nothing was saved (no session), so `igrpSetLocale` answers `persisted: false`.
