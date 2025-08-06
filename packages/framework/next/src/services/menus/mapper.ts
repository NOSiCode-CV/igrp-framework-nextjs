import type { MenuEntryDTO } from '@igrp/platform-access-management-client-ts';
import type {
  IGRPItemStatus,
  IGRPItemTarget,
  IGRPMenuItemArgs,
  IGRPMenuType,
} from '@igrp/framework-next-types';

const mapMenu = (menu: MenuEntryDTO): IGRPMenuItemArgs => ({
  id: menu.id as number,
  name: menu.name,
  type: menu.type as IGRPMenuType,
  position: menu.position || null,
  icon: menu.icon || undefined,
  status: menu.status as IGRPItemStatus,
  target: menu.target as IGRPItemTarget,
  url: menu.url || null,
  parentName: menu.parentName,
  applicationCode: menu.applicationCode,
  permissions: menu.permissions,
});

export const mapperMenus = (menus: any): IGRPMenuItemArgs[] => {
  if (!menus.data) return [];
  return menus.data.map(mapMenu);
};
