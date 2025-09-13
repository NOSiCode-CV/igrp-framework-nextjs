'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  IGRPIcon,
  IGRPAlertPrimitive,
  IGRPAlertDescriptionPrimitive,
  IGRPCollapsiblePrimitive,
  IGRPCollapsibleContentPrimitive,
  IGRPCollapsibleTriggerPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPSidebarGroupPrimitive,
  IGRPSidebarGroupLabelPrimitive,
  IGRPSidebarGroupContentPrimitive,
  IGRPSidebarMenuPrimitive,
  IGRPSidebarMenuButtonPrimitive,
  IGRPSidebarMenuItemPrimitive,
  IGRPSidebarMenuSubPrimitive,
  IGRPSidebarMenuSubButtonPrimitive,
  IGRPSidebarMenuSubItemPrimitive,
  igrpIsExternalUrl,
  igrpNormalizeUrl,
} from '@igrp/igrp-framework-react-design-system';

type IGRPTemplateMenuArgs = {
  menus?: IGRPMenuItemArgs[];
};

export function IGRPTemplateMenus({ menus = [] }: IGRPTemplateMenuArgs) {
  console.log({ menus });

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

    let currentGroupKey: string | null = null;
    let currentFolderKey: string | null = null;

    const pushChild = (parentKey: string, item: IGRPMenuItemArgs) => {
      if (!childrenByParentKey.has(parentKey)) childrenByParentKey.set(parentKey, []);
      childrenByParentKey.get(parentKey)!.push(item);
    };

    (menuData as any[]).forEach((raw) => {
      const item = raw as IGRPMenuItemArgs & { type: string; parentCode?: string | null };

      if (item.type === 'GROUP') {
        groups.push(item);
        currentGroupKey = keyOf(item);
        currentFolderKey = null;
        return;
      }

      if (item.type === 'FOLDER') {
        const parentKey = (item.parentCode as any) ?? currentGroupKey ?? 'root';
        pushChild(String(parentKey), item);
        currentFolderKey = keyOf(item);
        return;
      }

      // SYSTEM_PAGE (or others)
      const parentKey = (item.parentCode as any) ?? currentFolderKey ?? currentGroupKey ?? 'root';
      pushChild(String(parentKey), item);
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
      <IGRPAlertPrimitive variant="destructive">
        <IGRPIcon iconName="CircleAlert" />
        <IGRPAlertDescriptionPrimitive>
          O modo de protótipo não está habilitado e nenhum código de aplicação válido foi
          encontrado.
        </IGRPAlertDescriptionPrimitive>
      </IGRPAlertPrimitive>
    );
  }

  if (menuData.length === 0) {
    return (
      <IGRPAlertPrimitive variant="default">
        <IGRPIcon iconName="Info" />
        <IGRPAlertDescriptionPrimitive>Aplicação não tem menu.</IGRPAlertDescriptionPrimitive>
      </IGRPAlertPrimitive>
    );
  }

  const sections = groups.length > 0 ? groups : [];

  console.log({ sections });

  return (
    <>
      {sections.length > 0 ? (
        sections.map((section) => {
          const sectionKey = keyOf(section as any);
          const sectionLabel = section.name;
          const topLevel = getChildren(sectionKey);

          return (
            <IGRPSidebarGroupPrimitive key={`grp-${sectionKey}`}>
              <IGRPSidebarGroupLabelPrimitive>{sectionLabel}</IGRPSidebarGroupLabelPrimitive>
              <IGRPSidebarGroupContentPrimitive>
                <IGRPSidebarMenuPrimitive role="navigation">
                  {topLevel.map((menu) => (
                    <MenuItemWithSubmenus
                      key={`menu-${menu.id}`}
                      menu={menu}
                      pathname={pathname}
                      childMenus={getChildren(keyOf(menu as any))}
                    />
                  ))}
                </IGRPSidebarMenuPrimitive>
              </IGRPSidebarGroupContentPrimitive>
            </IGRPSidebarGroupPrimitive>
          );
        })
      ) : (
        <IGRPSidebarGroupPrimitive key="grp-root">
          {/* no label for root */}
          <IGRPSidebarGroupContentPrimitive>
            <IGRPSidebarMenuPrimitive role="navigation">
              {getChildren('root').map((menu) => (
                <MenuItemWithSubmenus
                  key={`menu-${menu.id}`}
                  menu={menu}
                  pathname={pathname}
                  childMenus={getChildren(keyOf(menu as any))}
                />
              ))}
            </IGRPSidebarMenuPrimitive>
          </IGRPSidebarGroupContentPrimitive>
        </IGRPSidebarGroupPrimitive>
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
  const { id, name, url, icon } = menu as any;
  const pageSlug = (menu as any).pageSlug as string | undefined;
  const rawUrl = url ?? (pageSlug ? `/${pageSlug}` : '');
  const isExternal = rawUrl ? igrpIsExternalUrl(rawUrl) : false;
  const normalizedUrl = rawUrl ? igrpNormalizeUrl(rawUrl) : '';

  const isActive =
    !!normalizedUrl && (pathname === normalizedUrl || pathname.startsWith(normalizedUrl));
  const hasChildren = childMenus.length > 0;

  if (!hasChildren) {
    return (
      <IGRPSidebarMenuItemPrimitive>
        <IGRPSidebarMenuButtonPrimitive asChild tooltip={name} isActive={isActive}>
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
            <Link href={normalizedUrl || '#'} aria-label={name}>
              {icon && <IGRPIcon iconName={icon} />}
              <span>{name}</span>
            </Link>
          )}
        </IGRPSidebarMenuButtonPrimitive>
      </IGRPSidebarMenuItemPrimitive>
    );
  }

  return (
    <>
      {/* Dropdown for collapsed sidebar */}
      <IGRPSidebarMenuItemPrimitive className="group">
        <IGRPDropdownMenuPrimitive>
          <IGRPDropdownMenuTriggerPrimitive asChild>
            <IGRPSidebarMenuButtonPrimitive
              tooltip={name}
              className="hidden cursor-pointer group-data-[collapsible=icon]:flex"
              aria-label={`${name} menu`}
            >
              {icon && <IGRPIcon iconName={icon} />}
            </IGRPSidebarMenuButtonPrimitive>
          </IGRPDropdownMenuTriggerPrimitive>
          <IGRPDropdownMenuContentPrimitive side="right" align="start" className="min-w-48">
            {childMenus.map((subMenu) => (
              <SubMenuItem key={`dropdown-${id}-${subMenu.id}`} menu={subMenu} variant="dropdown" />
            ))}
          </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
      </IGRPSidebarMenuItemPrimitive>

      {/* Collapsible for expanded sidebar */}
      <IGRPSidebarMenuItemPrimitive>
        <IGRPCollapsiblePrimitive className="w-full group">
          <IGRPCollapsibleTriggerPrimitive
            className="flex w-full group-data-[collapsible=icon]:hidden"
            asChild
          >
            <IGRPSidebarMenuButtonPrimitive
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
            </IGRPSidebarMenuButtonPrimitive>
          </IGRPCollapsibleTriggerPrimitive>
          <IGRPCollapsibleContentPrimitive>
            <IGRPSidebarMenuSubPrimitive>
              {childMenus.map((subMenu) => (
                <SubMenuItem
                  key={`collapse-${id}-${subMenu.id}`}
                  menu={subMenu}
                  variant="collapsible"
                />
              ))}
            </IGRPSidebarMenuSubPrimitive>
          </IGRPCollapsibleContentPrimitive>
        </IGRPCollapsiblePrimitive>
      </IGRPSidebarMenuItemPrimitive>
    </>
  );
}

interface SubMenuItemProps {
  menu: IGRPMenuItemArgs;
  variant: 'dropdown' | 'collapsible';
}

function SubMenuItem({ menu, variant }: SubMenuItemProps) {
  const { name, url, icon } = menu as any;
  const pageSlug = (menu as any).pageSlug as string | undefined;
  const rawUrl = url ?? (pageSlug ? `/${pageSlug}` : '');
  const isExternal = rawUrl ? igrpIsExternalUrl(rawUrl) : false;
  const normalizedUrl = rawUrl ? igrpNormalizeUrl(rawUrl) : '';

  const iconElement = icon && variant === 'dropdown' && <IGRPIcon iconName={icon} />;

  const content = (
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
        href: normalizedUrl || '#',
        'aria-label': name,
      };

  if (variant === 'dropdown') {
    return (
      <IGRPDropdownMenuItemPrimitive
        asChild
        onSelect={(e) => e.preventDefault()}
        className="cursor-pointer px-2 py-2.5"
      >
        {isExternal ? (
          <a {...linkProps} className="w-full flex items-center">
            {content}
          </a>
        ) : (
          <Link {...linkProps} className="w-full flex items-center">
            {content}
          </Link>
        )}
      </IGRPDropdownMenuItemPrimitive>
    );
  }

  return (
    <IGRPSidebarMenuSubItemPrimitive>
      <IGRPSidebarMenuSubButtonPrimitive asChild>
        {isExternal ? <a {...linkProps}>{content}</a> : <Link {...linkProps}>{content}</Link>}
      </IGRPSidebarMenuSubButtonPrimitive>
    </IGRPSidebarMenuSubItemPrimitive>
  );
}

export type { IGRPTemplateMenuArgs };
