'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { Bell, ChevronsUpDown, LogOut, User as UserIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../primitives/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../primitives/sidebar';
import { IGRPUserAvatar } from './user-avatar';
import { getInitials } from '../../lib/getInitials';
// TODO: see when user is null or undefiened
export function IGRPNavUser(t0) {
  const $ = _c(9);
  const {
    user
  } = t0;
  const {
    isMobile
  } = useSidebar();
  if (!user) {
    return null;
  }
  let t1;
  if ($[0] !== user) {
    t1 = user && getInitials(user.username);
    $[0] = user;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== isMobile || $[3] !== t1 || $[4] !== user.email || $[5] !== user.fullname || $[6] !== user.image || $[7] !== user.username) {
    t2 = _jsx(SidebarMenu, {
      children: _jsx(SidebarMenuItem, {
        children: _jsxs(DropdownMenu, {
          children: [_jsx(DropdownMenuTrigger, {
            asChild: true,
            children: _jsxs(SidebarMenuButton, {
              className: "group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer group-data-[collapsible=icon]:pl-0! py-2!",
              tooltip: user.username,
              size: "lg",
              children: [_jsx(IGRPUserAvatar, {
                image: user.image,
                alt: user.username,
                fallbackContent: t1,
                fallbackClass: "text-xs",
                className: "shadow-md"
              }), _jsxs("div", {
                className: "grid flex-1 text-left text-sm leading-tight",
                children: [_jsx("span", {
                  className: "truncate font-semibold",
                  children: user.username || "N/A"
                }), _jsx("span", {
                  className: "truncate text-xs",
                  children: user.email
                })]
              }), _jsx(ChevronsUpDown, {
                className: "ml-auto size-3.5",
                strokeWidth: 2
              })]
            })
          }), _jsxs(DropdownMenuContent, {
            className: "min-w-56 rounded-lg",
            side: isMobile ? "bottom" : "right",
            align: "end",
            sideOffset: 4,
            children: [_jsx(DropdownMenuLabel, {
              className: "font-normal",
              children: _jsxs("div", {
                className: "flex flex-col space-y-1",
                children: [_jsx("p", {
                  className: "text-sm font-medium leading-none",
                  children: user.fullname
                }), _jsx("p", {
                  className: "text-xs leading-none text-muted-foreground",
                  children: user.email
                })]
              })
            }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, {
              asChild: true,
              className: "cursor-pointer hover:bg-primary! hover:text-primary-foreground!",
              children: _jsxs(Link, {
                href: "/users/profile",
                children: [_jsx(UserIcon, {
                  className: "mr-1 size-3.5 hover:text-primary-foreground!",
                  strokeWidth: 2
                }), _jsx("span", {
                  children: "Profile"
                })]
              })
            }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, {
              asChild: true,
              className: "cursor-pointer hover:bg-primary! hover:text-primary-foreground!",
              children: _jsxs(Link, {
                href: "/users/notifications",
                children: [_jsx(Bell, {
                  className: "mr-1 size-3.5 hover:text-primary-foreground!",
                  strokeWidth: 2
                }), _jsx("span", {
                  children: "Notifications"
                })]
              })
            }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, {
              asChild: true,
              className: "cursor-pointer hover:bg-primary! hover:text-primary-foreground!",
              children: _jsxs(Link, {
                href: "/logout",
                children: [_jsx(LogOut, {
                  className: "mr-1 size-3.5 hover:text-primary-foreground!",
                  strokeWidth: 2
                }), _jsx("span", {
                  children: "Log out"
                })]
              })
            })]
          })]
        })
      })
    });
    $[2] = isMobile;
    $[3] = t1;
    $[4] = user.email;
    $[5] = user.fullname;
    $[6] = user.image;
    $[7] = user.username;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  return t2;
}
//# sourceMappingURL=nav-user.js.map