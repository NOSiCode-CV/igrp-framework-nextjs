import 'server-only';

import { AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { igrpGetAccessClientConfig, igrpResetAccessClientConfig } from './api-config.js';

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

/**
 * @deprecated Misnamed: there is no client cache to reset — `igrpGetAccessClient`
 * builds a fresh client per call. This only clears the per-request *config*.
 * Call {@link igrpResetAccessClientConfig} directly, which says what it does.
 */
export function igrpResetAccessClient(): void {
  igrpResetAccessClientConfig();
}
