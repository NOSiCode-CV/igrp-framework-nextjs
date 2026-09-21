import type { IGRPHeaderDataArgs } from './header';
import type { IGRPSidebarDataArgs } from './sidebar';

export interface IGRPMockDataAsync {
  getHeaderData: () => Promise<IGRPHeaderDataArgs>;
  getSidebarData: () => Promise<IGRPSidebarDataArgs>;
}

/**
 * @deprecated Synchronous twin of {@link IGRPMockDataAsync} with no consumer
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
