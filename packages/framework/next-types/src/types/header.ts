import type { IGRPUserArgs } from './access-management';

export interface IGRPHeaderDataArgs {
  user: IGRPUserArgs;
  userProfileUrl?: string;
  showUser: boolean;

  notifications?: IGRPNotificationArgs[];
  notificationsUrl?: string;
  showNotifications: boolean;

  showBreadcrumb: boolean;
  showSearch: boolean;
  showThemeSwitcher: boolean;

  showIGRPSidebarTrigger: boolean;

  showIGRPHeaderTitle: boolean;
  showIGRPHeaderLogo: boolean;
  headerLogo?: string;

  showSettings?: boolean;
  settingsUrl?: string;
  settingsIcon?: string;
}

export interface IGRPNotificationArgs {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
}
