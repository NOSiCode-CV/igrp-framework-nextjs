import type { IGRPHeaderDataArgs } from './header';
import type { IGRPSidebarDataArgs } from './sidebar';

export interface IGRPMockDataAsync {
  getHeaderData: () => Promise<IGRPHeaderDataArgs>;
  getSidebarData: () => Promise<IGRPSidebarDataArgs>;
}

export type IGRPMockData = {
  headerData: IGRPHeaderDataArgs;
  sidebarData: IGRPSidebarDataArgs;
};
