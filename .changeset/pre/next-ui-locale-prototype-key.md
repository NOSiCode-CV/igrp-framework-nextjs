---
"@igrp/framework-next-ui": patch
---

`igrpChromeStringsFor` no longer returns `Object.prototype` members for a locale tag such as `constructor` or `__proto__`. Such a value in the `IGRP_LOCALE` cookie made every chrome component throw, including `IGRPGlobalError`; it now falls back to Portuguese like any other unsupported tag.
