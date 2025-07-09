import type { Session } from 'next-auth';
import type { IGRPHeaderDataArgs } from './header';
import type { IGRPSidebarDataArgs } from './sidebar';

export type IGRPConfigArgs = {
  appCode: string;
  previewMode: boolean;
  layoutMockData: {
    getHeaderData: () => Promise<IGRPHeaderDataArgs>;
    getSidebarData: () => Promise<IGRPSidebarDataArgs>;
  };
  font?: string;
  showSidebar?: boolean;
  showHeader?: boolean;
  showLanguageSelector?: boolean;
  layout: {
    locale: string;
    session: Session | null;
    activeThemeValue?: string;
    isScaled?: boolean;
    messages?: Record<string, string>;
  };
  apiManagementConfig?: {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
  };
  appCenterUrl: string;
};

export type IGRPConfigClient = () => Promise<IGRPConfigArgs>;

export type IGRPLayoutConfigArgs = {
  locale: string;
  session: Session | null;
  activeThemeValue?: string;
  isScaled?: boolean;
  messages?: Record<string, string>;
};
