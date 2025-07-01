export interface IGRPConfig {
  appCode: string;
  previewMode: boolean;
  mockDataProvider?: {
    getHeaderData: () => Promise<HeaderData>;
    getSidebarData: () => Promise<SidebarData>;
  };
}

export type IGRPConfigClient = () => Promise<IGRPConfig>;

export interface MenuItem {
  id: string;
  title: string;
  href?: string;
  icon?: string;
  children?: MenuItem[];
  isActive?: boolean;
  permissions?: string[];
}

export interface User {
  id: string;
  name: string;
  fullname: string;
  email: string;
  username: string;
  image?: string;
  role: string;
  permissions: string[];
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

export interface MockDataProvider {
  getHeaderData: () => Promise<HeaderData>;
  getSidebarData: () => Promise<SidebarData>;
} 