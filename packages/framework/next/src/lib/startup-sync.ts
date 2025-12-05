import { IGRPMenuItemArgs, IGRPPackageJson } from '@igrp/framework-next-types';
import { igrpSyncApplication } from './sync-application';
import { igrpSyncMenus } from './sync-menus';
import { igrpSyncRoutes } from './sync-routes';

let isSynced = false;

export type IGRPStartupSyncArgs = {
  syncEnabled: boolean;
  appInformation: IGRPPackageJson;
  baseUrl: string;
  appCode: string;
  m2mServiceId: string;
  m2mToken: string;
  menus: IGRPMenuItemArgs[];
  appRoutesContent?: string;
  appRoutesMatch?: string;
};

export async function igrpStartupSync({
  syncEnabled,
  appInformation,
  baseUrl,
  appCode,
  m2mServiceId,
  m2mToken,
  menus,
  appRoutesContent,
  appRoutesMatch,
}: IGRPStartupSyncArgs) {
  console.info('=========== IGRP STARTUP SYNC ===========');

  if (!syncEnabled) {
    console.info(
      'Access Management synchronization skipped due to disabling. ' +
        'To re-enable it set IGRP_SYNC_ACCESS=true in environment variables.',
    );
    return;
  }

  if (isSynced) return;

  try {
    await igrpSyncApplication({ appInformation, baseUrl, appCode, m2mServiceId, m2mToken });
    await igrpSyncRoutes({ baseUrl, m2mServiceId, m2mToken, appRoutesContent, appRoutesMatch });
    await igrpSyncMenus({ appCode, menus, baseUrl, m2mServiceId, m2mToken, syncEnabled });
    isSynced = true;
    console.log('✔ Access Management sync completed.');
  } catch (e) {
    console.error('An error occurred while syncing with Access Management: ', e);
    return;
  }
}
