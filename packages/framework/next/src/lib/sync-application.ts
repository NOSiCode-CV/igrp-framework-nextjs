import 'server-only';

import type { IGRPPackageJson } from '@igrp/framework-next-types';
import {
  type AccessManagementClient,
  type ApplicationDTO,
  type ApplicationType,
  type Status,
} from '@igrp/platform-access-management-client-ts';

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
    // `appCode` is non-blank by construction — `planAccessManagementSync`
    // proves it before building the plan this executor receives — so the old
    // "appCode or APP_<name>" fallback was unreachable, and hid the fact that
    // the two could ever disagree.
    code: appCode,
    type: 'INTERNAL' as ApplicationType,
    name: appInformation.displayName ?? appInformation.name,
    status: 'ACTIVE' as Status,
    description: appInformation.description ?? '',
    slug: appInformation.slug,
    departments: [],
  };

  await client.m2m.syncApplications(payload);

  console.info('Application', appCode, 'metadata synced successfully.');
}
