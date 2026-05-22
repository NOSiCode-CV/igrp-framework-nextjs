import 'server-only';

import {
  AccessManagementClient,
  type ApiClientConfig,
  type M2MClientConfig,
} from '@igrp/platform-access-management-client-ts';

/**
 * Per-process cache of `AccessManagementClient` instances keyed by
 * `${baseUrl}|${clientId}`.
 *
 * The downstream library's JSDoc on `ClientCredentialsTokenProvider` states:
 * "One instance per (baseUrl, clientId) is enough — it memoises the token
 * until it's within `refreshLeewayMs` of expiration and refreshes it
 * transparently on the next `getAccessToken()` call."
 *
 * Mirroring that natural identity here means:
 *   • All three startup-sync phases (application/routes/menus) share a
 *     single OAuth2 token cache for the same credentials.
 *   • A future caller with different `(baseUrl, clientId)` gets a
 *     correctly-scoped client instead of silently inheriting the first
 *     call's credentials.
 *   • Tests can pass stub credentials and get a fresh client per case.
 *
 * In a single-tenant deployment the Map size stays at 1.
 */
const clients = new Map<string, AccessManagementClient>();

/**
 * Narrowed `M2MClientConfig` — at the framework's call site,
 * `planAccessManagementSync` has already validated that both fields are
 * present, so we tighten the optional types from the library.
 */
export type M2MClientCredentials = {
  serviceId: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
};

/**
 * Return a shared `AccessManagementClient` for the given `(baseUrl, clientId)`.
 * Creates one on first call, reuses thereafter. Safe across HMR re-evaluation
 * in `next dev` (the Map resets, the token cache rebuilds), serverless cold
 * starts (new process → new Map → first request pays one token fetch via
 * `after()`, not in the response path), and warm-container reuse.
 *
 * Never call from a client component — `import 'server-only'` guards against
 * that at compile time.
 */
export function igrpGetAccessManagementClient(
  config: ApiClientConfig,
  credentials: M2MClientCredentials,
): AccessManagementClient {
  const key = `${config.baseUrl}|${credentials.clientId}`;
  let client = clients.get(key);
  if (!client) {
    const m2mConfig: M2MClientConfig = {
      serviceId: credentials.serviceId,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      scope: credentials.scope,
    };
    client = AccessManagementClient.create(config, m2mConfig);
    clients.set(key, client);
  }
  return client;
}
