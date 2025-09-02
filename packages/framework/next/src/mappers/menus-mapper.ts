import type { ApiResponse, MenuEntryDTO } from '@igrp/platform-access-management-client-ts';
import type {
  IGRPStatus,
  IGRPMenuItemArgs,
  IGRPMenuType,
  IGRPTargetType,
} from '@igrp/framework-next-types';

const mapMenu = (menu: MenuEntryDTO): IGRPMenuItemArgs => ({
  id: menu.id as number,
  code: menu.code,
  name: menu.name,
  type: menu.type as IGRPMenuType,
  position: menu.position,
  icon: menu.icon || undefined,
  status: menu.status as IGRPStatus,
  target: menu.target as IGRPTargetType,
  url: menu.url,
  pageSlug: menu.pageSlug,
  applicationCode: menu.applicationCode,
  permissions: menu.permissions,
  parentCode: menu.parentCode,
});

export const mapperMenus = (menus: ApiResponse<MenuEntryDTO[]>): IGRPMenuItemArgs[] => {
  if (!menus.data) return [];
  return menus.data.map(mapMenu);
};

export const mapperMenu = (menus: ApiResponse<MenuEntryDTO>): IGRPMenuItemArgs => {
  if (!menus.data) return {} as IGRPMenuItemArgs;
  return mapMenu(menus.data);
};
