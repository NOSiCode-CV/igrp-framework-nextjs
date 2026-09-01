'use client';

import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { revalidateAppsAction, revalidateMenusAction } from '../actions/index';

export function useLayoutData(appCode: string) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const refreshMenus = useCallback(() => {
    startTransition(async () => {
      await revalidateMenusAction(appCode);
      router.refresh();
    });
  }, [appCode, router, startTransition]);

  const refreshApps = useCallback(() => {
    startTransition(async () => {
      await revalidateAppsAction();
      router.refresh();
    });
  }, [router, startTransition]);

  const refreshUser = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  return { refreshMenus, refreshApps, refreshUser };
}
