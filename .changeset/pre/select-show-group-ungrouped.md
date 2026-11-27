---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPSelect` with `showGroup` no longer hides options that have no `group`. They now appear under the "Outros" heading (`i18n.combobox.otherGroup`), as in `IGRPCombobox`. `IGRPTextarea` and `IGRPInputFile` drop a redundant flat `formState.errors[name]` read; nested names already resolved through `fieldState`, so behaviour is unchanged.
