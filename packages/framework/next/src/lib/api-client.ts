import { AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { getAccessClientConfig } from './api-config';

let clientInstance: AccessManagementClient | null = null;

export async function getAccessClient(): Promise<AccessManagementClient> {
  if (clientInstance) return clientInstance;

  const { baseUrl, token, timeout = 45000 } = getAccessClientConfig();

  clientInstance = AccessManagementClient.create({
    baseUrl,
    timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return clientInstance;
}
