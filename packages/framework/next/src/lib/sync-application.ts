import { IGRPPackageJson } from '@igrp/framework-next-types';
import {
  AccessManagementClient,
  ApplicationDTO,
  ApplicationType,
  Status,
  ApiClientConfig,
  M2MClientConfig,
} from '@igrp/platform-access-management-client-ts';

import { toUpperCaseIdentifier } from './utils';

export type IGRPSyncApplicationArgs = {
  appInformation: IGRPPackageJson;
  baseUrl: string;
  appCode: string;
  m2mServiceId: string;
  m2mToken: string;
};

export async function igrpSyncApplication({
  appInformation,
  baseUrl,
  appCode,
  m2mServiceId,
  m2mToken,
}: IGRPSyncApplicationArgs) {
  const payload: ApplicationDTO = {
    id: 0,
    code: appCode || `APP_${toUpperCaseIdentifier(appInformation.name)}`,
    type: 'INTERNAL' as ApplicationType,
    name: appInformation.displayName ?? appInformation.name,
    status: 'ACTIVE' as Status,
    description: appInformation.description ?? '',
    departments: [],
  };

  const config: ApiClientConfig = {
    baseUrl: baseUrl,
  };

  const m2mConfig: M2MClientConfig = {
    serviceId: m2mServiceId,
    token: m2mToken,
  };

  const accessManagementClient = AccessManagementClient.create(config, m2mConfig);

  await accessManagementClient.m2m.syncApplications(payload);

  console.info('Application', appCode, 'metadata synced successfully.');
}
