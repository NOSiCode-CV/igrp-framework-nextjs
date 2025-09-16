import { Session } from '@igrp/framework-next-auth';

import { IGRPHeaderDataArgs } from './header';
import { IGRPSidebarDataArgs } from './sidebar';
import { IGRPToasterPosition } from './globals';

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
  layout: IGRPLayoutConfigArgs;
  apiManagementConfig?: {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
  };
  toasterConfig: {
    showToaster: boolean;
    position?: IGRPToasterPosition;
    theme?: 'light' | 'dark' | 'system';
    richColors?: boolean;
    expand?: boolean;
    duration?: number;
    closeButton?: boolean;
  };
  loginUrl?: string;
  logoutUrl?: string;
  showSettings?: boolean;
};

export type IGRPConfigClient = () => Promise<IGRPConfigArgs>;

export type IGRPLayoutConfigArgs = {
  session: Session | null;
  activeThemeValue?: string;
  isScaled?: boolean;
};
