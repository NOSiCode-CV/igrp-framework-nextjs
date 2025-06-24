'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  // SidebarMenu,
  // SidebarMenuButton,
  SidebarRail,
} from '@/components/primitives/sidebar';
// import { IGRPAppSwitcher } from './app-switcher';
import { IGRPNavUser } from './nav-user';
import type { SidebarData } from '@/types';
// import { IGRPMenus } from './app-menus';

interface IGRPAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data?: SidebarData;
}

export function IGRPAppSidebar({ data, ...props }: IGRPAppSidebarProps) {
  // const pathname = usePathname();

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
            {/* <IGRPMenus /> */}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroupContent>
          {/* <SidebarMenu>
            {navFooter.map(({ title, href, icon: Icon }) => (
              <SidebarMenuButton
                asChild
                isActive={
                  pathname === navFooter.href ||
                  (navFooter.href !== '/' && pathname?.startsWith(navFooter.href))
                }
                tooltip={navFooter.title}
              >
                <Link href={navFooter.href}>
                  {navFooter.icon && <navFooter.icon />}
                  <span>{navFooter.title}</span>
                </Link>
              </SidebarMenuButton>
            ))}
          </SidebarMenu> */}
        </SidebarGroupContent>

        <IGRPNavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
