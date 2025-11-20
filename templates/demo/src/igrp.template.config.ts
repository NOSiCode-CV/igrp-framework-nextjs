import { igrpBuildConfig } from "@igrp/framework-next";
import type {
  IGRPConfigArgs,
  IGRPLayoutConfigArgs,
} from "@igrp/framework-next-types";
import { fontVariables } from "@/lib/fonts";
import { isPreviewMode } from "@/lib/utils";
import { getMockApps } from "@/temp/applications/use-mock-apps";
import { getMockMenus } from "@/temp/menus/use-mock-menus";
import { getMockMenusFooter } from "@/temp/menus/use-mock-menus-footer";
import { getMockUser } from "@/temp/users/use-mock-user";

export function createConfig(
  config: IGRPLayoutConfigArgs,
): Promise<IGRPConfigArgs> {
  const user = getMockUser().mockUser;
  const menu = getMockMenus().mockMenus;
  const footerMenu = getMockMenusFooter().mockMenusFooter;
  const apps = getMockApps().mockApps;

  function basePath(bp: string) {
    if (!bp) return "/api/auth";

    // Normalize base path: ensure it starts with / and doesn't end with /
    const normalized = bp.startsWith("/") ? bp : `/${bp}`;
    const cleanPath = normalized.endsWith("/")
      ? normalized.slice(0, -1)
      : normalized;
    return `${cleanPath}/api/auth`;
  }

  return igrpBuildConfig({
    appCode: process.env.IGRP_APP_CODE || "",
    previewMode: isPreviewMode(),
    layoutMockData: {
      getHeaderData: async () => ({
        user: user,
        showBreadcrumb: true,
        showSearch: true,
        showNotifications: true,
        showUser: true,
        showThemeSwitcher: true,
      }),
      getSidebarData: async () => ({
        menuItems: menu,
        footerItems: footerMenu,
        user: user,
        defaultOpen: true,
        showAppSwitcher: true,
        apps: apps,
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
      baseUrl: process.env.IGRP_APP_MANAGER_API || "",
    },
    toasterConfig: {
      showToaster: true,
      position: "bottom-right",
      richColors: true,
      closeButton: true,
    },
    showSettings: true,
    sessionArgs: (() => {
      // Disable session refetching in preview mode to prevent client-side redirects
      if (isPreviewMode()) {
        return {
          refetchInterval: 0, // Disable refetching
          refetchOnWindowFocus: false, // Disable refetching on focus
          basePath: basePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
        };
      }

      return {
        refetchInterval: 5 * 60,
        refetchOnWindowFocus: true,
        basePath: basePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
      };
    })(),
  });
}
