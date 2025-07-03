import type { Session } from 'next-auth';

export type IGRPConfig = {
  appCode: string;
  previewMode: boolean;
  layoutMockData?: {
    getHeaderData: () => Promise<HeaderData>;
    getSidebarData: () => Promise<SidebarData>;
  };
  font: string;
  showSidebar?: boolean;
  showHeader?: boolean;
  defaultOpen?: boolean;
  showLanguageSelector?: boolean;
  layout: {
    locale: string,
    session: Session | null,
    activeThemeValue?: string,
    isScaled?: boolean,
    messages?: Record<string, string>,
  }
}

export type IGRPConfigClient = () => Promise<IGRPConfig>;

export type IGRPLayoutConfig = {
  locale: string,
  session: Session | null,
  activeThemeValue?: string,
  isScaled?: boolean,
  messages?: Record<string, string>,
}


export interface MenuItem {  
  id: number;
  name: string;
  type: 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE';
  position: number;
  icon: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  target: 'INTERNAL' | 'EXTERNAL';
  url: string | null;
  parentId: number | null;
  applicationId: number;
  resourceId: number | null;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}


export interface User {
  id: string;
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

export interface HeaderData {
  user: User;
  notifications: Notification[];
  quickActions: QuickAction[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  href: string;
}

export interface SidebarData {
  menuItems: MenuItem[];
  collapsed: boolean;
  user: User;
  footerItems: MenuItem[];
}

export interface IGRPMockDataAsync {
  getHeaderData: () => Promise<HeaderData>;
  getSidebarData: () => Promise<SidebarData>;
}

export type IGRPMockData = {
  headerData: HeaderData;
  sidebarData: SidebarData;
};
