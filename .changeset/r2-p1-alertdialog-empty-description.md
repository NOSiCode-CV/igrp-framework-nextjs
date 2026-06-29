---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTableButtonAlert` no longer renders an empty `AlertDialogDescription`
when the action has no description. The description is now guarded on `children`,
so Radix gets no dangling `aria-describedby` and screen readers aren't handed an
empty description node. (`IGRPAlertDialog` already guards on `description`.)
