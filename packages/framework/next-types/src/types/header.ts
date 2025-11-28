import type { IGRPUserArgs } from './access-management';

export interface IGRPHeaderDataArgs {
  user: IGRPUserArgs;
  notifications?: IGRPNotificationArgs[];
  showBreadcrumb: boolean;
  showSearch: boolean;
  showNotifications: boolean;
  showThemeSwitcher: boolean;
  showUser: boolean;
  showIGRPSidebarTrigger: boolean;
  showIGRPHeaderTitle: boolean;
  showIGRPHeaderLogo: boolean;
  headerLogo?: string;
}

export interface IGRPNotificationArgs {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
}
