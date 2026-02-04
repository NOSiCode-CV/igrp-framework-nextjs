'use client';

import { useState } from 'react';
import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuGroupPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuLabelPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPNotificationArgs } from '@igrp/framework-next-types';
import Link from 'next/link';
import { getLocationOriginURL } from '../../lib/utils';

function IGRPTemplateNotifications({
  notifications,
  notificationsUrl,
}: {
  notifications: IGRPNotificationArgs[];
  notificationsUrl?: string;
}) {
  const [notificationCount, setNotificationCount] = useState(3);

  const markAsRead = () => {
    setNotificationCount(0);
  };

  const handleUrl = () => {
    const _url = getLocationOriginURL();
    return notificationsUrl ? notificationsUrl : `${_url}/notifications`;
  };

  return (
    <IGRPDropdownMenuPrimitive>
      <IGRPDropdownMenuTriggerPrimitive asChild>
        <IGRPButtonPrimitive variant="ghost" size="icon" className={cn('size-6 relative')}>
          <IGRPIcon iconName="Bell" strokeWidth={2} />
          {notificationCount > 0 && (
            <IGRPBadgePrimitive
              className={cn('absolute -top-1 -right-0.5 h-3.5 w-3.5 flex text-[10px] py-0 px-0')}
              variant="destructive"
            >
              {notificationCount}
            </IGRPBadgePrimitive>
          )}
          <span className={cn('sr-only')}>Notifications</span>
        </IGRPButtonPrimitive>
      </IGRPDropdownMenuTriggerPrimitive>
      <IGRPDropdownMenuContentPrimitive align="end" className={cn('max-w-80')}>
        <IGRPDropdownMenuLabelPrimitive className={cn('flex items-center justify-between')}>
          <span>Notifications</span>
          {notificationCount > 0 && (
            <IGRPButtonPrimitive
              variant="ghost"
              size="sm"
              onClick={markAsRead}
              className={cn('h-auto text-xs')}
            >
              Mark all as read
            </IGRPButtonPrimitive>
          )}
        </IGRPDropdownMenuLabelPrimitive>
        <IGRPDropdownMenuSeparatorPrimitive />
        <IGRPDropdownMenuGroupPrimitive className={cn('max-h-72 overflow-auto')}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <IGRPDropdownMenuItemPrimitive
                key={notification.id}
                className={cn('flex flex-col items-start p-4')}
              >
                <div className={cn('font-medium')}>{notification.title}</div>
                <div className={cn('text-sm text-muted-foreground')}>{notification.message}</div>
                <div className={cn('text-xs text-muted-foreground mt-1')}>
                  {notification.timestamp.toLocaleString()}
                </div>
              </IGRPDropdownMenuItemPrimitive>
            ))
          ) : (
            <div className={cn('py-4 px-2 text-center text-muted-foreground')}>
              Sem notificações
            </div>
          )}
        </IGRPDropdownMenuGroupPrimitive>
        <IGRPDropdownMenuSeparatorPrimitive />
        <IGRPDropdownMenuItemPrimitive className={cn('justify-center')} asChild>
          <Link href={handleUrl()}>Todas as notificações</Link>
        </IGRPDropdownMenuItemPrimitive>
      </IGRPDropdownMenuContentPrimitive>
    </IGRPDropdownMenuPrimitive>
  );
}

export { IGRPTemplateNotifications };
