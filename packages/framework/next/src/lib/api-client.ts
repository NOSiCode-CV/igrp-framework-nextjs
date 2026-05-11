import { AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { igrpGetAccessClientConfig, igrpResetAccessClientConfig } from './api-config';

let clientInstance: AccessManagementClient | null = null;

export function igrpResetAccessClient() {
  clientInstance = null;
  igrpResetAccessClientConfig();
}

export async function igrpGetAccessClient(): Promise<AccessManagementClient> {
  const { baseUrl, token, timeout = 10000 } = igrpGetAccessClientConfig();

  if (!baseUrl) {
    throw new Error(
      'igrpGetAccessClient: baseUrl is not configured. Call igrpSetAccessClientConfig() before making API requests.',
    );
  }

  clientInstance = AccessManagementClient.create({
    baseUrl,
    timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return clientInstance;
}
