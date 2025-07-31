import { buildConfig } from '@igrp/framework-next';
import { IGRPLayoutConfigArgs } from '@igrp/framework-next-types';
import { fontVariables } from '@/lib/fonts';
import { getMockApps } from '@/temp/applications/use-mock-apps';
import { getMockMenus } from '@/temp/menus/use-mock-menus';
import { getMockMenusFooter } from '@/temp/menus/use-mock-menus-footer';
import { getMockUser } from '@/temp/users/use-mock-user';

export function createConfig(config: IGRPLayoutConfigArgs) {
  const user = getMockUser().mockUser;
  const menu = getMockMenus().mockMenus;
  const footerMwnu = getMockMenusFooter().mockMenusFooter;
  const apps = getMockApps().mockApps;
  const previewModeEnv = process.env.IGRP_PREVIEW_MODE;

  return buildConfig({
    appCode: process.env.IGRP_APP_CODE || '',
    previewMode: previewModeEnv === undefined || previewModeEnv.trim().toLowerCase() === 'true',
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
        footerItems: footerMwnu,
        user: user,
        defaultOpen: true,
        showAppSwitcher: true,
        apps: apps,
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
    toasterConfig: {
      showToaster: true,
      position: 'bottom-right',
      richColors: true,      
    }
  });
}
