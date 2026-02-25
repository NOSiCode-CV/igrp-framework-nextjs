import { Session } from '@igrp/framework-next-auth';
import type { SessionProviderProps } from '@igrp/framework-next-auth/client';

import { IGRPHeaderDataArgs } from './header';
import { IGRPSidebarDataArgs } from './sidebar';
import { IGRPPackageJson, IGRPToasterPosition } from './globals';

export type IGRPConfigArgs = {
  appCode: string;
  previewMode: boolean;
  syncAccess: boolean;
  appInformation: IGRPPackageJson;
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
    m2mServiceId: string;
    m2mToken: string;
    syncOnCodeMenus: boolean;
    appRoutes?: string[];
    paramMapBody?: string;
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
  sessionArgs?: Partial<SessionProviderProps>;
};

export type IGRPConfigClient = () => Promise<IGRPConfigArgs>;

export type IGRPLayoutConfigArgs = {
  session: Session | null;
  activeThemeValue?: string;
  isScaled?: boolean;
};
