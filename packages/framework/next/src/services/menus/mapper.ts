import type { IGRPItemStatus, IGRPItemTarget, IGRPMenuItemArgs, IGRPMenuType } from "../../types";
import type { MenuEntryDTO } from "@igrp/platform-access-management-client-ts";

const mapMenu = (menu: MenuEntryDTO): IGRPMenuItemArgs => ({
  id: menu.id as number,
  name: menu.name,
  type: menu.type as IGRPMenuType,
  position: menu.position || null,
  icon: menu.icon || undefined,
  status: menu.status as IGRPItemStatus,
  target: menu.target as IGRPItemTarget,
  url: menu.url || null,
  parentId: menu.parentId || null,
  applicationId: menu.applicationId as number,
  resourceId: menu.resourceId || null
});

export const mapperMenus = (menus: any): IGRPMenuItemArgs[] => {
  if (!menus.data) return [];
  return menus.data.map(mapMenu);
}