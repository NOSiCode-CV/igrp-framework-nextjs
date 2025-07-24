'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IGRPIcon } from '@igrp/framework-next-design-system';
import type { IGRPSidebarDataArgs } from '@igrp/framework-next-types';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarRail,
} from '../horizon/sidebar';
import { IGRPAppSwitcher } from './app-switcher';
import { IGRPMenus } from './menus';
import { IGRPNavUser } from './nav-user';

interface IGRPAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data?: IGRPSidebarDataArgs;
}

export function IGRPSidebar({ data, ...props }: IGRPAppSidebarProps) {
  if (!data) throw new Error('Sidebar data is required');

  console.log('::: UI SIDEBAR :::');
  console.log({ data });

  const pathname = usePathname();

  const { footerItems, menuItems, user, showAppSwitcher, apps, appCode, appCenterUrl } = data;

  return (
    <Sidebar collapsible="icon" {...props} variant="sidebar">
      <SidebarHeader>
        {showAppSwitcher && (
          <IGRPAppSwitcher apps={apps} appCode={appCode} appCenterUrl={appCenterUrl} />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <IGRPMenus menus={menuItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {footerItems?.map(({ name, url, icon }, index) => (
            <SidebarMenuButton
              asChild
              isActive={pathname === url || (url !== '/' && pathname?.startsWith(url || ''))}
              tooltip={name}
              key={`footer-menu-${index}`}
            >
              <Link href={url || ''}>
                {icon && <IGRPIcon iconName={icon} />}
                <span>{name}</span>
              </Link>
            </SidebarMenuButton>
          ))}
        </SidebarMenu>

        <IGRPNavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
