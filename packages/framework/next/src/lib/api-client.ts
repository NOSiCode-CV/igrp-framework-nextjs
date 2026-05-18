import { AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { igrpGetAccessClientConfig, igrpResetAccessClientConfig } from './api-config';

export function igrpGetAccessClient(): AccessManagementClient {
  const { baseUrl } = igrpGetAccessClientConfig();
  if (!baseUrl) {
    throw new Error(
      'Access Management client is not configured. Call igrpSetAccessClientConfig() first.',
    );
  }
  return AccessManagementClient.create({ baseUrl });
}

export function igrpResetAccessClient(): void {
  igrpResetAccessClientConfig();
}
