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

/** pt-PT defaults for the user menu. Override individually. */
export interface IGRPNavUserLabels {
  profile: string;
  notifications: string;
  settings: string;
  logout: string;
  /** Shown in place of a missing user name. */
  unknownUser: string;
}

export const IGRP_NAV_USER_LABELS_PT_PT: IGRPNavUserLabels = {
  profile: 'Perfil',
  notifications: 'Notificações',
  settings: 'Definições',
  logout: 'Terminar sessão',
  unknownUser: 'N/D',
};

interface IGRPTemplateNavUserProps {
  user?: IGRPUserArgs;
  isHeader?: boolean;
  userProfileUrl?: string;
  notificationsUrl?: string;
  settingsUrl?: string;
  /**
   * Sign-out destination. Defaults to `/logout`, the route the framework's
   * session watcher also targets for a clean IdP single-logout.
   */
  logoutUrl?: string;
  showNotifications?: boolean;
  /** Partial override of the pt-PT strings. Missing keys keep their default. */
  labels?: Partial<IGRPNavUserLabels>;
}

function IGRPTemplateNavUser({
  user,
  isHeader = false,
  userProfileUrl = '/profile',
  notificationsUrl = '/notifications',
  // `/settings`, matching the header's own settings link. These two defaults
  // disagreed (`/setting` here), so whichever one an app had not routed 404'd.
  settingsUrl = '/settings',
  logoutUrl = '/logout',
  showNotifications = true,
  labels: labelOverrides,
}: IGRPTemplateNavUserProps) {
  const { isMobile } = useIGRPSidebar();

  if (!user) return null;

  const labels = labelOverrides
    ? { ...IGRP_NAV_USER_LABELS_PT_PT, ...labelOverrides }
    : IGRP_NAV_USER_LABELS_PT_PT;

  // In the header the trigger sits at the top-right, so Radix's default
  // (bottom) is correct; in the sidebar footer it has to open away from the rail.
  const side = isHeader ? undefined : isMobile ? 'bottom' : 'right';

  const iconClassName = 'mr-1 hover:text-primary-foreground!';
  const itemClassName = 'cursor-pointer hover:bg-primary! hover:text-primary-foreground!';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={user.email}
              size="lg"
            >
              <IGRPUserAvatar
                image={user.picture}
                alt={user.name}
                fallbackContent={igrpGetInitials(user.name)}
                fallbackClass="text-xs"
                className="shadow-md"
              />
              {!isHeader && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.name || labels.unknownUser}
                    </span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <IGRPIcon iconName="ChevronsUpDown" className="ml-auto" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={side}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className={cn(itemClassName)}>
              <Link href={userProfileUrl}>
                <IGRPIcon iconName="User" className={iconClassName} />
                <span>{labels.profile}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {showNotifications && (
              <>
                <DropdownMenuItem asChild className={cn(itemClassName)}>
                  <Link href={notificationsUrl}>
                    <IGRPIcon iconName="Bell" className={iconClassName} />
                    <span>{labels.notifications}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {!isHeader && (
              <DropdownMenuItem asChild className={cn(itemClassName)}>
                <Link href={settingsUrl}>
                  <IGRPIcon iconName="Settings" className={iconClassName} />
                  <span>{labels.settings}</span>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className={cn(itemClassName)}>
              <Link href={logoutUrl}>
                <IGRPIcon iconName="LogOut" className={iconClassName} />
                <span>{labels.logout}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export { IGRPTemplateNavUser, type IGRPTemplateNavUserProps };
