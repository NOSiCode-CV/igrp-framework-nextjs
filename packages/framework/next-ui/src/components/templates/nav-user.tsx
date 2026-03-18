'use client';

import Link from 'next/link';
import type { IGRPUserArgs } from '@igrp/framework-next-types';
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

  const iconClassName = cn('mr-1 hover:text-primary-foreground!');

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
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className={cn(
                'group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
              )}
              tooltip={user.email}
              size="lg"
            >
              <IGRPUserAvatar
                alt={user.name}
                fallbackContent={user && igrpGetInitials(user?.name)}
                fallbackClass="text-xs"
                className={cn('shadow-md')}
              />
              {!isHeader && (
                <>
                  <div className={cn('grid flex-1 text-left text-sm leading-tight')}>
                    <span className={cn('truncate font-semibold')}>{user.name || 'N/A'}</span>
                    <span className={cn('truncate text-xs')}>{user.email}</span>
                  </div>
                  <IGRPIcon iconName="ChevronsUpDown" className={cn('ml-auto')} />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className={cn('min-w-56 rounded-lg')}
            side={renderMobile()}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className={cn('font-normal')}>
              <div className={cn('flex flex-col space-y-1')}>
                <p className={cn('text-sm font-medium leading-none')}>{user.name}</p>
                <p className={cn('text-xs leading-none text-muted-foreground')}>{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              asChild
              className={cn('cursor-pointer hover:bg-primary! hover:text-primary-foreground!')}
            >
              <Link href={handleUserUrl()}>
                <IGRPIcon iconName="User" className={iconClassName} />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              asChild
              className={cn('cursor-pointer hover:bg-primary! hover:text-primary-foreground!')}
            >
              <Link href={handleNotificationsUrl()}>
                <IGRPIcon iconName="Bell" className={cn('mr-1 hover:text-primary-foreground!')} />
                <span>Notifications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {!isHeader && (
              <DropdownMenuItem
                asChild
                className={cn('cursor-pointer hover:bg-primary! hover:text-primary-foreground!')}
              >
                <Link href={handleSettingsUrl()}>
                  <IGRPIcon
                    iconName="Settings"
                    className={cn('mr-1 hover:text-primary-foreground!')}
                  />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              asChild
              className={cn('cursor-pointer hover:bg-primary! hover:text-primary-foreground!')}
            >
              <Link href="/logout">
                <IGRPIcon iconName="LogOut" className={iconClassName} />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export { IGRPTemplateNavUser, type IGRPTemplateNavUserProps };
