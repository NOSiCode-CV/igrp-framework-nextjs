---
"@igrp/framework-next-i18n": patch
---

`igrp-i18n` flags literals inside ternaries, `&&`, `||` and `??`, the `text`, `message` and `emptyText` props, and hardcoded `Intl` and `toLocale*` locales, and it scans `.ts` files. It rejects unknown flags, accepts `--name=value`, and reports unreadable catalogs as errors. Catalogs now flag empty translations and plural categories the locale never selects.
