import { buildConfig } from '@igrp/framework-next';
import { IGRPLayoutConfigArgs } from '@igrp/framework-next';
import { fontVariables } from '@/lib/fonts';
import { useMockApps } from '@/temp/applications/use-mock-apps';
import { useMockMenus } from '@/temp/menus/use-mock-menus';
import { useMockMenusFooter } from '@/temp/menus/use-mock-menus-footer';
import { useMockUser } from '@/temp/users/use-mock-user';

export function createConfig(config: IGRPLayoutConfigArgs) {
  return buildConfig({
    appCode: process.env.IGRP_APP_CODE || '',
    previewMode: process.env.IGRP_PREVIEW_MODE === 'true' ? true : false,
    layoutMockData: {
      getHeaderData: async () => ({
        user: useMockUser().mockUser,
        showBreadcrumb: true,
        showSearch: true,
        showNotifications: true,
        showLanguageSelector: true,
        showUser: true,
        showThemeSwitcher: true,
      }),
      getSidebarData: async () => ({
        menuItems: useMockMenus().mockMenus,
        footerItems: useMockMenusFooter().mockMenusFooter,
        user: useMockUser().mockUser,
        defaultOpen: true,
        showAppSwitcher: true,
        apps: useMockApps().mockApps,
        appCenterUrl: process.env.IGRP_APP_CENTER_URL || '',
      }),
    },
    font: fontVariables,
    showSidebar: true,
    showHeader: true,

    layout: {
      ...config,
    },
    apiManagementConfig: {
      baseUrl: process.env.IGRP_APP_MANAGER_API || '',
    },
  });
}
