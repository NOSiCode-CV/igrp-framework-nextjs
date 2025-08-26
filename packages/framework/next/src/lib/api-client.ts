import { AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { getIGRPAccessClientConfig } from './api-config';

let clientInstance: AccessManagementClient | null = null;

export async function getIGRPAccessClient(): Promise<AccessManagementClient> {
  // console.log({ clientInstance });

  if (clientInstance) return clientInstance;

  const { baseUrl, token, timeout = 45000 } = getIGRPAccessClientConfig();

  clientInstance = AccessManagementClient.create({
    baseUrl,
    timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return clientInstance;
}
