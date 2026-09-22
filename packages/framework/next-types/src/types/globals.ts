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
 * | `getHeaderData()`      | `user`, `showIGRPSidebarTrigger`                       | every other `show*` flag, `settingsUrl`, `settingsIcon`, `notificationsUrl`, `userProfileUrl`, `headerLogo` |
 * | `getSidebarData()`     | `user`, `menuItems`, `apps`, `appCode`, `showPreviewMode` | `defaultOpen`, `showAppSwitcher`, `appCenterUrl`, `showMenuSearch`, `showNotifications`          |
 *
 * So returning a stub from these "because it's only mock data" silently drops
 * the entire header and sidebar configuration in production — no error, no type
 * complaint, just chrome that renders nothing. Configure them unconditionally
 * and let `previewMode` decide only what the *fetched* values stand in for,
 * which is what `templates/demo-v1` does.
 *
 * Named {@link IGRPLayoutDataSource} as of this release. `IGRPMockDataAsync`
 * remains an alias of it for one release.
 */
export interface IGRPLayoutDataSource {
  getHeaderData: () => Promise<IGRPHeaderDataArgs>;
  getSidebarData: () => Promise<IGRPSidebarDataArgs>;
}

/**
 * @deprecated Renamed to {@link IGRPLayoutDataSource}. Identical type — the old
 * name said "mock", which is what made app authors gate the factory behind
 * `previewMode` and silently lose their entire production header and sidebar
 * configuration. Kept as an alias for one release.
 */
export type IGRPMockDataAsync = IGRPLayoutDataSource;

/**
 * @deprecated Synchronous twin of {@link IGRPLayoutDataSource} with no consumer
 * anywhere — `IGRPConfigArgs.layoutMockData` is the async form. Kept for one
 * release; use `IGRPMockDataAsync`.
 */
export type IGRPMockData = {
  headerData: IGRPHeaderDataArgs;
  sidebarData: IGRPSidebarDataArgs;
};

export type IGRPToasterPosition =
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export type IGRPPackageJson = {
  name: string;
  version?: string;
  description?: string;
  displayName?: string;
  slug?: string;
};
