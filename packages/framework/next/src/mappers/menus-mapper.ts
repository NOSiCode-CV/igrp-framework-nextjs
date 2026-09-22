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
