'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { Bell, LogOut, User as UserIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../primitives/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../primitives/sidebar';
import { IGRPUserAvatar } from './user-avatar';
import { getInitials } from '../../lib/getInitials';
// TODO: see when user is null or undefiened
export function IGRPNavUserHeader({
  user
}) {
  if (!user) return null;
  return /*#__PURE__*/_jsx(SidebarMenu, {
    children: /*#__PURE__*/_jsx(SidebarMenuItem, {
      children: /*#__PURE__*/_jsxs(DropdownMenu, {
        children: [/*#__PURE__*/_jsx(DropdownMenuTrigger, {
          asChild: true,
          children: /*#__PURE__*/_jsx(SidebarMenuButton, {
            className: "p-0 hover:p-0 hover:bg-transparent h-auto",
            tooltip: user.username,
            size: "lg",
            children: /*#__PURE__*/_jsx(IGRPUserAvatar, {
              image: user.image,
              alt: user.username,
              fallbackContent: user && getInitials(user.username),
              fallbackClass: "text-xs",
              className: "shadow-md"
            })
          })
        }), /*#__PURE__*/_jsxs(DropdownMenuContent, {
          className: "min-w-56 rounded-lg",
          side: "bottom",
          align: "end",
          sideOffset: 4,
          children: [/*#__PURE__*/_jsx(DropdownMenuLabel, {
            className: "font-normal",
            children: /*#__PURE__*/_jsxs("div", {
              className: "flex flex-col space-y-1",
              children: [/*#__PURE__*/_jsx("p", {
                className: "text-sm font-medium leading-none",
                children: user.fullname
              }), /*#__PURE__*/_jsx("p", {
                className: "text-xs leading-none text-muted-foreground",
                children: user.email
              })]
            })
          }), /*#__PURE__*/_jsx(DropdownMenuSeparator, {}), /*#__PURE__*/_jsx(DropdownMenuItem, {
            asChild: true,
            className: "hover:bg-primary! hover:text-primary-foreground!",
            children: /*#__PURE__*/_jsxs(Link, {
              href: "/users/profile",
              children: [/*#__PURE__*/_jsx(UserIcon, {
                className: "mr-1 size-3.5 hover:text-primary-foreground!",
                strokeWidth: 2
              }), /*#__PURE__*/_jsx("span", {
                children: "Profile"
              })]
            })
          }), /*#__PURE__*/_jsx(DropdownMenuSeparator, {}), /*#__PURE__*/_jsx(DropdownMenuItem, {
            asChild: true,
            className: "hover:bg-primary! hover:text-primary-foreground!",
            children: /*#__PURE__*/_jsxs(Link, {
              href: "/users/notifications",
              children: [/*#__PURE__*/_jsx(Bell, {
                className: "mr-1 size-3.5 hover:text-primary-foreground!",
                strokeWidth: 2
              }), /*#__PURE__*/_jsx("span", {
                children: "Notifications"
              })]
            })
          }), /*#__PURE__*/_jsx(DropdownMenuSeparator, {}), /*#__PURE__*/_jsx(DropdownMenuItem, {
            asChild: true,
            className: "hover:bg-primary! hover:text-primary-foreground!",
            children: /*#__PURE__*/_jsxs(Link, {
              href: "/logout",
              children: [/*#__PURE__*/_jsx(LogOut, {
                className: "mr-1 size-3.5 hover:text-primary-foreground!",
                strokeWidth: 2
              }), /*#__PURE__*/_jsx("span", {
                children: "Log out"
              })]
            })
          })]
        })]
      })
    })
  });
}
//# sourceMappingURL=nav-user-header.js.map