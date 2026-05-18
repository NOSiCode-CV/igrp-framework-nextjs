import { IGRPMenuItemArgs, IGRPPackageJson } from '@igrp/framework-next-types';
import { igrpSyncApplication } from './sync-application';
import { igrpSyncMenus } from './sync-menus';
import { igrpSyncRoutes } from './sync-routes';

export type IGRPStartupSyncArgs = {
  syncEnabled: boolean;
  appInformation: IGRPPackageJson;
  baseUrl: string;
  appCode: string;
  m2mServiceId: string;
  m2mToken: string;
  menus: IGRPMenuItemArgs[];
  appRoutes?: string[];
  paramMapBody?: string;
};

// Promise-based mutex: set on first invocation, subsequent calls share the same
// promise so concurrent requests don't trigger duplicate syncs. Reset to null
// on failure to allow a retry on the next request.
let syncPromise: Promise<void> | null = null;

export async function igrpStartupSync({
  syncEnabled,
  appInformation,
  baseUrl,
  appCode,
  m2mServiceId,
  m2mToken,
  menus,
  appRoutes,
  paramMapBody,
}: IGRPStartupSyncArgs) {
  if (!syncEnabled) {
    console.info(
      'Access Management synchronization skipped due to disabling. ' +
        'To re-enable it set IGRP_SYNC_ACCESS=true in environment variables.',
    );
    return;
  }

  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      // Application must exist before routes and menus can reference it.
      await igrpSyncApplication({ appInformation, baseUrl, appCode, m2mServiceId, m2mToken });

      // Routes and menus are independent of each other — run in parallel.
      await Promise.all([
        igrpSyncRoutes({ baseUrl, m2mServiceId, m2mToken, appRoutes, paramMapBody }),
        igrpSyncMenus({ appCode, menus, baseUrl, m2mServiceId, m2mToken, syncEnabled }),
      ]);

      console.info('Access Management sync completed.');
    } catch (e) {
      // Reset so the next request can attempt a retry.
      syncPromise = null;
      console.error('An error occurred while syncing with Access Management: ', e);
    }
  })();

  return syncPromise;
}
