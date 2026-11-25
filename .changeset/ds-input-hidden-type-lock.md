---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPInputHidden` always renders `type="hidden"`. Outside a form, caller props were spread after `type`, so an untyped `type="text"` made the field visible. Inside a form it was already safe.
