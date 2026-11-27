---
'@igrp/igrp-framework-react-design-system': patch
---

Accessibility fixes from the WCAG 2.1 AA audit of 2026-11-26:

- `IGRPCombobox` (`showSearch={false}`) and `IGRPMultiSelect` (no search box) can now be operated by keyboard. A visually hidden, read-only search input takes focus, so the arrow keys and Enter reach the list. Selected options carry `aria-checked`.
- `IGRPInputSearch`: the submit button is named "Pesquisar" (`inputSearch.submit`) when `submitButtonLabel` is not set.
- `IGRPForm`: the form-level error has `role="alert"`.
- `IGRPInputAddOn` renders `error` and `helperText`, with `aria-invalid` and `aria-describedby` on the input.
- The standalone date pickers (single, range, multiple, input) set `aria-invalid` when `error` is set.
- `IGRPFormList`: an item without `computeLabel` is named "Item {n}" for screen readers (`formList.item`).
- Data-table modal row actions: the dialog is named by the action label when there is no `modalTitle`. The title is visually hidden, so the layout does not change.
- `IGRPChat`: each message includes the sender name for screen readers. The composer is labelled (`chat.messageLabel`) and becomes read-only rather than disabled while a reply loads, so it keeps focus.
- `MenubarTrigger` shows a focus ring.
- `StepperTrigger` sets `aria-current="step"` on the active step. `IGRPProcessStepper` no longer sets it on the item.

New i18n keys: `inputSearch.submit`, `formList.item`, `chat.assistant`, `chat.messageLabel`.
