---
"@igrp/igrp-framework-react-design-system": patch
---

New `IGRPServerDataTable`, a controlled, server-paginated table. The parent owns `pagination` (`IGRPServerPaginationState`) and gets `onPaginationChange(pageIndex, pageSize)`. Sorting is manual only when `sorting` and `onSortingChange` are both given. The pagination bar shows whenever there are rows and stays interactive while `isLoading`. Also takes `paginationType`, `layout` and `getRowId`; expanded rows follow the record only with `getRowId`, otherwise the row's index in `data`.
