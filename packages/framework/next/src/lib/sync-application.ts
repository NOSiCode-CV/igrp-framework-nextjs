import 'server-only';

import type { IGRPPackageJson } from '@igrp/framework-next-types';
import {
  type AccessManagementClient,
  type ApplicationDTO,
  type ApplicationType,
  type Status,
} from '@igrp/platform-access-management-client-ts';

import { toUpperCaseIdentifier } from './utils';

export type IGRPSyncApplicationArgs = {
  client: AccessManagementClient;
  appInformation: IGRPPackageJson;
  appCode: string;
};

export async function igrpSyncApplication({
  client,
  appInformation,
  appCode,
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

  await client.m2m.syncApplications(payload);

  console.info('Application', appCode, 'metadata synced successfully.');
}
