import type { Session as DefaultSession, User as NextAuthUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';
import { IGRPHeaderDataArgs } from './header';
import { IGRPSidebarDataArgs } from './sidebar';
import { IGRPToasterPosition } from './globals';

export interface IGRPApplicationArgs {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: IGRPItemStatus;
  type: IGRPItemTarget;
  owner?: string;
  picture?: string;
  url?: string | null;
  slug?: string;
}

export interface IGRPUserArgs {
  id: number;
  igrpUsername: string;
  username: string;
  fullname?: string | null;
  name: string;
  email: string;
  roles?: string[];
  departments?: string[];
  apps?: string[];
  status: 'ACTIVE' | 'INACTIVE';
  signature?: string | null;
  image?: string | null;
  picture?: string | null;
}

export type IGRPMenuType = 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE' | 'GROUP' | 'SYSTEM_PAGE';

export type IGRPItemStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export type IGRPItemTarget = 'INTERNAL' | 'EXTERNAL';

export type IGRPMenuItemArgs = {
  id: number;
  name: string;
  type: IGRPMenuType;
  position: number | null;
  icon: string | undefined;
  status: IGRPItemStatus;
  target: string;
  url: string | null;
  pageSlug?: string;
  code: string;
  applicationCode?: string;
  permissions: string[];
};

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
