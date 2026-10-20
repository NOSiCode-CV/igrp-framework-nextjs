import 'server-only';

import type { IGRPPermissionCatalogEntry } from '@igrp/framework-next-types';
import {
  type AccessManagementClient,
  type PermissionDTO,
  Status,
} from '@igrp/platform-access-management-client-ts';

export interface IGRPSyncPermissionsArgs {
  client: AccessManagementClient;
  /** Already validated by `planAccessManagementSync` — malformed names dropped. */
  permissions: IGRPPermissionCatalogEntry[];
  syncEnabled: boolean;
}

/**
 * Push the application's declared permission catalog to Access Management
 * (idempotent upsert keyed on `name`).
 *
 * Entries removed from the catalog are deliberately NOT deleted in AM —
 * soft-deleting a permission would break tokens already granting it. Retire
 * one through the AM admin UI instead.
 */
export async function igrpSyncPermissions({
  client,
  permissions,
  syncEnabled,
}: IGRPSyncPermissionsArgs) {
  if (!syncEnabled) {
    console.info('Permissions catalog sync skipped (IGRP_SYNC_PERMISSIONS=false).');
    return;
  }

  // An empty catalog is a no-op rather than an empty upsert: the call would
  // achieve nothing today, and would be actively unsafe if the endpoint ever
  // gained reconcile-or-delete semantics.
  if (permissions.length === 0) {
    console.info('Permissions catalog sync skipped (no permissions declared).');
    return;
  }

  await client.m2m.syncPermissions(
    permissions.map((p): PermissionDTO => ({
      // `id` is assigned by AM, which matches on `name` for an upsert. Set to
      // `undefined` so `JSON.stringify` OMITS the key entirely — sending
      // `id: 0` would put a literal `"id":0` on the wire, which a backend
      // matching on id could read as "update row 0". The cast is confined to
      // this line: `PermissionDTO` requires `id`, but the create path does
      // not (cf. the SDK's own `CreatePermissionRequest`, which omits it).
      id: undefined as unknown as number,
      name: p.name,
      description: p.description ?? null,
      status: p.enabled ? Status.ACTIVE : Status.INACTIVE,
      // App-synced permissions are not pre-associated with a department; a
      // manager binds them to roles/departments later in the AM admin UI.
      departmentCode: '',
    })),
  );

  console.info(`Permissions catalog synced (${permissions.length} entries).`);
}
