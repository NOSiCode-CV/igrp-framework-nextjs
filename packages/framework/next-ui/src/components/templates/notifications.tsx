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

interface IGRPTemplateNotificationsProps {
  notifications: IGRPNotificationArgs[];
  notificationsUrl?: string;
  /** Called when the user clicks "Mark all as read". Consumer is responsible for updating the notifications array. */
  onMarkAllRead?: () => void;
}

function IGRPTemplateNotifications({
  notifications,
  notificationsUrl,
  onMarkAllRead,
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
                <div className={cn('text-xs text-muted-foreground mt-1')}>
                  {notification.timestamp.toLocaleString()}
                </div>
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
