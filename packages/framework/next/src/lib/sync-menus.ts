import 'server-only';

import type {
  IGRPMenuItemArgs,
  IGRPMenuTypeSyncable,
  IGRPStatus,
} from '@igrp/framework-next-types';
import {
  type AccessManagementClient,
  type MenuEntryDTO,
  MenuType,
  Status,
} from '@igrp/platform-access-management-client-ts';

/**
 * Framework menu type → the client's `MenuType` enum member.
 *
 * `satisfies Record<IGRPMenuTypeSyncable, MenuType>` is the whole point: the
 * key set must cover every syncable framework type exactly, so adding one
 * without a mapping fails compilation here. `IGRPMenuTypeSyncable` is in turn
 * asserted equal to this enum by `next-types`' contract gate, so a new member
 * on the Access Management side fails there.
 *
 * This replaces `type: i.type as MenuType`. That cast was not cosmetic —
 * `IGRPMenuType` carries the framework-only `SYSTEM_PAGE`, which the enum does
 * not define, so a template declaring a `SYSTEM_PAGE` entry with
 * `IGRP_SYNC_ON_CODE_MENUS=true` pushed a value AM does not understand.
 */
const MENU_TYPE_TO_DTO = {
  FOLDER: MenuType.FOLDER,
  MENU_PAGE: MenuType.MENU_PAGE,
  EXTERNAL_PAGE: MenuType.EXTERNAL_PAGE,
  GROUP: MenuType.GROUP,
} satisfies Record<IGRPMenuTypeSyncable, MenuType>;

/** Framework status → the client's `Status` enum member. Exhaustive, as above. */
const STATUS_TO_DTO = {
  ACTIVE: Status.ACTIVE,
  INACTIVE: Status.INACTIVE,
  DELETED: Status.DELETED,
} satisfies Record<IGRPStatus, Status>;

function isSyncable(
  menu: IGRPMenuItemArgs,
): menu is IGRPMenuItemArgs & { type: IGRPMenuTypeSyncable } {
  return menu.type in MENU_TYPE_TO_DTO;
}

/**
 * Build the upsert payload for one menu entry.
 *
 * Fields are listed explicitly rather than spread. The previous `{ ...i }`
 * carried `id` and the four audit fields (`createdBy`, `createdDate`,
 * `lastModifiedBy`, `lastModifiedDate`) into a push that is keyed on `code` —
 * server-owned values echoed back at the server. `igrpSyncPermissions` already
 * goes out of its way to keep `id` off the wire for exactly this reason; this
 * path now holds the same line.
 */
function toMenuEntryDTO(menu: IGRPMenuItemArgs & { type: IGRPMenuTypeSyncable }): MenuEntryDTO {
  return {
    name: menu.name,
    code: menu.code,
    type: MENU_TYPE_TO_DTO[menu.type],
    position: menu.position,
    icon: menu.icon,
    status: STATUS_TO_DTO[menu.status],
    target: menu.target,
    url: menu.url,
    pageSlug: menu.pageSlug,
    parentCode: menu.parentCode,
    applicationCode: menu.applicationCode,
    roles: menu.roles,
  };
}

export interface IGRPSyncMenusArgs {
  client: AccessManagementClient;
  appCode: string;
  menus: IGRPMenuItemArgs[];
  syncEnabled: boolean;
  /**
   * Forwarded as the `syncRoles` argument of
   * `client.m2m.syncApplicationMenus`. When `true`, AM also reconciles the
   * menu↔role assignments during the push. Required (no default) so a caller
   * that forgets to thread it through fails compilation rather than silently
   * changing behavior — the default lives at the config boundary
   * (`IGRP_SYNC_ON_CODE_MENU_ROLES`).
   */
  syncRoles: boolean;
}

export async function igrpSyncMenus({
  client,
  appCode,
  menus,
  syncEnabled,
  syncRoles,
}: IGRPSyncMenusArgs) {
  if (!syncEnabled) {
    console.info('On-code menus sync skipped (IGRP_SYNC_ON_CODE_MENUS=false).');
    return;
  }

  const syncable = menus.filter(isSyncable);

  // Framework-only entries (today: SYSTEM_PAGE) are dropped rather than
  // pushed. Loud, because a template author who wrote one in IGRP_DEFAULT_MENU
  // expects to see it in AM and otherwise has nothing to go on.
  const skipped = menus.length - syncable.length;
  if (skipped > 0) {
    const codes = menus.filter((m) => !isSyncable(m)).map((m) => `${m.code} (${m.type})`);
    console.warn(
      `On-code menus: ${skipped} entr${skipped === 1 ? 'y' : 'ies'} not pushed — Access Management ` +
        `does not accept these menu types: ${codes.join(', ')}.`,
    );
  }

  if (syncable.length === 0) {
    console.info('On-code menus sync skipped (no syncable entries).');
    return;
  }

  await client.m2m.syncApplicationMenus(appCode, syncable.map(toMenuEntryDTO), syncRoles);

  console.info(`On-code menus synchronized successfully (syncRoles=${syncRoles}).`);
}
