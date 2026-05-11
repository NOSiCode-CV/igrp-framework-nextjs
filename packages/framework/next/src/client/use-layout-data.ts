'use client';

import { useRouter } from 'next/navigation';

import { revalidateAppsAction, revalidateMenusAction } from '../actions/index';

export function useLayoutData(appCode: string) {
  const router = useRouter();

  return {
    refreshMenus: async () => {
      await revalidateMenusAction(appCode);
      router.refresh();
    },
    refreshApps: async () => {
      await revalidateAppsAction();
      router.refresh();
    },
    refreshUser: async () => {
      router.refresh();
    },
  };
}
