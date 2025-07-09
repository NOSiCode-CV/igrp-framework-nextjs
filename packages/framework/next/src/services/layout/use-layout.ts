import type { IGRPHeaderDataArgs, IGRPSidebarDataArgs } from "../../types";
import { fetchCurrentUser } from "../users/use-user";
import { fetchMenus } from "../menus/use-menus";

export async function fetchLayoutData(
  getHeaderData: () => Promise<IGRPHeaderDataArgs>,
  getSidebarData: () => Promise<IGRPSidebarDataArgs>,
  previewMode: boolean,
  appCode: number
) {

  let headerData = await getHeaderData();
  let sidebarData = await getSidebarData();

  if (!previewMode) { 
    const menuItems = await fetchMenus(appCode);
    const user = await fetchCurrentUser();

    headerData = {
      ...headerData,
      user
    }

    sidebarData = {
      ...sidebarData,
      user,
      menuItems
    }
  }

  return {
    headerData,
    sidebarData
  }
}