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
  igrpFormatMessage,
  igrpGetInitials,
} from '@igrp/igrp-framework-react-design-system';
import { BellIcon, ChevronsUpDownIcon, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';

import { useIGRPChromeI18n } from '../i18n/context.js';
import { IGRP_CHROME_STRINGS_PT, type IGRPNavUserLabels } from '../i18n/strings.js';

export type { IGRPNavUserLabels };

/** @deprecated Use IGRP_CHROME_STRINGS_PT.navUser. */
export const IGRP_NAV_USER_LABELS_PT_PT: IGRPNavUserLabels = IGRP_CHROME_STRINGS_PT.navUser;

const iconClassName = 'mr-1';
// `focus:`, not `hover:` — Radix focuses the item on pointer-over too, and the
// DS item recolours every descendant on focus (`focus:**:text-accent-foreground`),
// so the text override must also reach descendants or it renders dark on primary.
const itemClassName =
  'cursor-pointer focus:bg-primary! focus:text-primary-foreground! focus:**:text-primary-foreground!';

export interface IGRPNavUserItemProps {
  href: string;
  /** Leading icon element, e.g. a lucide icon at `size={16}`. */
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/** One link entry in the nav-user menu, styled like the built-in ones. Pass it through `items`. */
function IGRPNavUserItem({ href, icon, children }: IGRPNavUserItemProps) {
  return (
    <DropdownMenuItem asChild className={cn(itemClassName)}>
      <Link href={href}>
        {icon && <span className={cn(iconClassName, 'flex')}>{icon}</span>}
        <span>{children}</span>
      </Link>
    </DropdownMenuItem>
  );
}

interface IGRPTemplateNavUserProps {
  user?: IGRPUserArgs;
  /**
   * Where the menu sits. `header`: avatar-only trigger, opens downward, no
   * settings entry (the header has its own settings link). `sidebar`: name and
   * email beside the avatar, opens away from the rail. Defaults to `sidebar`.
   */
  variant?: 'header' | 'sidebar';
  /** @deprecated Use `variant="header"`. */
  isHeader?: boolean;
  /** Profile entry destination. Defaults to `/profile`. */
  profileUrl?: string;
  /** @deprecated Use `profileUrl`. */
  userProfileUrl?: string;
  notificationsUrl?: string;
  settingsUrl?: string;
  /**
   * Sign-out destination. Defaults to `/logout`, the route the framework's
   * session watcher also targets for a clean IdP single-logout.
   */
  logoutUrl?: string;
  /** Show the link-only Notifications entry. Defaults to `true`. */
  showNotifications?: boolean;
  /** Show the Profile entry. Defaults to `true`. */
  showProfile?: boolean;
  /** Show the Settings entry (sidebar variant only). Defaults to `true`. */
  showSettings?: boolean;
  /**
   * Extra entries, rendered after the built-in ones and before sign-out. Use
   * `IGRPNavUserItem` to match the built-in look.
   */
  items?: React.ReactNode;
  /** Partial override of the chrome catalog group. Missing keys keep the catalog value. */
  labels?: Partial<IGRPNavUserLabels>;
}

function IGRPTemplateNavUser({
  user,
  variant,
  isHeader: isHeaderProp = false,
  profileUrl,
  userProfileUrl,
  notificationsUrl = '/notifications',
  // `/settings`, matching the header's own settings link. These two defaults
  // disagreed (`/setting` here), so whichever one an app had not routed 404'd.
  settingsUrl = '/settings',
  logoutUrl = '/logout',
  showNotifications = true,
  showProfile = true,
  showSettings = true,
  items,
  labels: labelOverrides,
}: IGRPTemplateNavUserProps) {
  const isHeader = variant ? variant === 'header' : isHeaderProp;
  const resolvedProfileUrl = profileUrl ?? userProfileUrl ?? '/profile';
  const { isMobile } = useIGRPSidebar();
  const chrome = useIGRPChromeI18n();

  if (!user) return null;

  const labels = labelOverrides ? { ...chrome.navUser, ...labelOverrides } : chrome.navUser;

  // In the header the trigger sits at the top-right, so Radix's default
  // (bottom) is correct; in the sidebar footer it has to open away from the rail.
  const side = isHeader ? undefined : isMobile ? 'bottom' : 'right';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={user.email}
              size="lg"
              // The header trigger shows only initials; name it after the user.
              aria-label={
                isHeader
                  ? igrpFormatMessage(labels.menuTrigger, {
                      name: user.name || labels.unknownUser,
                    })
                  : undefined
              }
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
                  <ChevronsUpDownIcon size={16} className="ml-auto" />
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
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {showProfile && (
              <>
                <DropdownMenuItem asChild className={cn(itemClassName)}>
                  <Link href={resolvedProfileUrl}>
                    <UserIcon size={16} className={iconClassName} />
                    <span>{labels.profile}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {showNotifications && (
              <>
                <DropdownMenuItem asChild className={cn(itemClassName)}>
                  <Link href={notificationsUrl}>
                    <BellIcon size={16} className={iconClassName} />
                    <span>{labels.notifications}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {!isHeader && showSettings && (
              <DropdownMenuItem asChild className={cn(itemClassName)}>
                <Link href={settingsUrl}>
                  <SettingsIcon size={16} className={iconClassName} />
                  <span>{labels.settings}</span>
                </Link>
              </DropdownMenuItem>
            )}

            {items}

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className={cn(itemClassName)}>
              <Link href={logoutUrl}>
                <LogOutIcon size={16} className={iconClassName} />
                <span>{labels.logout}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** The nav-user menu. Same component as `IGRPTemplateNavUser`, named for the `variant` API. */
const IGRPNavUser = IGRPTemplateNavUser;

export { IGRPTemplateNavUser, IGRPNavUser, IGRPNavUserItem, type IGRPTemplateNavUserProps };
