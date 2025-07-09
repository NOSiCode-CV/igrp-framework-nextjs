import type { IGRPUserArgs } from "./igrp";

export interface IGRPHeaderDataArgs {
  user: IGRPUserArgs;
  notifications?: IGRPNotificationArgs[];
  quickActions?: IGRPQuickActionArgs[];
  showBreadcrumb?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showThemeSwitcher?: boolean;
  showLanguageSelector?: boolean;
  showUser?: boolean;
}

export interface IGRPNotificationArgs {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
}

export interface IGRPQuickActionArgs {
  id: string;
  title: string;
  icon: string;
  href: string;
}