'use client';

import Link from 'next/link';
import {
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuLabelPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPSidebarMenuPrimitive,
  IGRPSidebarMenuButtonPrimitive,
  IGRPSidebarMenuItemPrimitive,
  igrpGetnitials,
  IGRPUserAvatar,
} from '@igrp/igrp-framework-react-design-system';

import { type IGRPTemplateNavUserProps } from './nav-user';

function IGRPTemplateNavUserHeader({ user }: IGRPTemplateNavUserProps) {
  if (!user) return null;

  return (
    <IGRPSidebarMenuPrimitive>
      <IGRPSidebarMenuItemPrimitive>
        <IGRPDropdownMenuPrimitive>
          <IGRPDropdownMenuTriggerPrimitive asChild>
            <IGRPSidebarMenuButtonPrimitive
              className="p-0 hover:p-0 hover:bg-transparent h-auto"
              tooltip={user.username}
              size="lg"
            >
              <IGRPUserAvatar
                alt={user.name}
                fallbackContent={user && igrpGetnitials(user.username)}
                fallbackClass="text-xs"
                className="shadow-md"
              />
            </IGRPSidebarMenuButtonPrimitive>
          </IGRPDropdownMenuTriggerPrimitive>
          <IGRPDropdownMenuContentPrimitive
            className="min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <IGRPDropdownMenuLabelPrimitive className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </IGRPDropdownMenuLabelPrimitive>
            <IGRPDropdownMenuSeparatorPrimitive />

            <IGRPDropdownMenuItemPrimitive
              asChild
              className="hover:bg-primary! hover:text-primary-foreground!"
            >
              <Link href="/users/profile">
                {/* <UserIcon
                  className="mr-1 size-3.5 hover:text-primary-foreground!"
                  strokeWidth={2}
                /> */}
                <span>Profile</span>
              </Link>
            </IGRPDropdownMenuItemPrimitive>
            <IGRPDropdownMenuSeparatorPrimitive />

            <IGRPDropdownMenuItemPrimitive
              asChild
              className="hover:bg-primary! hover:text-primary-foreground!"
            >
              <Link href="/users/notifications">
                {/* <Bell className="mr-1 size-3.5 hover:text-primary-foreground!" strokeWidth={2} /> */}
                <span>Notifications</span>
              </Link>
            </IGRPDropdownMenuItemPrimitive>
            <IGRPDropdownMenuSeparatorPrimitive />

            <IGRPDropdownMenuItemPrimitive
              asChild
              className="hover:bg-primary! hover:text-primary-foreground!"
            >
              <Link href="/logout">
                {/* <LogOut className="mr-1 size-3.5 hover:text-primary-foreground!" strokeWidth={2} /> */}
                <span>Log out</span>
              </Link>
            </IGRPDropdownMenuItemPrimitive>
          </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
      </IGRPSidebarMenuItemPrimitive>
    </IGRPSidebarMenuPrimitive>
  );
}

export { IGRPTemplateNavUserHeader };
