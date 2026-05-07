import type { IGRPHeaderDataArgs, IGRPSidebarDataArgs } from '@igrp/framework-next-types';

import { IgrpLayoutDataError } from '../errors';
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
    if (!appCode) {
      throw new IgrpLayoutDataError(
        'IGRP_APP_CODE_MISSING',
        '[igrp-layout]: Código da aplicação não encontrada.',
      );
    }

    const [menuItems, user, apps] = await Promise.all([
      fetchMenus(appCode),
      fetchCurrentUser(),
      fetchAppsByUser(),
    ]);

    headerData = {
      ...headerData,
      ...(user !== null && { user }),
    };

    sidebarData = {
      ...sidebarData,
      user: user ?? undefined,
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
