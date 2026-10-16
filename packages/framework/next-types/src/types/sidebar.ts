import type { IGRPApplicationArgs, IGRPMenuItemArgs, IGRPUserArgs } from './access-management.js';

export interface IGRPSidebarDataArgs {
  /**
   * Menu tree for preview / auth-bypass mode.
   *
   * Optional and defaults to empty — it is **discarded whenever auth is real**,
   * because `SidebarDataProvider` replaces it with `fetchMenus(appCode)`.
   * Requiring it only forced every production app to author an array that is
   * thrown away. `IGRPTemplateSidebar` supplies the `[]` default.
   */
  menuItems?: IGRPMenuItemArgs[];
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
  appCenterUrl?: string;
  showMenuSearch?: boolean;
  showNotifications?: boolean;
}
