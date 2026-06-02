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
  /**
   * Forwarded as the `syncRoles` argument of
   * `client.m2m.syncApplicationMenus`. When `true`, AM also reconciles the
   * menu↔role assignments during the push. Required (no default) so a caller
   * that forgets to thread it through fails compilation rather than silently
   * changing behavior — the default lives at the config boundary
   * (`IGRP_SYNC_ON_CODE_MENU_ROLES`).
   */
  syncRoles: boolean;
}

export async function igrpSyncMenus({
  client,
  appCode,
  menus,
  syncEnabled,
  syncRoles,
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
    syncRoles,
  );

  console.info(`On-code menus synchronized successfully (syncRoles=${syncRoles}).`);
}
