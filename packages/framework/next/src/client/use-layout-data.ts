'use client';

import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Refresh helpers for the layout chrome (menus / apps / user).
 *
 * All three are `router.refresh()`. The layout data comes from `React.cache()`
 * helpers, which are request-scoped — there is no tagged cache entry to
 * invalidate, so a new request *is* the invalidation.
 *
 * @deprecated Unused by the framework; the `./client` entry is removed in a
 * later release. Call `useRouter().refresh()` from `next/navigation`.
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
