'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IGRPIcon,
  IGRPSidebarPrimitive,
  IGRPSidebarContentPrimitive,
  IGRPSidebarFooterPrimitive, 
  IGRPSidebarHeaderPrimitive,
  IGRPSidebarMenuPrimitive,
  IGRPSidebarMenuButtonPrimitive,
  IGRPSidebarRailPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPSidebarDataArgs } from '@igrp/framework-next-types';

import { IGRPTemplateAppSwitcher } from './app-switcher';
import { IGRPTemplateMenus } from './menus';
import { IGRPTemplateNavUser } from './nav-user';

interface IGRPTemplateSidebarProps extends React.ComponentProps<typeof IGRPSidebarPrimitive> {
  data?: IGRPSidebarDataArgs;
}

function IGRPTemplateSidebar({ data, ...props }: IGRPTemplateSidebarProps) {
  if (!data) throw new Error('Sidebar data is required');

  const pathname = usePathname();
  const { footerItems, menuItems, user, showAppSwitcher, apps, appCode, appCenterUrl } = data;

  return (
    <IGRPSidebarPrimitive collapsible="icon" {...props} variant="sidebar">
      <IGRPSidebarHeaderPrimitive>
        {showAppSwitcher && (
          <IGRPTemplateAppSwitcher apps={apps} appCode={appCode} appCenterUrl={appCenterUrl} />
        )}
      </IGRPSidebarHeaderPrimitive>

      <IGRPSidebarContentPrimitive>        
        <IGRPTemplateMenus menus={menuItems} />          
      </IGRPSidebarContentPrimitive>

      <IGRPSidebarFooterPrimitive>
        <IGRPSidebarMenuPrimitive>
          {footerItems?.map(({ name, url, icon }, index) => (
            <IGRPSidebarMenuButtonPrimitive
              asChild
              isActive={pathname === url || (url !== '/' && pathname?.startsWith(url || ''))}
              tooltip={name}
              key={`footer-menu-${index}`}
            >
              <Link href={url || ''}>
                {icon && <IGRPIcon iconName={icon} />}
                <span>{name}</span>
              </Link>
            </IGRPSidebarMenuButtonPrimitive>
          ))}
        </IGRPSidebarMenuPrimitive>

        <IGRPTemplateNavUser user={user} />
      </IGRPSidebarFooterPrimitive>

      <IGRPSidebarRailPrimitive />
    </IGRPSidebarPrimitive>
  );
}

export { IGRPTemplateSidebar, type IGRPTemplateSidebarProps };
