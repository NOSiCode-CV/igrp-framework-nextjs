import { useMockApps } from '@/temp/applications/use-mock-apps';
import { useMockMenus } from '@/temp/menus/use-mock-menus';
import { useMockMenusFooter } from '@/temp/menus/use-mock-menus-footer';
import { useMockUser } from '@/temp/users/use-mock-user';
import { IGRPMockDataAsync } from '@igrp/framework-next';

export const igrpMockDataProvider: IGRPMockDataAsync = {
  getHeaderData: async () => ({
    user: useMockUser().mockUser,
    showBreadcrumb: true,
    showSearch: true,
  }),
  getSidebarData: async () => ({
    menuItems: useMockMenus().mockMenus,
    footerItems: useMockMenusFooter().mockMenusFooter,
    user: useMockUser().mockUser,
    defaultOpen: true,
    showAppSwitcher: true,
    apps: useMockApps().mockApps
  })
};