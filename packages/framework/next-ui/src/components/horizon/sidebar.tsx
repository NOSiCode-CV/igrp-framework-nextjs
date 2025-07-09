'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IGRPIcon } from "@igrp/igrp-framework-react-design-system"
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
} from '../primitives/sidebar';
import { IGRPAppSwitcher } from './app-switcher';
import { IGRPNavUser } from './nav-user';
import type { IGRPSidebarDataArgs } from '../../types';
import { IGRPMenus } from './menus';

interface IGRPAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data?: IGRPSidebarDataArgs;
}

export function IGRPSidebar({ data, ...props }: IGRPAppSidebarProps) {
  const pathname = usePathname();

  const navFooter = data?.footerItems;
  const menus = data?.menuItems;
  const user = data?.user;
  const showAppSwitcher = data?.showAppSwitcher;
  const apps = data?.apps;

  return (
    <Sidebar collapsible='icon' {...props} variant='sidebar'>
      <SidebarHeader>
      {showAppSwitcher && <IGRPAppSwitcher apps={apps} currentApp={apps?.[0]} /> }
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <IGRPMenus menus={menus} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {navFooter?.map(({ name, url, icon }, index) => (
            <SidebarMenuButton
              asChild
              isActive={
                pathname === url ||
                (url !== '/' && pathname?.startsWith(url || ''))
              }
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
