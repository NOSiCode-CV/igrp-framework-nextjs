import type { IGRPUserArgs } from './igrp';

export interface IGRPHeaderDataArgs {
  user?: IGRPUserArgs;
  notifications?: IGRPNotificationArgs[];
  showBreadcrumb: boolean;
  showSearch: boolean;
  showNotifications: boolean;
  showThemeSwitcher: boolean;
  showUser: boolean;
}

export interface IGRPNotificationArgs {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
}
