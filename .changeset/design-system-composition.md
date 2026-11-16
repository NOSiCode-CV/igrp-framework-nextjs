---
'@igrp/igrp-framework-react-design-system': patch
---

Composition fixes. Old props keep working and are marked `@deprecated`.

- `IGRPFormList` takes `mode="form" | "standalone"` and warns in development when `value`/`onChange` are passed inside a form, where they are ignored. `IGRPStandaloneList` is no longer scheduled for removal.
- `IGRPAlertDialog`: new `trigger` slot; an `onAction` that returns a Promise keeps the dialog open, with the button loading, until it settles. `iconPlacement="end"` now shows the icon at the start instead of hiding it. Data-table alert actions are built on it.
- `IGRPDataTable` and `IGRPServerDataTable` take a `toolbar` slot. `isServerSide`, `serverFilterComponent`, `isNumericPagination` and `pageSizePagination` are deprecated.
- `IGRPPageHeader` takes `backButton` (an element) in place of the 11 `backButton*` props.
- `IGRPStepperProcess`: per-step `status` and `disabled`; `aria-current` follows `currentStep`; `children` can be a node.
- `IGRPInputSearch`: `debounce`, `startAdornment` and `submit`.
- `IGRPTabs` and `IGRPMenuNavigation` take `ReactNode` labels and a per-item `badge`. The menu-navigation provider exposes the active section and actions, with controlled `activeSection`/`onSectionChange`.
- `IGRPStatsCard`: `iconAppearance` and `iconShape` always colour the icon by `iconVariant`. `IGRPStatsCardMini` now rejects the props it overrides at the type level.
- `IGRPChat`: `onSend` adapter, `initialMessages`, `renderMessage` and `onAction`. Replies without a `type` render as text instead of an empty bubble.
- `IGRPMultiStepForm`: controlled `step`/`onStepChange`.
- Horizon contexts use React 19 `use()` and `<Context>`.

Behaviour changes to check:

- An `IGRPAlertDialog` whose `onAction` returns a Promise stays open, with the action loading, until the promise settles. On reject it stays open and the error is rethrown. While pending, both buttons are `aria-disabled` and keep focus.
- `IGRPDataTable` without `showPagination` renders every row in client mode, where it used to stop at 50. It warns in development above 500 rows.
- `badge={null}` (tabs, menu navigation) and `backButton={null}` (page header) hide the element instead of falling back to the deprecated props.
- `IGRPTooltip` always wraps its child in a `Slot`, and a disabled child keeps its focusable fallback even under a trigger that passes `disabled={false}`.
- Lazy chart skeletons take the chart's `size`, `height` and `width` instead of a 16:9 box.
- `IGRPStatsCard` without `iconAppearance` renders as before, except that a background without a shape, or a shape without a background, now colours the icon by `iconVariant`.
