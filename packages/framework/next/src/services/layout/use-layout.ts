import type { IGRPHeaderDataArgs, IGRPSidebarDataArgs } from '@igrp/framework-next-types';
import { fetchAppsByUser } from '../applications/use-applications';
import { fetchMenus } from '../menus/use-menus';
import { fetchCurrentUser } from '../users/use-user';

export async function fetchLayoutData(
  getHeaderData: () => Promise<IGRPHeaderDataArgs>,
  getSidebarData: () => Promise<IGRPSidebarDataArgs>,
  previewMode: boolean,
  appCode: number | undefined,
) {
  let headerData = await getHeaderData();
  let sidebarData = await getSidebarData();

  if (!previewMode) {
    if (!appCode) throw new Error('Applications Code not found');

    const menuItems = await fetchMenus(appCode);
    const user = await fetchCurrentUser();
    const apps = await fetchAppsByUser(user.username);

    headerData = {
      ...headerData,
      user,
    };

    sidebarData = {
      ...sidebarData,
      user,
      menuItems,
      apps,
      appCode,
      showPreviewMode: previewMode,
    };
  }

  return {
    headerData,
    sidebarData,
  };
}
