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

function IGRPTemplateMenus({ menus = [] }: IGRPTemplateMenuArgs) {
  const pathname = usePathname();

  const menuData = useMemo(() => (menus.length > 0 ? menus : undefined), [menus]);

  console.log({ menuData });

  const { groups, childrenByParentCode } = useMemo(() => {
    if (!menuData) return { groups: [], childrenByParentCode: new Map<string, IGRPMenuItemArgs[]>() };

  console.log({ groups, childrenByParentCode })

    // Index children by parentCode
    const map = new Map<string, IGRPMenuItemArgs[]>();
    menuData.forEach((item) => {
      const parentCode = (item as any).parentCode ?? null;
      if (parentCode) {
        if (!map.has(parentCode)) map.set(parentCode, []);
        map.get(parentCode)!.push(item);
      }
    });
    // Sort children by position
    map.forEach((arr) => arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));

    // Groups are items with type === 'GROUP'
    const groupItems = menuData
      .filter((i: any) => i.type === 'GROUP')
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    return { groups: groupItems, childrenByParentCode: map };
  }, [menuData]);

  const getChildren = useCallback(
    (parentCode: string): IGRPMenuItemArgs[] => childrenByParentCode.get(parentCode) || [],
    [childrenByParentCode],
  );

  if (menuData === undefined) {
    return (
      <IGRPAlertPrimitive variant="destructive">
        <IGRPIcon iconName="CircleAlert" />
        <IGRPAlertDescriptionPrimitive>
          O modo de protótipo não está habilitado e nenhum código de aplicação válido foi encontrado.
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

  // Optional fallback: if there are no GROUP items, treat root-level (no parentCode) as a single section
  // const hasGroups = groups.length > 0;
  // const fallbackSection = !hasGroups
  //   ? [
  //       {
  //         code: '__FALLBACK__',
  //         name: 'Main',
  //       } as unknown as IGRPMenuItemArgs,
  //     ]
  //   : [];

  const sections = groups.length > 0 ? groups : [];

  return (
    <>
      {sections.map((section) => {
        const sectionCode = section.code;
        const sectionLabel = section.name;

        // Top-level entries inside this section are the children whose parentCode === section.code
        const topLevel = getChildren(sectionCode);

        return (
          <IGRPSidebarGroupPrimitive key={`grp-${sectionCode}`}>
            <IGRPSidebarGroupLabelPrimitive className='text-red-600'>{sectionLabel}</IGRPSidebarGroupLabelPrimitive>
            <IGRPSidebarGroupContentPrimitive>
              <IGRPSidebarMenuPrimitive role="navigation">
                {topLevel.map((menu) => (
                  <MenuItemWithSubmenus
                    key={`menu-${menu.id}`}
                    menu={menu}
                    pathname={pathname}
                    // Sub-children of each top-level item (e.g., FOLDER -> SYSTEM_PAGE)
                    childMenus={getChildren((menu as any).code)}
                  />
                ))}
              </IGRPSidebarMenuPrimitive>
            </IGRPSidebarGroupContentPrimitive>
          </IGRPSidebarGroupPrimitive>
        );
      })}
    </>
  );
}

interface MenuItemWithSubmenusProps {
  menu: IGRPMenuItemArgs;
  pathname: string;
  childMenus: IGRPMenuItemArgs[];
}

function MenuItemWithSubmenus({ menu, pathname, childMenus }: MenuItemWithSubmenusProps) {
  const { id, name, url, icon } = menu;
  const isActive = pathname === url || (!!url && pathname.startsWith(url));
  const hasChildren = childMenus.length > 0;

  // Prefer explicit url; fallback to pageSlug if present
  const pageSlug = (menu as any).pageSlug as string | undefined;
  const rawUrl = url ?? (pageSlug ? `/${pageSlug}` : '');
  const isExternal = rawUrl ? igrpIsExternalUrl(rawUrl) : false;
  const normalizedUrl = rawUrl ? igrpNormalizeUrl(rawUrl) : '';

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
            <Link href={normalizedUrl} aria-label={name}>
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
  const { name, url, icon } = menu;
  const pageSlug = (menu as any).pageSlug as string | undefined;
  const rawUrl = url ?? (pageSlug ? `/${pageSlug}` : '');
  const isExternal = rawUrl ? igrpIsExternalUrl(rawUrl) : false;
  const normalizedUrl = rawUrl ? igrpNormalizeUrl(rawUrl) : '';

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
      <IGRPDropdownMenuItemPrimitive
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
      </IGRPDropdownMenuItemPrimitive>
    );
  }

  return (
    <IGRPSidebarMenuSubItemPrimitive>
      <IGRPSidebarMenuSubButtonPrimitive asChild>
        {isExternal ? <a {...linkProps}>{linkContent}</a> : <Link {...linkProps}>{linkContent}</Link>}
      </IGRPSidebarMenuSubButtonPrimitive>
    </IGRPSidebarMenuSubItemPrimitive>
  );
}

export { IGRPTemplateMenus, type IGRPTemplateMenuArgs };
