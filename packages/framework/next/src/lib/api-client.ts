import { cache } from 'react';
import { AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { igrpGetAccessClientConfig, igrpResetAccessClientConfig } from './api-config';

export const igrpGetAccessClient = cache(async (): Promise<AccessManagementClient> => {
  const { baseUrl, token, timeout = 10_000 } = igrpGetAccessClientConfig();
  return AccessManagementClient.create({
    baseUrl,
    timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
});

export function igrpResetAccessClient(): void {
  igrpResetAccessClientConfig();
}
