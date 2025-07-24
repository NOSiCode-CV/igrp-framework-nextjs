'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { IGRPIcon } from '@igrp/framework-next-design-system';

import { Alert, AlertDescription } from '../../components/primitives/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/primitives/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/primitives/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '../../components/horizon/sidebar';
import { igrpIsExternalUrl, igrpNormalizeUrl } from '../../lib/url';

export type IGRPMenuArgs = {
  menus?: IGRPMenuItemArgs[];
};

export function IGRPMenus({ menus = [] }: IGRPMenuArgs) {
  const pathname = usePathname();

  const menuData = useMemo(() => {
    return menus.length > 0 ? menus : undefined;
  }, [menus]);

  const { topLevelMenus, childMap } = useMemo(() => {
    const topLevel = menuData
      ?.filter((menu) => menu.parentId === null)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const childrenMap = new Map<number, IGRPMenuItemArgs[]>();

    menuData?.forEach((menu) => {
      if (menu.parentId !== null) {
        if (!childrenMap.has(menu.parentId)) {
          childrenMap.set(menu.parentId, []);
        }
        childrenMap.get(menu.parentId)?.push(menu);
      }
    });

    childrenMap.forEach((children) =>
      children.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    );

    return {
      topLevelMenus: topLevel,
      childMap: childrenMap,
    };
  }, [menuData]);

  const getChildren = useCallback(
    (parentId: number): IGRPMenuItemArgs[] => childMap.get(parentId) || [],
    [childMap],
  );

  if (menuData === undefined) {
    return (
      <Alert variant="destructive">
        <IGRPIcon iconName="CircleAlert" />
        <AlertDescription>
          Prototype mode is not enabled and no valid app ID provided.
        </AlertDescription>
      </Alert>
    );
  }

  if (menuData.length === 0) {
    return (
      <Alert variant="default">
        <IGRPIcon iconName="Info" />
        <AlertDescription>App has no menu items.</AlertDescription>
      </Alert>
    );
  }

  return (
    <SidebarMenu role="navigation">
      {topLevelMenus?.map((menu) => (
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
  menu: IGRPMenuItemArgs;
  pathname: string;
  childMenus: IGRPMenuItemArgs[];
}

function MenuItemWithSubmenus({ menu, pathname, childMenus }: MenuItemWithSubmenusProps) {
  const { id, name, url, icon } = menu;
  const isActive = pathname === url;
  const hasChildren = childMenus.length > 0;
  const isExternal = url ? igrpIsExternalUrl(url) : false;
  const normalizedUrl = url ? igrpNormalizeUrl(url) : '';

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={name} isActive={isActive}>
          {isExternal ? (
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} (opens in new tab)`}
            >
              {icon && <IGRPIcon iconName={icon} />}
              <span>{name}</span>
            </a>
          ) : (
            <Link href={normalizedUrl} aria-label={name}>
              {icon && <IGRPIcon iconName={icon} />}
              <span>{name}</span>
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <>
      {/* Dropdown for collapsed sidebar */}
      <SidebarMenuItem className="group">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={name}
              className="hidden cursor-pointer group-data-[collapsible=icon]:flex"
              aria-label={`${name} menu`}
            >
              {icon && <IGRPIcon iconName={icon} />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="min-w-48">
            {childMenus.map((subMenu) => (
              <SubMenuItem key={`dropdown-${id}-${subMenu.id}`} menu={subMenu} variant="dropdown" />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Collapsible for expanded sidebar */}
      <SidebarMenuItem>
        <Collapsible className="w-full group">
          <CollapsibleTrigger className="flex w-full group-data-[collapsible=icon]:hidden" asChild>
            <SidebarMenuButton
              tooltip={name}
              className="w-full cursor-pointer"
              aria-label={`Toggle ${name} submenu`}
              aria-expanded="false"
            >
              {icon && <IGRPIcon iconName={icon} />}
              <span>{name}</span>
              <IGRPIcon
                iconName="ChevronRight"
                className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90"
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
                  variant="collapsible"
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    </>
  );
}

interface SubMenuItemProps {
  menu: IGRPMenuItemArgs;
  variant: 'dropdown' | 'collapsible';
}

function SubMenuItem({ menu, variant }: SubMenuItemProps) {
  const { name, url, icon } = menu;
  const isExternal = url ? igrpIsExternalUrl(url) : false;
  const normalizedUrl = url ? igrpNormalizeUrl(url) : '';

  const iconElement = icon && variant === 'dropdown' && <IGRPIcon iconName={icon} />;

  const linkContent = (
    <>
      {iconElement}
      <span>{name}</span>
    </>
  );

  const linkProps = isExternal
    ? {
        href: normalizedUrl,
        target: '_blank' as const,
        rel: 'noopener noreferrer' as const,
        'aria-label': `${name} (opens in new tab)`,
      }
    : {
        href: normalizedUrl,
        'aria-label': name,
      };

  if (variant === 'dropdown') {
    return (
      <DropdownMenuItem
        asChild
        onSelect={(e) => e.preventDefault()}
        className="cursor-pointer px-2 py-2.5"
      >
        {isExternal ? (
          <a {...linkProps} className="w-full flex items-center">
            {linkContent}
          </a>
        ) : (
          <Link {...linkProps} className="w-full flex items-center">
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
