'use client';

import { Fragment, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon, AlertCircle } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/primitives/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/primitives/sidebar';
import { Alert, AlertDescription } from '@/components/primitives/alert';
import { Skeleton } from '@/components/primitives/skeleton';
import { isExternalUrl, normalizeUrl } from '@/lib/url';


export function IGRPMenus() {
  const pathname = usePathname();
  const isPreviewMode = process.env.NEXT_PUBLIC_IGRP_ENABLE_PROTOTYPE_MODE === 'true';
  const { data: menuData, isLoading, error } = useMenusByApplication(appId);
  const { mockMenus } = useMockMenus();

  const menus = useMemo(() => {
    return menuData && menuData.length > 0 ? menuData : mockMenus;
  }, [menuData]);

  const { topLevelMenus, childMap } = useMemo(() => {
    const topLevel = menus
      .filter((menu) => menu.parentId === null)
      .sort((a, b) => a.position - b.position);

    const childrenMap = new Map<number, IGRPMenuProps[]>();

    menus.forEach((menu) => {
      if (menu.parentId !== null) {
        if (!childrenMap.has(menu.parentId)) {
          childrenMap.set(menu.parentId, []);
        }
        childrenMap.get(menu.parentId)?.push(menu);
      }
    });

    childrenMap.forEach((children) => children.sort((a, b) => a.position - b.position));

    return {
      topLevelMenus: topLevel,
      childMap: childrenMap,
    };
  }, [menus]);

  const getChildren = useCallback(
    (parentId: number): IGRPMenuProps[] => childMap.get(parentId) || [],
    [childMap],
  );

  if ((!appId || appId === 0) && !isPreviewMode) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Prototype mode is not enabled and no valid app ID provided.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <SidebarMenu className={className}>
        {Array.from({ length: 5 }).map((_, index) => (
          <SidebarMenuItem key={`skeleton-${index}`}>
            <Skeleton className='h-10 w-full' />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>Failed to load menu items. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  return (
    <SidebarMenu className={className}>
      {topLevelMenus.map((menu) => (
        <MenuItemWithSubmenus
          key={`menu-${menu.id}`}
          menu={menu}
          pathname={pathname}
          childMenus={getChildren(menu.id)}
        />
      ))}
    </SidebarMenu>
  );
}

interface MenuItemWithSubmenusProps {
  menu: IGRPMenuProps;
  pathname: string;
  childMenus: IGRPMenuProps[];
}

function MenuItemWithSubmenus({ menu, pathname, childMenus }: MenuItemWithSubmenusProps) {
  const { id, name, url, icon } = menu;
  const isActive = pathname === url;
  const hasChildren = childMenus.length > 0;
  const isExternal = url ? isExternalUrl(url) : false;
  const normalizedUrl = url ? normalizeUrl(url) : '';

  if (!hasChildren) {
    return (
      <SidebarMenuItem key={`${id}-menu`}>
        <SidebarMenuButton
          asChild
          tooltip={name}
          isActive={isActive}
        >
          {isExternal ? (
            <a
              href={normalizedUrl || ''}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={`${name} (opens in new tab)`}
            >
              {icon && <IGRPIcon iconName={icon} />}
              <span>{name}</span>
            </a>
          ) : (
            <Link
              href={normalizedUrl || ''}
              aria-label={name}
            >
              {icon && <IGRPIcon iconName={icon} />}
              <span>{name}</span>
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Fragment key={`${id}-menu`}>
      {/* Dropdown variant for collapsed sidebar */}
      <SidebarMenuItem
        key={`${id}-dropdown-variant`}
        className='group'
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={name}
              className='hidden cursor-pointer group-data-[collapsible=icon]:flex'
              aria-label={`${name} menu`}
            >
              {icon && <IGRPIcon iconName={icon} />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side='right'
            align='start'
            className='min-w-48'
          >
            {childMenus.map((subMenu) => (
              <SubMenuItem
                key={`dropdown-${id}-${subMenu.id}`}
                menu={subMenu}
                variant='dropdown'
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Collapsible variant for expanded sidebar */}
      <SidebarMenuItem key={`${id}-collapsible-variant`}>
        <Collapsible className='w-full group'>
          <CollapsibleTrigger
            className='flex w-full group-data-[collapsible=icon]:hidden'
            asChild
          >
            <SidebarMenuButton
              tooltip={name}
              className='w-full cursor-pointer'
              aria-label={`Toggle ${name} submenu`}
            >
              {icon && <IGRPIcon iconName={icon} />}
              <span>{name}</span>
              <ChevronRightIcon
                className='ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90'
                strokeWidth={2}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {childMenus.map((subMenu) => (
                <SubMenuItem
                  key={`collapse-${id}-${subMenu.id}`}
                  menu={subMenu}
                  variant='collapsible'
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    </Fragment>
  );
}

interface SubMenuItemProps {
  menu: IGRPMenuProps;
  variant: 'dropdown' | 'collapsible';
}

function SubMenuItem({ menu, variant }: SubMenuItemProps) {
  const { name, url, icon } = menu;
  const isExternal = url ? isExternalUrl(url) : false;
  const normalizedUrl = url ? normalizeUrl(url) : '';

  const iconElement = icon && variant === 'dropdown' && <IGRPIcon iconName={icon} />;

  const linkContent = (
    <>
      {iconElement}
      <span>{name}</span>
    </>
  );

  const linkProps = isExternal
    ? {
        href: normalizedUrl || '',
        target: '_blank' as const,
        rel: 'noopener noreferrer' as const,
        'aria-label': `${name} (opens in new tab)`,
      }
    : {
        href: normalizedUrl || '',
        'aria-label': name,
      };

  if (variant === 'dropdown') {
    return (
      <DropdownMenuItem
        asChild
        onSelect={(e) => e.preventDefault()}
        className='cursor-pointer px-2 py-2.5'
      >
        {isExternal ? (
          <a
            {...linkProps}
            className='w-full flex items-center'
          >
            {linkContent}
          </a>
        ) : (
          <Link
            {...linkProps}
            className='w-full flex items-center'
          >
            {linkContent}
          </Link>
        )}
      </DropdownMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        {isExternal ? (
          <a {...linkProps}>
            <span>{name}</span>
          </a>
        ) : (
          <Link {...linkProps}>
            <span>{name}</span>
          </Link>
        )}
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
