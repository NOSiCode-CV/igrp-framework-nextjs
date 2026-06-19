import type { IGRPApplicationArgs, IGRPMenuItemArgs, IGRPUserArgs } from './access-management';

export interface IGRPSidebarDataArgs {
  menuItems: IGRPMenuItemArgs[];
  defaultOpen?: boolean;
  user?: IGRPUserArgs;
  /**
   * @deprecated this property will be removed in the next major release
   */
  footerItems?: IGRPMenuItemArgs[];
  showAppSwitcher?: boolean;
  apps: IGRPApplicationArgs[];
  appCode?: string;
  showPreviewMode?: boolean;
  appCenterUrl?: string;
  showMenuSearch?: boolean;
  showNotifications?: boolean;
}
