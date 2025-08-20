'use client';

import Link from 'next/link';
import type { IGRPUserArgs } from '@igrp/framework-next-types';
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
  useIGRPSidebar,
  IGRPUserAvatar,
  igrpGetnitials,
} from '@igrp/igrp-framework-react-design-system';

interface IGRPTemplateNavUserProps {
  user?: IGRPUserArgs;
}

// TODO: see when user is null or undefiened

function IGRPTemplateNavUser({ user }: IGRPTemplateNavUserProps) {
  const { isMobile } = useIGRPSidebar();

  if (!user) return null;

  return (
    <IGRPSidebarMenuPrimitive>
      <IGRPSidebarMenuItemPrimitive>
        <IGRPDropdownMenuPrimitive>
          <IGRPDropdownMenuTriggerPrimitive asChild>
            <IGRPSidebarMenuButtonPrimitive
              className="group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer group-data-[collapsible=icon]:pl-0! py-2!"
              tooltip={user.username}
              size="lg"
            >
              <IGRPUserAvatar                
                alt={user.username}
                fallbackContent={user && igrpGetnitials(user.username)}
                fallbackClass="text-xs"
                className="shadow-md"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.username || 'N/A'}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              {/* <ChevronsUpDown className="ml-auto size-3.5" strokeWidth={2} /> */}
            </IGRPSidebarMenuButtonPrimitive>
          </IGRPDropdownMenuTriggerPrimitive>
          <IGRPDropdownMenuContentPrimitive
            className="min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
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
              className="cursor-pointer hover:bg-primary! hover:text-primary-foreground!"
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
              className="cursor-pointer hover:bg-primary! hover:text-primary-foreground!"
            >
              <Link href="/users/notifications">
                {/* <Bell className="mr-1 size-3.5 hover:text-primary-foreground!" strokeWidth={2} /> */}
                <span>Notifications</span>
              </Link>
            </IGRPDropdownMenuItemPrimitive>
            <IGRPDropdownMenuSeparatorPrimitive />

            <IGRPDropdownMenuItemPrimitive
              asChild
              className="cursor-pointer hover:bg-primary! hover:text-primary-foreground!"
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

export { IGRPTemplateNavUser, type IGRPTemplateNavUserProps };
