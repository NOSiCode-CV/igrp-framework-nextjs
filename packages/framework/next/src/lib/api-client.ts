import { AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { igrpGetAccessClientConfig, igrpResetAccessClientConfig } from './api-config';

export function igrpGetAccessClient(): AccessManagementClient {
  const { baseUrl, token, timeout } = igrpGetAccessClientConfig();
  if (!baseUrl || !token) {
    throw new Error(
      'Access Management client is not configured. Call igrpSetAccessClientConfig() first.',
    );
  }
  return AccessManagementClient.create({
    baseUrl,
    timeout: timeout ?? 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function igrpResetAccessClient(): void {
  igrpResetAccessClientConfig();
}
