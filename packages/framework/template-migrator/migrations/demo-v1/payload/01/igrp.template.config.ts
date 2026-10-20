import { igrpBuildConfig } from "@igrp/framework-next";
import type { IGRPConfigArgs, IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { fontVariables } from "@/lib/fonts";
import { getMockApps } from "@/temp/applications/use-mock-apps";
import { getMockMenus } from "@/temp/menus/use-mock-menus";
import { getMockUser } from "@/temp/users/use-mock-user";

export function createConfig(config: IGRPLayoutConfigArgs): Promise<IGRPConfigArgs> {
  const user = getMockUser().mockUser;
  const menu = getMockMenus().mockMenus;
  const apps = getMockApps().mockApps;

  return igrpBuildConfig({
    appCode: process.env.IGRP_APP_CODE || "",
    previewMode: (() => {
      const rawValue = process.env.IGRP_PREVIEW_MODE;
      const previewModeValue = rawValue?.trim()?.replace(/^["']|["']$/g, "")?.toLowerCase();
      return previewModeValue === "true";
    })(),
    layoutMockData: {
      getHeaderData: async () => ({ user, userProfileUrl: process.env.NEXT_PUBLIC_IGRP_PROFILE_URL || "", notificationsUrl: process.env.NEXT_PUBLIC_IGRP_NOTIFICATION_URL || "", showBreadcrumb: true, showSearch: true, showNotifications: true, showUser: true, showThemeSwitcher: true, showIGRPSidebarTrigger: true, showIGRPHeaderTitle: true, showIGRPHeaderLogo: true }),
      getSidebarData: async () => ({ menuItems: menu, user, defaultOpen: true, showAppSwitcher: true, apps, appCenterUrl: process.env.NEXT_IGRP_APP_CENTER_URL || "" }),
    },
    font: fontVariables,
    showSidebar: true,
    showHeader: true,
    layout: { ...config },
    toasterConfig: { showToaster: true, position: "bottom-right", richColors: true, closeButton: true },
    showSettings: true,
    sessionArgs: (() => {
      const rawValue = process.env.IGRP_PREVIEW_MODE;
      const previewModeValue = rawValue?.trim()?.replace(/^["']|["']$/g, "")?.toLowerCase();
      const isPreviewMode = previewModeValue === "true";
      if (isPreviewMode) {
        return { refetchInterval: 0, refetchOnWindowFocus: false, basePath: "/api/auth" };
      }
      return { refetchInterval: 5 * 60, refetchOnWindowFocus: true, basePath: "/api/auth" };
    })(),
  });
}
