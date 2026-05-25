import 'server-only';

import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  type AccessManagementClient,
  type MenuType,
  type Status,
} from '@igrp/platform-access-management-client-ts';

export interface IGRPSyncMenusArgs {
  client: AccessManagementClient;
  appCode: string;
  menus: IGRPMenuItemArgs[];
  syncEnabled: boolean;
}

export async function igrpSyncMenus({
  client,
  appCode,
  menus,
  syncEnabled,
}: IGRPSyncMenusArgs) {
  if (!syncEnabled) {
    console.info('On-code menus sync skipped (IGRP_SYNC_ON_CODE_MENUS=false).');
    return;
  }

  await client.m2m.syncApplicationMenus(
    appCode,
    menus.map((i: IGRPMenuItemArgs) => {
      return {
        ...i,
        type: i.type as MenuType,
        status: i.status as Status,
      };
    }),
  );

  console.info('On-code menus synchronized successfully.');
}
