import 'server-only';

import type { IGRPConfigArgs, IGRPMenuItemArgs, IGRPPackageJson } from '@igrp/framework-next-types';
import type { AccessManagementClient } from '@igrp/platform-access-management-client-ts';

import { IgrpConfigError } from '../errors';
import { igrpGetAccessManagementClient } from './sync-client';

/**
 * Validated, ready-to-execute plan for the Access Management startup sync.
 *
 * `planAccessManagementSync(...)` returns either a fully-populated plan or
 * `null` (when sync is disabled or preview-mode is active). Errors with the
 * config shape — missing env vars, malformed identifiers — are thrown
 * synchronously from `planAccessManagementSync` so they bubble through React's
 * error boundary to `global-error.tsx`. `igrpStartupSync` itself only ever
 * sees a valid plan, which lets it stay a pure executor.
 */
export type IGRPAccessManagementSyncPlan = {
  client: AccessManagementClient;
  appCode: string;
  serviceId: string;
  appInformation: IGRPPackageJson;
  menus: IGRPMenuItemArgs[];
  syncOnCodeMenus: boolean;
  appRoutes?: string[];
  paramMapBody?: string;
};

export type IGRPPlanAccessManagementSyncArgs = {
  syncAccess: boolean;
  previewMode: boolean;
  appCode: string;
  appInformation: IGRPPackageJson;
  menus: IGRPMenuItemArgs[];
  apiManagementConfig: IGRPConfigArgs['apiManagementConfig'];
};

/**
 * Conservative identifier pattern for the AM service-id and app-code values.
 * These end up as resource `name` fields on the Access Management server,
 * and as the `X-Machine-Service-ID` header. Allow lowercase alphanumeric +
 * dashes/underscores, must start and end alphanumeric, max length 64.
 *
 * The match is case-insensitive at the framework boundary; the AM server
 * decides the canonical form on its side. We reject obvious garbage
 * (whitespace, special characters, oversize) before any network call.
 */
const SERVICE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}[a-z0-9]$/i;
const APP_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_]{0,62}[A-Z0-9]$/;

/**
 * Synchronous validator+planner. Runs during `IGRPRootLayout` render so any
 * misconfiguration throws `IgrpConfigError` with code
 * `IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING` — React's error boundary forwards
 * it to `app/global-error.tsx`, the same path other framework config errors
 * follow (see `lib/build.ts`).
 *
 * Returns `null` (no work) when:
 *   • `syncAccess` is false — sync explicitly disabled.
 *   • `previewMode` is true — preview mode is the auth/backend bypass.
 *
 * Throws `IgrpConfigError` when sync is supposed to run but the config is
 * incomplete or malformed. Never throws when returning `null`.
 */
export function planAccessManagementSync(
  args: IGRPPlanAccessManagementSyncArgs,
): IGRPAccessManagementSyncPlan | null {
  if (!args.syncAccess) return null;

  if (args.previewMode) {
    // Both flags on is almost always a developer-config slip — surface it
    // loudly but don't refuse to boot. The sync itself stays skipped.
    console.warn(
      '[igrp] IGRP_SYNC_ACCESS=true is being ignored because IGRP_PREVIEW_MODE=true. ' +
        'Unset one of them.',
    );
    return null;
  }

  const cfg = args.apiManagementConfig;
  const missing: string[] = [];
  if (!cfg?.baseUrl) missing.push('IGRP_ACCESS_MANAGEMENT_API');
  if (!cfg?.serviceId) missing.push('IGRP_SERVICE_ID');
  if (!cfg?.m2mClientId) missing.push('IGRP_M2M_CLIENT_ID');
  if (!cfg?.m2mClientSecret) missing.push('IGRP_M2M_CLIENT_SECRET');
  if (!args.appCode) missing.push('IGRP_APP_CODE');

  if (missing.length > 0) {
    throw new IgrpConfigError(
      'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING',
      `Access Management sync requires: ${missing.join(', ')}. ` +
        'Either set the missing env var(s) or disable sync by unsetting IGRP_SYNC_ACCESS.',
      { missing: missing.join(',') },
    );
  }

  // From here on, narrowing is safe — `missing.length === 0` proves every
  // required field is non-empty.
  const baseUrl = cfg!.baseUrl;
  const rawServiceId = cfg!.serviceId.trim();
  const m2mClientId = cfg!.m2mClientId.trim();
  const m2mClientSecret = cfg!.m2mClientSecret;
  const appCode = args.appCode.trim();

  // Re-check after trim — `"   "` is truthy but empty after trimming.
  const postTrimMissing: string[] = [];
  if (!baseUrl) postTrimMissing.push('IGRP_ACCESS_MANAGEMENT_API');
  if (!rawServiceId) postTrimMissing.push('IGRP_SERVICE_ID');
  if (!m2mClientId) postTrimMissing.push('IGRP_M2M_CLIENT_ID');
  if (!m2mClientSecret) postTrimMissing.push('IGRP_M2M_CLIENT_SECRET');
  if (!appCode) postTrimMissing.push('IGRP_APP_CODE');
  if (postTrimMissing.length > 0) {
    throw new IgrpConfigError(
      'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING',
      `Access Management sync requires non-blank values for: ${postTrimMissing.join(', ')}.`,
      { missing: postTrimMissing.join(',') },
    );
  }

  if (!SERVICE_ID_PATTERN.test(rawServiceId)) {
    throw new IgrpConfigError(
      'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING',
      `IGRP_SERVICE_ID must match ${SERVICE_ID_PATTERN.source} (got: "${cfg!.serviceId}").`,
      { field: 'serviceId', value: cfg!.serviceId },
    );
  }
  if (!APP_CODE_PATTERN.test(appCode)) {
    throw new IgrpConfigError(
      'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING',
      `IGRP_APP_CODE must match ${APP_CODE_PATTERN.source} (got: "${args.appCode}").`,
      { field: 'appCode', value: args.appCode },
    );
  }

  const client = igrpGetAccessManagementClient(
    { baseUrl, timeout: cfg!.timeout, headers: cfg!.headers },
    {
      serviceId: rawServiceId,
      clientId: m2mClientId,
      clientSecret: m2mClientSecret,
    },
  );

  return {
    client,
    appCode,
    serviceId: rawServiceId,
    appInformation: args.appInformation,
    menus: args.menus,
    syncOnCodeMenus: cfg!.syncOnCodeMenus === true,
    appRoutes: cfg!.appRoutes,
    paramMapBody: cfg!.paramMapBody,
  };
}
