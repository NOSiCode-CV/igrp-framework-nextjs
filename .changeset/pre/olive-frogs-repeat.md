---
"@igrp/igrp-framework-react-design-system": patch
---

Migrate the Horizon input layer onto the `Field` primitives and fix helper-text accessibility.

Every `IGRPInput*` (and `IGRPFieldDescription`) previously rendered its own field scaffolding — a `div` with `*:not-first:mt-2` or `space-y-*`, plus raw `<p>` elements for helper text and errors. The exported `Field`, `FieldDescription` and `FieldError` primitives are now used instead, so IGRP inputs and hand-composed `Field` forms produce the same markup and spacing.

**Accessibility fix (behavioural):** static helper text was rendered as `<p role="region" aria-live="polite">` in 22 places (and `role="note" aria-live="polite"` in two more). `region` declared a landmark with no accessible name, and `aria-live` caused screen readers to re-announce unchanged helper text on re-render. Helper text is now a plain `FieldDescription`; error text keeps `role="alert"` via `FieldError`.

Affected: `IGRPInputText`, `IGRPInputPassword`, `IGRPInputNumber`, `IGRPInputTextarea`, `IGRPInputFile`, `IGRPInputTime`, `IGRPInputDateTime`, `IGRPInputUrl`, `IGRPInputPhone`, `IGRPInputColor`, `IGRPInputCheckbox`, `IGRPInputSwitch`, `IGRPInputSelect`, `IGRPInputRadioGroup`, `IGRPInputSearch`, `IGRPCombobox`, `IGRPInputWithAddons`, the date-picker inputs, `IGRPFieldDescription` and `IGRPFormField`.

Component props are unchanged. Consumers who targeted the old internal markup — `p[role="region"]`, the `*:not-first:mt-2` wrapper, or the `text-xs` helper/error sizing — need to retarget `[data-slot="field-description"]` / `[data-slot="field-error"]`; helper and error text now inherit the `Field` type scale (`text-sm`).
