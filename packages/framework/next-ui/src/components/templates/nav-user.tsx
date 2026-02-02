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
  igrpGetInitials,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import { getLocationOriginURL } from '../../lib/utils';

interface IGRPTemplateNavUserProps {
  user?: IGRPUserArgs;
  isHeader?: boolean;
  userProfileUrl?: string;
  notificationsUrl?: string;
  settingsUrl?: string;
}

function IGRPTemplateNavUser({
  user,
  isHeader = false,
  userProfileUrl,
  notificationsUrl,
  settingsUrl,
}: IGRPTemplateNavUserProps) {
  const { isMobile } = useIGRPSidebar();

  if (!user) return null;

  function renderMobile() {
    if (isHeader) return;
    return isMobile ? 'bottom' : 'right';
  }

  const iconClassName = 'mr-1 hover:text-primary-foreground!';

  const handleUserUrl = () => {
    if (userProfileUrl) return userProfileUrl;
    return `${getLocationOriginURL()}/profile`;
  };

  const handleNotificationsUrl = () => {
    if (notificationsUrl) return notificationsUrl;
    return `${getLocationOriginURL()}/notifications`;
  };

  const handleSettingsUrl = () => {
    if (settingsUrl) return settingsUrl;
    return `${getLocationOriginURL()}/setting`;
  };

  return (
    <IGRPSidebarMenuPrimitive>
      <IGRPSidebarMenuItemPrimitive>
        <IGRPDropdownMenuPrimitive>
          <IGRPDropdownMenuTriggerPrimitive asChild>
            <IGRPSidebarMenuButtonPrimitive
              className="group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={user.email}
              size="lg"
            >
              <IGRPUserAvatar
                alt={user.name}
                fallbackContent={user && igrpGetInitials(user?.name)}
                fallbackClass="text-xs"
                className="shadow-md"
              />
              {!isHeader && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name || 'N/A'}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <IGRPIcon iconName="ChevronsUpDown" className="ml-auto" />
                </>
              )}
            </IGRPSidebarMenuButtonPrimitive>
          </IGRPDropdownMenuTriggerPrimitive>

          <IGRPDropdownMenuContentPrimitive
            className="min-w-56 rounded-lg"
            side={renderMobile()}
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
              <Link href={handleUserUrl()}>
                <IGRPIcon iconName="User" className={iconClassName} />
                <span>Profile</span>
              </Link>
            </IGRPDropdownMenuItemPrimitive>
            <IGRPDropdownMenuSeparatorPrimitive />

            <IGRPDropdownMenuItemPrimitive
              asChild
              className="cursor-pointer hover:bg-primary! hover:text-primary-foreground!"
            >
              <Link href={handleNotificationsUrl()}>
                <IGRPIcon iconName="Bell" className="mr-1 hover:text-primary-foreground!" />
                <span>Notifications</span>
              </Link>
            </IGRPDropdownMenuItemPrimitive>
            <IGRPDropdownMenuSeparatorPrimitive />

            {!isHeader && (
              <IGRPDropdownMenuItemPrimitive
                asChild
                className="cursor-pointer hover:bg-primary! hover:text-primary-foreground!"
              >
                <Link href={handleSettingsUrl()}>
                  <IGRPIcon iconName="Settings" className="mr-1 hover:text-primary-foreground!" />
                  <span>Settings</span>
                </Link>
              </IGRPDropdownMenuItemPrimitive>
            )}

            <IGRPDropdownMenuSeparatorPrimitive />

            <IGRPDropdownMenuItemPrimitive
              asChild
              className="cursor-pointer hover:bg-primary! hover:text-primary-foreground!"
            >
              <Link href="/logout">
                <IGRPIcon iconName="LogOut" className={iconClassName} />
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
