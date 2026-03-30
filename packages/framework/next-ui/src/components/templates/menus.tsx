'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPIcon,
  Alert,
  AlertDescription,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  igrpIsExternalUrl,
  igrpNormalizeUrl,
} from '@igrp/igrp-framework-react-design-system';

type IGRPTemplateMenuArgs = {
  menus?: IGRPMenuItemArgs[];
};

export function IGRPTemplateMenus({ menus = [] }: IGRPTemplateMenuArgs) {
  const pathname = usePathname();
  const menuData = useMemo(() => (menus.length > 0 ? menus : undefined), [menus]);

  const { groups, childrenByParentKey, keyOf } = useMemo(() => {
    if (!menuData) {
      return {
        groups: [] as IGRPMenuItemArgs[],
        childrenByParentKey: new Map<string, IGRPMenuItemArgs[]>(),
        keyOf: (_: any) => '__none__',
      };
    }

    const keyOf = (item: any) => (item.code && String(item.code)) || `${item.type}-${item.id}`;

    const groups: IGRPMenuItemArgs[] = [];
    const childrenByParentKey = new Map<string, IGRPMenuItemArgs[]>();

    // Build a set of valid parent codes (codes that exist in the menu data)
    const validParentCodes = new Set<string>();
    (menuData as any[]).forEach((item) => {
      const code = item.code;
      if (code) {
        validParentCodes.add(String(code));
      }
    });

    const pushChild = (parentKey: string, item: IGRPMenuItemArgs) => {
      if (!childrenByParentKey.has(parentKey)) childrenByParentKey.set(parentKey, []);
      childrenByParentKey.get(parentKey)!.push(item);
    };

    // Helper to validate and resolve parent key
    const resolveParentKey = (
      item: IGRPMenuItemArgs & { type: string; parentCode?: string | null },
      fallbackKey: string | null,
    ): string => {
      const itemKey = keyOf(item);
      const parentCode = item.parentCode;

      // If parentCode is null or undefined, use fallback
      if (!parentCode) {
        return fallbackKey ?? 'root';
      }

      const parentCodeStr = String(parentCode);

      // If parentCode is the item's own code (circular reference), use fallback
      if (parentCodeStr === itemKey) {
        return fallbackKey ?? 'root';
      }

      // If parentCode doesn't exist in valid codes, use fallback
      if (!validParentCodes.has(parentCodeStr)) {
        return fallbackKey ?? 'root';
      }

      return parentCodeStr;
    };

    let currentGroupKey: string | null = null;
    let currentFolderKey: string | null = null;

    (menuData as any[]).forEach((raw) => {
      const item = raw as IGRPMenuItemArgs & { type: string; parentCode?: string | null };

      if (item.type === 'GROUP') {
        groups.push(item);
        currentGroupKey = keyOf(item);
        currentFolderKey = null;
        return;
      }

      if (item.type === 'FOLDER') {
        const parentKey = resolveParentKey(item, currentGroupKey);
        pushChild(parentKey, item);
        currentFolderKey = keyOf(item);
        return;
      }

      // MENU_PAGE, EXTERNAL_PAGE, SYSTEM_PAGE (or others)
      const parentKey = resolveParentKey(item, currentFolderKey ?? currentGroupKey);
      pushChild(parentKey, item);
    });

    groups.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
    childrenByParentKey.forEach((arr) =>
      arr.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)),
    );

    return { groups, childrenByParentKey, keyOf };
  }, [menuData]);

  const getChildren = useCallback(
    (parentKey: string) => childrenByParentKey.get(parentKey) || [],
    [childrenByParentKey],
  );

  if (menuData === undefined) {
    return (
      <Alert variant="destructive">
        <IGRPIcon iconName="CircleAlert" />
        <AlertDescription>Applicação sem menus.</AlertDescription>
      </Alert>
    );
  }

  if (menuData.length === 0) {
    return (
      <Alert variant="default">
        <IGRPIcon iconName="Info" />
        <AlertDescription>Aplicação não tem menu.</AlertDescription>
      </Alert>
    );
  }

  const sections = groups.length > 0 ? groups : [];

  return (
    <>
      {sections.length > 0 ? (
        sections.map((section) => {
          const sectionKey = keyOf(section as any);
          const sectionLabel = section.name;
          const topLevel = getChildren(sectionKey);

          return (
            <SidebarGroup key={`grp-${sectionKey}`}>
              <SidebarGroupLabel>{sectionLabel}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu role="navigation">
                  {topLevel.map((menu) => (
                    <MenuItemWithSubmenus
                      key={`menu-${menu.id}`}
                      menu={menu}
                      pathname={pathname}
                      childMenus={getChildren(keyOf(menu as any))}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })
      ) : (
        <SidebarGroup key="grp-root">
          {/* no label for root */}
          <SidebarGroupContent>
            <SidebarMenu role="navigation">
              {getChildren('root').map((menu) => (
                <MenuItemWithSubmenus
                  key={`menu-${menu.id}`}
                  menu={menu}
                  pathname={pathname}
                  childMenus={getChildren(keyOf(menu as any))}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}

interface MenuItemWithSubmenusProps {
  menu: IGRPMenuItemArgs;
  pathname: string;
  childMenus: IGRPMenuItemArgs[];
}

function MenuItemWithSubmenus({ menu, pathname, childMenus }: MenuItemWithSubmenusProps) {
  const { id, name, url, icon, target } = menu as any;
  const pageSlug = (menu as any).pageSlug as string | undefined;

  // pageSlug is for Next.js internal routing - use Link if _self, <a> if _blank
  // url is for full path - respect target field
  const hasPageSlug = !!pageSlug;
  const normalizedHref = pageSlug
    ? pageSlug.startsWith('/')
      ? pageSlug
      : `/${pageSlug}`
    : url
      ? igrpNormalizeUrl(url)
      : '#';

  // Check if url is external (only relevant when no pageSlug)
  const isExternalUrl = !hasPageSlug && url ? igrpIsExternalUrl(url) : false;

  // Use <a> tag if:
  // 1. External URL (http/https)
  // 2. target is _blank (for both pageSlug and url)
  // Otherwise use Next.js Link component
  const useAnchorTag = isExternalUrl || target === '_blank';

  const isActive =
    !useAnchorTag &&
    !!normalizedHref &&
    normalizedHref !== '#' &&
    (pathname === normalizedHref || pathname.startsWith(normalizedHref));
  const hasChildren = childMenus.length > 0;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={name} isActive={isActive}>
          {useAnchorTag ? (
            <a
              href={normalizedHref}
              target={target || '_blank'}
              rel={target === '_blank' ? 'noopener noreferrer' : undefined}
              aria-label={target === '_blank' ? `${name} (opens in new tab)` : name}
            >
              {icon && <IGRPIcon iconName={icon} />}
              <span>{name}</span>
            </a>
          ) : (
            <Link href={normalizedHref || '#'} aria-label={name}>
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
      <SidebarMenuItem className={cn('group')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={name}
              className={cn('hidden cursor-pointer group-data-[collapsible=icon]:flex')}
              aria-label={`${name} menu`}
            >
              {icon && <IGRPIcon iconName={icon} />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className={cn('min-w-48')}>
            {childMenus.map((subMenu) => (
              <SubMenuItem key={`dropdown-${id}-${subMenu.id}`} menu={subMenu} variant="dropdown" />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Collapsible for expanded sidebar */}
      <SidebarMenuItem>
        <Collapsible className={cn('w-full group')}>
          <CollapsibleTrigger
            className={cn('flex w-full group-data-[collapsible=icon]:hidden')}
            asChild
          >
            <SidebarMenuButton
              tooltip={name}
              className={cn('w-full cursor-pointer')}
              aria-label={`Toggle ${name} submenu`}
              aria-expanded="false"
            >
              {icon && <IGRPIcon iconName={icon} />}
              <span>{name}</span>
              <IGRPIcon
                iconName="ChevronRight"
                className={cn(
                  'ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90',
                )}
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
  const { name, url, icon, target } = menu as any;
  const pageSlug = (menu as any).pageSlug as string | undefined;

  // pageSlug is for Next.js internal routing - use Link if _self, <a> if _blank
  // url is for full path - respect target field
  const hasPageSlug = !!pageSlug;
  const normalizedHref = pageSlug
    ? pageSlug.startsWith('/')
      ? pageSlug
      : `/${pageSlug}`
    : url
      ? igrpNormalizeUrl(url)
      : '#';

  // Check if url is external (only relevant when no pageSlug)
  const isExternalUrl = !hasPageSlug && url ? igrpIsExternalUrl(url) : false;

  // Use <a> tag if:
  // 1. External URL (http/https)
  // 2. target is _blank (for both pageSlug and url)
  // Otherwise use Next.js Link component
  const useAnchorTag = isExternalUrl || target === '_blank';

  // Show icons in both dropdown and collapsible variants
  const iconElement = icon && <IGRPIcon iconName={icon} className={cn('h-4 w-4 shrink-0')} />;

  const content = (
    <>
      {iconElement}
      <span className={cn(variant === 'dropdown' ? 'truncate' : '')}>{name}</span>
    </>
  );

  const linkProps = useAnchorTag
    ? {
        href: normalizedHref,
        target: target || '_blank',
        ...(target === '_blank' && { rel: 'noopener noreferrer' }),
        'aria-label': target === '_blank' ? `${name} (opens in new tab)` : name,
        title: name, // Add title for tooltip on hover when text is truncated
      }
    : {
        href: normalizedHref || '#',
        'aria-label': name,
        title: name, // Add title for tooltip on hover when text is truncated
      };

  if (variant === 'dropdown') {
    return (
      <DropdownMenuItem
        asChild
        onSelect={(e) => e.preventDefault()}
        className={cn('cursor-pointer px-2 py-2.5')}
      >
        {useAnchorTag ? (
          <a {...linkProps} className={cn('w-full flex items-center gap-2 min-w-0')}>
            {content}
          </a>
        ) : (
          <Link {...linkProps} className={cn('w-full flex items-center gap-2 min-w-0')}>
            {content}
          </Link>
        )}
      </DropdownMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        {useAnchorTag ? (
          <a {...linkProps} className={cn('flex items-center gap-2')}>
            {content}
          </a>
        ) : (
          <Link {...linkProps} className={cn('flex items-center gap-2')}>
            {content}
          </Link>
        )}
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

export type { IGRPTemplateMenuArgs };
