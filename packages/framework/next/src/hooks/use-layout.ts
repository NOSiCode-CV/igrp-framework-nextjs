import type { IGRPHeaderDataArgs, IGRPSidebarDataArgs } from '@igrp/framework-next-types';
import { fetchAppsByUser } from './use-applications';
import { fetchMenus } from './use-menus';
import { fetchCurrentUser } from './use-user';

export async function fetchLayoutData(
  getHeaderData: () => Promise<IGRPHeaderDataArgs>,
  getSidebarData: () => Promise<IGRPSidebarDataArgs>,
  previewMode: boolean,
  appCode: string | undefined,
) {
  let headerData = await getHeaderData();
  let sidebarData = await getSidebarData();

  if (!previewMode) {
    if (!appCode) throw new Error('[igrp-layout]: Código da aplicação não encontrada.');

    const menuItems = await fetchMenus(appCode);
    console.log({ menuItems });
    const user = await fetchCurrentUser();
    console.log({ user });
    const apps = await fetchAppsByUser(user.username);
    console.log({ apps });

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
