'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '../primitives/badge';
import { Button } from '../horizon/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';

const notifications = [
    {
      id: 1,
      title: 'New user registered',
      description: 'A new user has registered to the platform.',
      time: '2 minutes ago',
    },
    {
      id: 2,
      title: 'System update completed',
      description: 'The system update has been successfully completed.',
      time: '1 hour ago',
    },
    {
      id: 3,
      title: 'Maintenance scheduled',
      description: 'System maintenance scheduled for tomorrow at 2 AM.',
      time: '3 hours ago',
    },
  ];

export function Notifications() {
  const [notificationCount, setNotificationCount] = React.useState(3);  

  const markAsRead = () => {
    setNotificationCount(0);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-6 relative">
          <Bell strokeWidth={2} />
          {notificationCount > 0 && (
            <Badge
              className="absolute -top-1 -right-0.5 h-3 w-3 flex items-center justify-center p-1 text-xs"
              variant="destructive"
            >
              {notificationCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notificationCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAsRead} className="h-auto text-xs">
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-72 overflow-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-muted-foreground">{notification.description}</div>
                <div className="text-xs text-muted-foreground mt-1">{notification.time}</div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="py-4 px-2 text-center text-muted-foreground">No new notifications</div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center">View all notifications</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
