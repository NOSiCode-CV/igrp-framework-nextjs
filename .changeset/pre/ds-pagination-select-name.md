---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTablePaginationNumeric`: the page-size select now has an accessible name. Its `aria-label` was on the Select root, which renders no element, so it never reached the trigger.
