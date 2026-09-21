import type { ApiResponse, MenuEntryDTO } from '@igrp/platform-access-management-client-ts';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';

const mapMenu = (menu: MenuEntryDTO): IGRPMenuItemArgs => ({
  id: menu.id,
  code: menu.code,
  name: menu.name,
  type: menu.type,
  position: menu.position,
  icon: menu.icon || undefined,
  status: menu.status,
  target: menu.target,
  url: menu.url,
  pageSlug: menu.pageSlug,
  applicationCode: menu.applicationCode,
  roles: menu.roles,
  parentCode: menu.parentCode,
});

export const mapperMenus = (menus: ApiResponse<MenuEntryDTO[]>): IGRPMenuItemArgs[] => {
  if (!menus.data) return [];
  return menus.data.map(mapMenu);
};

/**
 * Returns `null` when the response carries no menu.
 *
 * It used to return `{} as IGRPMenuItemArgs` — an object with none of the
 * required fields, typed as if it had all of them, so the first caller to read
 * `.code` off an empty response would have got `undefined` with no type error
 * anywhere. `null` makes the empty case something the caller has to handle.
 */
export const mapperMenu = (menus: ApiResponse<MenuEntryDTO>): IGRPMenuItemArgs | null => {
  if (!menus.data) return null;
  return mapMenu(menus.data);
};
