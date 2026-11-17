---
'@igrp/igrp-framework-react-design-system': patch
---

Performance fixes from a React/Next.js review, plus two data-table bugs:

- **Data table:** the text filter, sort arrows, expand chevron, row checkbox and switch, and the clear-filters button no longer freeze when `columns` is memoized. The React Compiler was caching TanStack getters on objects whose identity never changes; those files now opt out with `"use no memo"`.
- **Data table:** without `showPagination`, client mode now renders every row. Before, rows after the 50th were cut off and no controls were shown to reach them. Server mode is unchanged.
- **Data table:** typing in the text filter runs the filtering in a transition. `onQueryChange` no longer fires again when the parent passes a new inline callback. Date-range and faceted filters parse their value once per change instead of once per row.
- **React Compiler:** files that create a context are compiled now (sidebar, tooltip, form, chart, carousel, stepper, toggle group, i18n context). `Calendar`, `IGRPChat` and `IGRPImageCropper` no longer bail out. Dragging the cropper no longer re-renders the component.
- **Bundle:** `IGRPInputPhone` loads its flag set lazily (about 58 KB gzipped). `IGRPAreaChart` loads recharts lazily, like the other charts.
- `Intl` number and date formatters are cached and reused. `IGRPMultiSelect` groups options in linear time, and `IGRPSelect` normalizes labels once per `options`. `IGRPForm` keeps a stable context value.
- `SidebarMenuSkeleton` no longer uses `Math.random()`, which caused a hydration mismatch.
