import type { Session as DefaultSession, User as NextAuthUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';
import { IGRPHeaderDataArgs } from './header';
import { IGRPSidebarDataArgs } from './sidebar';
import { IGRPToasterPosition } from './globals';

export interface ExtendedSession extends DefaultSession {
  accessToken?: string;
  idToken?: string;
  expiresAt?: number;
  error?: string;
  user?: {
    id?: string;
  } & DefaultSession['user'];
}

export interface ExtendedJWT extends DefaultJWT {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  error?: 'RefreshAccessTokenError' | string;
  user?: {
    id?: string;
  } & NextAuthUser;
}

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
};

export type IGRPConfigClient = () => Promise<IGRPConfigArgs>;

export type IGRPLayoutConfigArgs = {
  session: ExtendedSession | null;
  activeThemeValue?: string;
  isScaled?: boolean;
};