'use client';

import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Refresh helpers for the layout chrome (menus / apps / user).
 *
 * All three are `router.refresh()`. The layout data comes from `React.cache()`
 * helpers, which are request-scoped — there is no tagged cache entry to
 * invalidate, so a new request *is* the invalidation. This hook used to `await`
 * `revalidateMenusAction` / `revalidateAppsAction` first; both are documented
 * no-ops kept only for API stability, so that was a Server Action round-trip
 * that delayed the refresh and changed nothing.
 */
export function useLayoutData(_appCode: string) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  return { refreshMenus: refresh, refreshApps: refresh, refreshUser: refresh };
}
