'use client';

import {
  cn,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
  igrpFormatMessage,
  useIGRPLocale,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPNotificationArgs } from '@igrp/framework-next-types';
import Link from 'next/link';

/**
 * Renders `IGRPNotificationArgs['timestamp']`, which is an ISO 8601 string in
 * anything sourced from an API and a `Date` in hand-built mock data.
 *
 * Two things this must not do: call `.toLocaleString()` on a value that is a
 * string at runtime (a `TypeError`, and exactly what the previous version did
 * whenever notifications came from JSON), and format with the ambient locale
 * and time zone (the server's differ from the browser's, so React reports a
 * hydration mismatch on every notification). Hence the explicit `locale` and
 * the `suppressHydrationWarning` on the rendered node: the server's render is
 * a placeholder, the client's is authoritative.
 *
 * An unparseable value renders as empty rather than `Invalid Date`.
 */
function formatTimestamp(value: string | Date, locale: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(locale);
}

/** ISO string for the `<time dateTime>` attribute, or `undefined` if unparseable. */
function toIsoString(value: string | Date): string | undefined {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** pt-PT defaults for the notifications dropdown. Override individually. */
export interface IGRPNotificationsLabels {
  /** Dropdown heading and the trigger's screen-reader name. */
  title: string;
  /** Action that clears the unread state. */
  markAllRead: string;
  /** Empty state. */
  empty: string;
  /** Footer link to the full notifications page. */
  viewAll: string;
  /** Unread-count announcement. `{count}` is substituted. */
  unreadCount: string;
}

export const IGRP_NOTIFICATIONS_LABELS_PT_PT: IGRPNotificationsLabels = {
  title: 'Notificações',
  markAllRead: 'Marcar todas como lidas',
  empty: 'Sem notificações',
  viewAll: 'Todas as notificações',
  unreadCount: '{count} por ler',
};

interface IGRPTemplateNotificationsProps {
  notifications: IGRPNotificationArgs[];
  notificationsUrl?: string;
  /** Called when the user clicks "mark all as read". Consumer is responsible for updating the notifications array. */
  onMarkAllRead?: () => void;
  /**
   * Locale used to format notification timestamps. Defaults to the design
   * system's `useIGRPLocale()` (itself `pt-PT` unless an `IGRPI18nProvider`
   * says otherwise) — never the ambient runtime locale, which resolves to the
   * server's under SSR and the browser's on the client and hydrates mismatched.
   */
  locale?: string;
  /** Partial override of the pt-PT strings. Missing keys keep their default. */
  labels?: Partial<IGRPNotificationsLabels>;
}

function IGRPTemplateNotifications({
  notifications,
  notificationsUrl = '/notifications',
  onMarkAllRead,
  locale,
  labels: labelOverrides,
}: IGRPTemplateNotificationsProps) {
  const providerLocale = useIGRPLocale();
  const resolvedLocale = locale ?? providerLocale;
  const labels = labelOverrides
    ? { ...IGRP_NOTIFICATIONS_LABELS_PT_PT, ...labelOverrides }
    : IGRP_NOTIFICATIONS_LABELS_PT_PT;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-6 relative">
          <IGRPIcon iconName="Bell" strokeWidth={2} />
          {unreadCount > 0 && (
            // The badge is a fixed 14px circle, so a three-digit count would
            // overflow it. Cap the glyph; the exact figure stays in the
            // screen-reader text below.
            <Badge
              className="absolute -top-1 -right-0.5 h-3.5 min-w-3.5 w-auto flex text-[10px] py-0 px-0.5"
              variant="destructive"
              aria-hidden
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className={cn('sr-only')}>
            {labels.title}
            {unreadCount > 0
              ? `, ${igrpFormatMessage(labels.unreadCount, { count: unreadCount })}`
              : ''}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-80">
        <DropdownMenuLabel className={cn('flex items-center justify-between')}>
          <span>{labels.title}</span>
          {unreadCount > 0 && onMarkAllRead && (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="h-auto text-xs">
              {labels.markAllRead}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className={cn('max-h-72 overflow-auto')}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn('flex flex-col items-start p-4')}
              >
                <div className={cn('font-medium')}>{notification.title}</div>
                <div className={cn('text-sm text-muted-foreground')}>{notification.message}</div>
                <time
                  dateTime={toIsoString(notification.timestamp)}
                  suppressHydrationWarning
                  className={cn('text-xs text-muted-foreground mt-1')}
                >
                  {formatTimestamp(notification.timestamp, resolvedLocale)}
                </time>
              </DropdownMenuItem>
            ))
          ) : (
            <div className={cn('py-4 px-2 text-center text-muted-foreground')}>{labels.empty}</div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={cn('justify-center')} asChild>
          <Link href={notificationsUrl}>{labels.viewAll}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { IGRPTemplateNotifications, type IGRPTemplateNotificationsProps };
