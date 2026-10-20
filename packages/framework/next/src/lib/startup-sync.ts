import 'server-only';

import type { IGRPAccessManagementSyncPlan } from './sync-plan.js';
import { igrpSyncApplication } from './sync-application.js';
import { igrpSyncMenus } from './sync-menus.js';
import { igrpSyncPermissions } from './sync-permissions.js';
import { igrpSyncRoutes } from './sync-routes.js';

/**
 * Module-level promise-mutex: set on first invocation, subsequent calls share
 * the same promise so concurrent requests don't trigger duplicate syncs.
 * Reset to `null` on failure so the next request can retry.
 *
 * Lives at module scope intentionally — `IGRPRootLayout` schedules
 * `igrpStartupSync` via `after()` post-stream, and we want exactly one sync
 * per process lifetime (or per failure-recovery cycle), not one per request.
 */
let syncPromise: Promise<void> | null = null;

/**
 * Earliest wall-clock time a retry may start, set after a failure.
 *
 * `IGRPRootLayout` schedules this via `after()` on EVERY request. Resetting the
 * mutex on failure without a cooldown therefore meant a persistently
 * unreachable Access Management server got a full four-call sync attempt per
 * request, each one logging `igrp.am.sync_failed` — a retry storm that also
 * buries the first, useful error. The cooldown keeps the retry (a transient
 * outage still recovers on its own) while bounding the rate.
 */
let retryNotBefore = 0;

/** Cooldown between sync attempts after a failure. */
const RETRY_COOLDOWN_MS = 60_000;

/** Test seam — drops the mutex and the cooldown. */
export function igrpResetStartupSync(): void {
  syncPromise = null;
  retryNotBefore = 0;
}

/**
 * Pure executor. Caller (`IGRPRootLayout` via `after()`) has already
 * validated the plan in `planAccessManagementSync` — this function never
 * inspects env vars and never throws config errors. Network/runtime errors
 * are caught, logged as structured JSON, and the mutex is reset so the next
 * request can retry.
 *
 * Errors thrown here cannot reach a React error boundary (we are post-
 * stream), which is why config-shape validation happens earlier. See
 * `sync-plan.ts` for the validation surface.
 */
export async function igrpStartupSync(plan: IGRPAccessManagementSyncPlan): Promise<void> {
  if (syncPromise) return syncPromise;
  if (Date.now() < retryNotBefore) return;

  syncPromise = (async () => {
    try {
      // Application must exist before routes and menus can reference it.
      await igrpSyncApplication({
        client: plan.client,
        appInformation: plan.appInformation,
        appCode: plan.appCode,
      });

      // Routes, menus and the permission catalog are independent of each
      // other — run in parallel. They share the same `plan.client`, so the
      // OAuth2 token cache hits for the later calls regardless of order.
      // Permissions carry no `applicationCode` and an empty `departmentCode`
      // (a flat global catalog), so they have no ordering constraint against
      // menus or routes.
      await Promise.all([
        igrpSyncRoutes({
          client: plan.client,
          serviceId: plan.serviceId,
          appRoutes: plan.appRoutes,
          paramMapBody: plan.paramMapBody,
        }),
        igrpSyncMenus({
          client: plan.client,
          appCode: plan.appCode,
          menus: plan.menus,
          syncEnabled: plan.syncOnCodeMenus,
          syncRoles: plan.syncOnCodeMenuRoles,
        }),
        igrpSyncPermissions({
          client: plan.client,
          permissions: plan.permissions,
          syncEnabled: plan.syncPermissions,
        }),
      ]);

      console.info('Access Management sync completed.');
    } catch (e) {
      // Reset so a later request can attempt a retry — but not the very next
      // one; see `retryNotBefore`.
      syncPromise = null;
      retryNotBefore = Date.now() + RETRY_COOLDOWN_MS;
      // Structured log so operators can grep for the event. We deliberately
      // log only the error name+message — never the client secret, the
      // bearer token, or the client id. `serviceId` is a public identifier
      // and safe to include.
      const error =
        e instanceof Error ? { name: e.name, message: e.message } : { message: String(e) };
      console.error(
        JSON.stringify({
          event: 'igrp.am.sync_failed',
          serviceId: plan.serviceId,
          appCode: plan.appCode,
          retryAfterMs: RETRY_COOLDOWN_MS,
          error,
        }),
      );
    }
  })();

  return syncPromise;
}
