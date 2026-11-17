---
'@igrp/igrp-framework-react-design-system': patch
---

`IGRPButton` keeps keyboard focus while `loading`. It uses `aria-disabled` instead of native `disabled` and cancels clicks, so `onClick` does not run and a `type="submit"` button does not submit its form, by click or by Enter in a field. `disabled` still sets native `disabled`. Tests that asserted `toBeDisabled()` on a loading button should check `aria-disabled="true"` instead. `IGRPAlertDialog` uses `IGRPButton loading` for its pending action again.
