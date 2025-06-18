'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/primitives/collapsible';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/primitives/dropdown-menu';
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
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/primitives/sidebar';
import { AppSwitcher } from '@/components/app-switcher';
import { NavUser } from '@/components/nav-user';
import { menuConfig } from '@/config/menu';
import type { SidebarData } from '@/types';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data?: SidebarData;
}

export function AppSidebar({ data, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  const navFooter = menuConfig.navFooter;
  const menus = data?.menuItems;
  const user = data?.user;

  console.log({ menus, user });

  return (
    <Sidebar
      collapsible='icon'
      {...props}
      variant='sidebar'
    >
      <SidebarHeader>
        <AppSwitcher app={menuConfig.teams} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuConfig.navMain.map(({ title, url, icon: Icon }) => {
                const isExternal = url.startsWith('http');
                return (
                  <SidebarMenuItem key={title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === url || (url !== '/' && pathname?.startsWith(url))}
                      tooltip={title}
                    >
                      {isExternal ? (
                        <a
                          href={url}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {Icon && <Icon />}
                          <span className='flex items-center gap-1'>{title}</span>
                        </a>
                      ) : (
                        <Link href={url}>
                          {Icon && <Icon />}
                          <span>{title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupLabel>Access Management</SidebarGroupLabel>
            <SidebarMenu>
              {menuConfig.navAccess.map(({ items: subItems, url, title, icon: Icon }) => {
                const hasSubItems = subItems && subItems.length > 0;
                const isExternal = url.startsWith('http');

                if (hasSubItems) {
                  return (
                    <Fragment key={title}>
                      <SidebarMenuItem className='group'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                              tooltip={title}
                              className="w-full cursor-pointer group-data-[collapsible='']:hidden"
                            >
                              {Icon && <Icon />}
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side='right'
                            align='start'
                          >
                            {subItems.map(({ title, url: subUrl, icon: SubIcon }) => {
                              const isExternalSub = subUrl.startsWith('http');

                              return (
                                <DropdownMenuItem
                                  key={title}
                                  asChild
                                  className='cursor-pointer px-2 py-2.5'
                                >
                                  {isExternalSub ? (
                                    <a
                                      href={url}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='w-full'
                                    >
                                      {SubIcon && <SubIcon className='' />}
                                      {title}
                                    </a>
                                  ) : (
                                    <Link
                                      href={subUrl}
                                      className='w-full'
                                    >
                                      {SubIcon && <SubIcon className='' />}
                                      {title}
                                    </Link>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <Collapsible className='w-full group'>
                          <CollapsibleTrigger
                            className='flex w-full group-data-[collapsible=icon]:hidden'
                            asChild
                          >
                            <SidebarMenuButton
                              tooltip={title}
                              className='w-full cursor-pointer'
                            >
                              {Icon && <Icon />}
                              <span>{title}</span>
                              <ChevronRightIcon
                                className='ml-auto transition-transform duration-200 group-data-[state=open]:rotate-90'
                                strokeWidth={2}
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {subItems.map(({ title, url: subUrl }) => {
                                const isExternalSub = subUrl.startsWith('http');

                                return (
                                  <SidebarMenuSubItem key={title}>
                                    <SidebarMenuSubButton
                                      asChild
                                      className=''
                                    >
                                      {isExternalSub ? (
                                        <a
                                          href={subUrl}
                                          target='_blank'
                                          rel='noopener noreferrer'
                                        >
                                          <span className='flex items-center gap-1'>{title}</span>
                                        </a>
                                      ) : (
                                        <Link href={subUrl}>
                                          <span>{title}</span>
                                        </Link>
                                      )}
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    </Fragment>
                  );
                } else {
                  const isActive = pathname === url;
                  return (
                    <SidebarMenuItem key={title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={title}
                        isActive={isActive}
                      >
                        {isExternal ? (
                          <a
                            href={url}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            {Icon && <Icon />}
                            <span className='flex items-center gap-1'>{title}</span>
                          </a>
                        ) : (
                          <Link href={url}>
                            {Icon && <Icon />}
                            <span>{title}</span>
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroupContent>
          <SidebarMenu>
            {navFooter && (
              <SidebarMenuButton
                asChild
                isActive={
                  pathname === navFooter.url ||
                  (navFooter.url !== '/' && pathname?.startsWith(navFooter.url))
                }
                tooltip={navFooter.title}
              >
                <Link href={navFooter.url}>
                  {navFooter.icon && <navFooter.icon />}
                  <span>{navFooter.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenu>
        </SidebarGroupContent>

        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
