---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPInputNumber` no longer renders the increment/decrement buttons. The field is a plain input with the same border, focus and error styles as `IGRPInputText`. ArrowUp/ArrowDown still step by `step`, so `step` is no longer deprecated.

`inputClassName` now reaches the `<input>`. Before, the prop was accepted and silently dropped.

The `inputNumber.incrementLabel` and `inputNumber.decrementLabel` i18n keys are unused and marked deprecated. Overrides still compile.
