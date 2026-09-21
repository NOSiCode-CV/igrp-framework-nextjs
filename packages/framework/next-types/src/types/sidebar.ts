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
  /**
   * Applications for the app switcher. Optional and defaults to empty — the
   * switcher is gated by the optional `showAppSwitcher`, so requiring this
   * only forced every consumer to pass `apps: []` to keep the feature off.
   */
  apps?: IGRPApplicationArgs[];
  appCode?: string;
  showPreviewMode?: boolean;
  appCenterUrl?: string;
  showMenuSearch?: boolean;
  showNotifications?: boolean;
}
