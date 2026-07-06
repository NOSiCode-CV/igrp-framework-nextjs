---
"@igrp/framework-next": patch
---

- Fixed `fetchMenusAction`, `fetchCurrentUserAction`, `fetchAppsByUserAction`, and `fetchAppByCodeAction` swallowing the redirect to `/login` that `fetchMenus`/`fetchCurrentUser`/`fetchAppsByUser`/`fetchAppByCode` trigger on a 401/403 from the access-management API — a generic `catch` was flattening Next's internal `NEXT_REDIRECT` control-flow error into a plain `ActionResult` failure instead of letting the redirect happen. These actions now use `unstable_rethrow` so Next's own redirect/not-found signals propagate correctly.
- `revalidateMenusAction`/`revalidateAppsAction` no longer call `revalidateTag` on tags that nothing ever sets — a no-op left over from an earlier caching design. They're now explicit no-ops; data freshness continues to come from the caller's `router.refresh()` (see `useLayoutData`).
