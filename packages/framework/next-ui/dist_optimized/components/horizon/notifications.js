'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '../primitives/badge';
import { Button } from '../primitives/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../primitives/dropdown-menu';
export function Notifications() {
  const $ = _c(3);
  const [notificationCount, setNotificationCount] = React.useState(3);
  let t0;
  if ($[0] !== notificationCount) {
    const notifications = [{
      id: 1,
      title: "New user registered",
      description: "A new user has registered to the platform.",
      time: "2 minutes ago"
    }, {
      id: 2,
      title: "System update completed",
      description: "The system update has been successfully completed.",
      time: "1 hour ago"
    }, {
      id: 3,
      title: "Maintenance scheduled",
      description: "System maintenance scheduled for tomorrow at 2 AM.",
      time: "3 hours ago"
    }];
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = () => {
        setNotificationCount(0);
      };
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    const markAsRead = t1;
    t0 = _jsxs(DropdownMenu, {
      children: [_jsx(DropdownMenuTrigger, {
        asChild: true,
        children: _jsxs(Button, {
          variant: "ghost",
          size: "icon",
          className: "size-6 relative",
          children: [_jsx(Bell, {
            strokeWidth: 2
          }), notificationCount > 0 && _jsx(Badge, {
            className: "absolute -top-1 -right-0.5 h-3 w-3 flex items-center justify-center p-0 text-[8px]",
            variant: "destructive",
            children: notificationCount
          }), _jsx("span", {
            className: "sr-only",
            children: "Notifications"
          })]
        })
      }), _jsxs(DropdownMenuContent, {
        align: "end",
        className: "max-w-80",
        children: [_jsxs(DropdownMenuLabel, {
          className: "flex items-center justify-between",
          children: [_jsx("span", {
            children: "Notifications"
          }), notificationCount > 0 && _jsx(Button, {
            variant: "ghost",
            size: "sm",
            onClick: markAsRead,
            className: "h-auto text-xs",
            children: "Mark all as read"
          })]
        }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuGroup, {
          className: "max-h-72 overflow-auto",
          children: notifications.length > 0 ? notifications.map(_temp) : _jsx("div", {
            className: "py-4 px-2 text-center text-muted-foreground",
            children: "No new notifications"
          })
        }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, {
          className: "justify-center",
          children: "View all notifications"
        })]
      })]
    });
    $[0] = notificationCount;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}
function _temp(notification) {
  return _jsxs(DropdownMenuItem, {
    className: "flex flex-col items-start p-4",
    children: [_jsx("div", {
      className: "font-medium",
      children: notification.title
    }), _jsx("div", {
      className: "text-sm text-muted-foreground",
      children: notification.description
    }), _jsx("div", {
      className: "text-xs text-muted-foreground mt-1",
      children: notification.time
    })]
  }, notification.id);
}
//# sourceMappingURL=notifications.js.map