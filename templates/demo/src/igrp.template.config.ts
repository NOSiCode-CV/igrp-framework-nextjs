import { cache } from "react";
import { igrpBuildConfig } from "@igrp/framework-next";
import type {
  IGRPConfigArgs,
  IGRPLayoutConfigArgs,
} from "@igrp/framework-next-types";

import { configLayout } from "@/actions/igrp/layout";
import { fontVariables } from "@/lib/fonts";
import { getPackageJson } from "@/lib/config/get-pkj";
import { getRoutes } from "@/lib/config/get-routes";
import { getSessionArgs } from "@/lib/config/get-session-args";
import { isPreviewMode } from "@/lib/utils";
import { getMockApps } from "@/temp/applications/use-mock-apps";
import { getMockMenus } from "@/temp/menus/use-mock-menus";
import { getMockUser } from "@/temp/users/use-mock-user";

/**
 * Single entry point for IGRP config creation.
 * Combines configLayout (session, theme) and createConfig (routes, mock data, API).
 * Cached per request so root and (igrp) layouts share the same config without recomputing.
 *
 * @returns Full IGRP config for the framework
 */
export const getConfig = cache(async (): Promise<IGRPConfigArgs> => {
  const layoutConfig = await configLayout();
  return createConfig(layoutConfig);
});

/**
 * Creates the IGRP framework config from layout args.
 * Aggregates routes, mock data, and API configuration.
 * Cached per request to avoid duplicate work when both root and (igrp) layouts run.
 *
 * @param config - Layout config (session, theme, scale)
 * @returns Full IGRP config for the framework
 */
export const createConfig = cache(
  async (config: IGRPLayoutConfigArgs): Promise<IGRPConfigArgs> => {
    const user = getMockUser().mockUser;
    const menu = getMockMenus().mockMenus;
    const apps = getMockApps().mockApps;

    const routes = await getRoutes();
    const appRoutes = routes?.appRoutes ?? [];
    const paramMapBody = routes?.paramMapBody ?? "";

    return igrpBuildConfig({
      appCode: process.env.IGRP_APP_CODE || "",
      previewMode: isPreviewMode(),
      syncAccess: process.env.IGRP_SYNC_ACCESS === "true",
      appInformation: getPackageJson(),
      layoutMockData: {
        getHeaderData: () =>
          Promise.resolve({
            user,
            userProfileUrl: process.env.NEXT_PUBLIC_IGRP_PROFILE_URL || "",
            notificationsUrl:
              process.env.NEXT_PUBLIC_IGRP_NOTIFICATION_URL || "",
            showBreadcrumb: true,
            showSearch: true,
            showNotifications: true,
            showUser: true,
            showThemeSwitcher: true,
            showIGRPSidebarTrigger: true,
            showIGRPHeaderTitle: true,
            showIGRPHeaderLogo: true,
          }),
        getSidebarData: () =>
          Promise.resolve({
            menuItems: menu,
            user,
            defaultOpen: true,
            showAppSwitcher: true,
            apps,
            appCenterUrl: process.env.NEXT_IGRP_APP_CENTER_URL || "",
          }),
      },
      font: fontVariables,
      showSidebar: true,
      showHeader: true,

      layout: {
        ...config,
      },
      apiManagementConfig: {
        baseUrl: process.env.IGRP_ACCESS_MANAGEMENT_API || "",
        m2mServiceId: process.env.IGRP_M2M_SERVICE_ID || "",
        m2mToken: process.env.IGRP_M2M_TOKEN || "",
        syncOnCodeMenus: process.env.IGRP_SYNC_ON_CODE_MENUS === "true",
        appRoutes,
        paramMapBody,
      },
      toasterConfig: {
        showToaster: true,
        position: "bottom-right",
        richColors: true,
        closeButton: true,
      },
      showSettings: true,
      sessionArgs: getSessionArgs(),
    });
  },
);
