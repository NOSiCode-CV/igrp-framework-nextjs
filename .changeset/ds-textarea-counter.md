---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPTextarea`: new `showCounter`, `showProgress`, `warnAt` and `enforceMaxLength` props. With `maxLength`, the form value is now truncated to the limit even when it arrives through `setValue` or `reset`, and the field becomes dirty; pass `enforceMaxLength={false}` to keep the old behaviour. Without `showCounter`, nothing changes visually.
