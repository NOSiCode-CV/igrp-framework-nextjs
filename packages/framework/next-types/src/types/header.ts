import { IGRPUserArgs } from "./igrp";

export interface IGRPHeaderDataArgs {
  user: IGRPUserArgs;
  notifications?: IGRPNotificationArgs[];
  quickActions?: IGRPQuickActionArgs[];
  showSearch?: boolean;
  showBreadcrumb?: boolean;
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