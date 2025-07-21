import { IGRPHeaderDataArgs } from './header';
import { IGRPSidebarDataArgs } from './sidebar';

export interface IGRPMockDataAsync {
  getHeaderData: () => Promise<IGRPHeaderDataArgs>;
  getSidebarData: () => Promise<IGRPSidebarDataArgs>;
}

export type IGRPMockData = {
  headerData: IGRPHeaderDataArgs;
  sidebarData: IGRPSidebarDataArgs;
};

export type IGRPToasterPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center';
