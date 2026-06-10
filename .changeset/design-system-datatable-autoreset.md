---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTable`: disable TanStack's `autoResetPageIndex`/`autoResetExpanded` — their microtask-based reset dispatches state updates before the component mounts under React 19 concurrent rendering ("Can't perform a React state update on a component that hasn't mounted yet"). The page-index reset on filter/sort changes is now handled synchronously in `tableReducer` instead, preserving the previous UX.
