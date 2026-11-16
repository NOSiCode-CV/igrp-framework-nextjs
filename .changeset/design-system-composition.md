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
