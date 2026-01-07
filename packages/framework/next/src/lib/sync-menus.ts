import { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  AccessManagementClient,
  ApiClientConfig,
  M2MClientConfig,
  MenuType,
  Status,
} from '@igrp/platform-access-management-client-ts';

export interface IGRPSyncMenusArgs {
  appCode: string;
  menus: IGRPMenuItemArgs[];
  baseUrl: string;
  m2mServiceId: string;
  m2mToken: string;
  syncEnabled: boolean;
}

export async function igrpSyncMenus({
  appCode,
  menus,
  baseUrl,
  m2mServiceId,
  m2mToken,
  syncEnabled,
}: IGRPSyncMenusArgs) {
  console.log('================================================');
  console.log({ appCode, menus, baseUrl, m2mServiceId, m2mToken, syncEnabled });
  console.log('================================================');

  if (!syncEnabled) {
    console.log(
      'On code menus synchronization skipped due to disabling. ' +
        'To re-enable it set IGRP_SYNC_ON_CODE_MENUS=true in environment variables.',
    );
    return;
  }

  const config: ApiClientConfig = {
    baseUrl: baseUrl,
  };

  const m2mConfig: M2MClientConfig = {
    serviceId: m2mServiceId,
    token: m2mToken,
  };

  const accessManagementClient = AccessManagementClient.create(config, m2mConfig);

  await accessManagementClient.m2m.syncApplicationMenus(
    appCode,
    menus.map((i: IGRPMenuItemArgs) => {
      return {
        ...i,
        type: i.type as MenuType,
        status: i.status as Status,
      };
    }),
  );

  console.log(
    'On code menus synchronized successfully. To disable it set IGRP_SYNC_ON_CODE_MENUS as false in environment variables.',
  );
}
