import type { IGRPApplicationArgs, IGRPMenuItemArgs, IGRPUserArgs } from './access-management.js';
import type { IGRPHeaderDataArgs } from './header.js';
import type { IGRPSidebarDataArgs } from './sidebar.js';

/**
 * The app's layout data source for the framework header and sidebar.
 *
 * **Despite the name, this is not preview-only.** Both functions are invoked on
 * every render in *both* modes — `SidebarDataProvider` calls `getSidebarData()`
 * before it branches on `previewMode` at all, and `HeaderDataProvider` calls
 * `getHeaderData()` in each branch. In production the framework overrides only
 * the fields it can fetch from Access Management and keeps everything else
 * exactly as returned here:
 *
 * | Returned by            | Overridden in production                              | Live in production                                                                               |
 * | ---------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
 * | `getHeaderData()`      | `user`                                                | every `show*` flag, `settingsUrl`, `settingsIcon`, `notificationsUrl`, `userProfileUrl`, `logoutUrl`, `headerLogo` |
 * | `getSidebarData()`     | `user`, `menuItems`, `apps`, `appCode`                  | `showAppSwitcher`, `appCenterUrl`, `showMenuSearch`, `showNotifications`, the four `*Url` fields |
 *
 * (`showIGRPSidebarTrigger` is honoured only when the layout renders a sidebar.)
 *
 * The three optional methods replace the framework's own source for one piece
 * of data, in both modes. When one is supplied the providers call it and do not
 * branch on `previewMode` for that data:
 *
 * | Method              | Replaces in production         | Replaces in preview                    |
 * | ------------------- | ------------------------------ | -------------------------------------- |
 * | `getMenus(appCode)` | the Access Management menus    | `getSidebarData().menuItems`           |
 * | `getUser()`         | the Access Management user     | `getHeaderData().user` / `getSidebarData().user` |
 * | `getApps()`         | the Access Management apps     | `getSidebarData().apps`                |
 *
 * `getMenus` also feeds the header command palette (`igrpGetLayoutMenus`).
 * A typical preview source supplies all three with mock data, and a live source
 * supplies none.
 *
 * So returning a stub from these "because it's only mock data" silently drops
 * the entire header and sidebar configuration in production — no error, no type
 * complaint, just chrome that renders nothing. Configure them unconditionally
 * and let `previewMode` decide only what the *fetched* values stand in for,
 * which is what `templates/demo-v1` does.
 */
export interface IGRPLayoutDataSource {
  getHeaderData: () => Promise<IGRPHeaderDataArgs>;
  getSidebarData: () => Promise<IGRPSidebarDataArgs>;
  /** Menus for `appCode`, instead of Access Management / `menuItems`. */
  getMenus?: (appCode: string) => Promise<IGRPMenuItemArgs[]>;
  /** The signed-in user, instead of Access Management / the data's `user`. */
  getUser?: () => Promise<IGRPUserArgs | null | undefined>;
  /** The user's applications, instead of Access Management / the data's `apps`. */
  getApps?: () => Promise<IGRPApplicationArgs[]>;
}

export type IGRPToasterPosition =
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export type IGRPPackageJson = {
  name: string;
  version?: string;
  description?: string;
  displayName?: string;
  slug?: string;
};
