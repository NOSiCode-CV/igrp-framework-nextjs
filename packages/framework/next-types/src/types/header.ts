import type { IGRPUserArgs } from './access-management';

/**
 * Data for the framework header bar.
 *
 * Every `show*` flag is optional and **defaults to `false`** — the header
 * renders a region only when its flag is truthy, so omitting one turns that
 * region off. They were once required, which forced every template to spell
 * out eight booleans to configure one of them; templates that already pass
 * them explicitly are unaffected.
 */
export interface IGRPHeaderDataArgs {
  user?: IGRPUserArgs;
  userProfileUrl?: string;
  /** Show the nav-user menu in the right cluster. Default `false`. */
  showUser?: boolean;

  notifications?: IGRPNotificationArgs[];
  notificationsUrl?: string;
  /** Show the notifications bell. Default `false`. */
  showNotifications?: boolean;

  /** Show breadcrumbs in the left cluster. Default `false`. */
  showBreadcrumb?: boolean;
  /** Show the command palette trigger. Default `false`. */
  showSearch?: boolean;
  /** Show the light/dark switcher. Default `false`. */
  showThemeSwitcher?: boolean;

  /** Show the sidebar collapse trigger. Default `false`. */
  showIGRPSidebarTrigger?: boolean;

  /** Show the "iGRP" wordmark. Default `false`. */
  showIGRPHeaderTitle?: boolean;
  /** Show the header logo. Default `false`. */
  showIGRPHeaderLogo?: boolean;
  headerLogo?: string;

  /** Show the settings link. Default `false`. */
  showSettings?: boolean;
  settingsUrl?: string;
  settingsIcon?: string;
}

export interface IGRPNotificationArgs {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  /**
   * When the notification was raised.
   *
   * Prefer an **ISO 8601 string** — every other timestamp in this package
   * (`createdDate`, `lastModifiedDate`, `lastAccess`) is a string, and a
   * notification list sourced from a JSON API carries strings, not `Date`s.
   * `Date` stays in the union for one release so templates building mock data
   * with `new Date()` keep compiling; the framework's renderer accepts both.
   * The `Date` member will be dropped in a later release.
   */
  timestamp: string | Date;
  isRead: boolean;
}
