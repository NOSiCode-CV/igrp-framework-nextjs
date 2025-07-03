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
// import { IGRPAppSwitcher } from './app-switcher';
import { IGRPNavUser } from './nav-user';
import type { SidebarData } from '../../types/globals';
import { IGRPMenus } from './app-menus';

interface IGRPAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data?: SidebarData;
}

export function IGRPAppSidebar({ data, ...props }: IGRPAppSidebarProps) {
  const pathname = usePathname();

  const navFooter = data?.footerItems;
  const menus = data?.menuItems;
  const user = data?.user;

  console.log({ data, menus, navFooter });

  return (
    <Sidebar collapsible='icon' {...props} variant='sidebar'>
      <SidebarHeader>
        {/* <IGRPAppSwitcher app={menuConfig.teams} /> */}
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
