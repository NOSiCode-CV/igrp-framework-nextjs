import { igrpBuildConfig } from "@igrp/framework-next";
import type {
  IGRPConfigArgs,
  IGRPLayoutConfigArgs,
  IGRPPackageJson,
} from "@igrp/framework-next-types";
import pkg from "../package.json"
import path from "path";
import fs from "fs";
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

  const appInfo: IGRPPackageJson = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  };

  // Extract appRoutesMatch from routes file
  let appRoutesContent: string | undefined;
  let appRoutesMatch: string | undefined;
  try {
    const defaultRoutesPath = path.join(process.cwd(), ".next/types/routes.d.ts");    
    const content = fs.readFileSync(defaultRoutesPath, "utf8");
    
    const routesMatch = content.match(/type AppRoutes\s*=\s*([\s\S]*?)\n(?=type|interface)/);
    if (routesMatch && routesMatch[1]) {
      appRoutesContent = routesMatch[1];
    }
  } catch (error) {    
    console.warn("Could not read routes file:", error);
  }

  return igrpBuildConfig({
    appCode: process.env.IGRP_APP_CODE || "",
    previewMode: isPreviewMode(),
    syncAccess: process.env.IGRP_SYNC_ACCESS === "true",
    appInformation: appInfo,
    layoutMockData: {
      getHeaderData: async () => ({
        user: user,
        showBreadcrumb: true,
        showSearch: true,
        showNotifications: true,
        showUser: true,
        showThemeSwitcher: true,
        showIGRPSidebarTrigger: true,
        showIGRPHeaderTitle: true,
        showIGRPHeaderLogo: true,
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
      baseUrl: process.env.IGRP_ACCESS_MANAGEMENT_API || "",
      m2mServiceId: process.env.IGRP_M2M_SERVICE_ID || "",
      m2mToken: process.env.IGRP_M2M_TOKEN || "",
      syncOnCodeMenus: process.env.IGRP_SYNC_ON_CODE_MENUS === "true",      
      appRoutesMatch,
      appRoutesContent,
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
