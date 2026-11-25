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
  /** @deprecated No effect: nothing reads it. Pass `defaultSidebarOpen` to `IGRPLayoutFull` instead. */
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
  /** Show the Profile entry of the sidebar user menu. Defaults to `true`. */
  showProfile?: boolean;
  /** Show the Settings entry of the sidebar user menu. Defaults to `true`. */
  showSettings?: boolean;
  /** Profile entry of the sidebar user menu. Defaults to `/profile`. */
  profileUrl?: string;
  /** Notifications entry of the sidebar user menu. Defaults to `/notifications`. */
  notificationsUrl?: string;
  /** Settings entry of the sidebar user menu. Defaults to `/settings`. */
  settingsUrl?: string;
  /** Sign-out entry of the sidebar user menu. Defaults to `/logout`. */
  logoutUrl?: string;
}
