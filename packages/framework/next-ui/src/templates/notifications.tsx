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

interface IGRPTemplateNotificationsProps {
  notifications: IGRPNotificationArgs[];
  notificationsUrl?: string;
  /** Called when the user clicks "Mark all as read". Consumer is responsible for updating the notifications array. */
  onMarkAllRead?: () => void;
  /** Locale used to format notification timestamps. Defaults to `pt-PT`. */
  locale?: string;
}

function IGRPTemplateNotifications({
  notifications,
  notificationsUrl,
  onMarkAllRead,
  locale = 'pt-PT',
}: IGRPTemplateNotificationsProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleUrl = () => {
    return notificationsUrl ? notificationsUrl : '/notifications';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-6 relative">
          <IGRPIcon iconName="Bell" strokeWidth={2} />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-0.5 h-3.5 w-3.5 flex text-[10px] py-0 px-0"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
          <span className={cn('sr-only')}>Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-80">
        <DropdownMenuLabel className={cn('flex items-center justify-between')}>
          <span>Notifications</span>
          {unreadCount > 0 && onMarkAllRead && (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="h-auto text-xs">
              Mark all as read
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
                  {formatTimestamp(notification.timestamp, locale)}
                </time>
              </DropdownMenuItem>
            ))
          ) : (
            <div className={cn('py-4 px-2 text-center text-muted-foreground')}>
              Sem notificações
            </div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={cn('justify-center')} asChild>
          <Link href={handleUrl()}>Todas as notificações</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { IGRPTemplateNotifications, type IGRPTemplateNotificationsProps };
