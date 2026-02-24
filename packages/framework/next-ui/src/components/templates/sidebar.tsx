'use client';

import {
  IGRPSidebarPrimitive,
  IGRPSidebarContentPrimitive,
  IGRPSidebarFooterPrimitive,
  IGRPSidebarHeaderPrimitive,
  IGRPSidebarRailPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPSidebarDataArgs } from '@igrp/framework-next-types';

import { IGRPTemplateAppSwitcher } from './app-switcher';
import { IGRPTemplateMenus } from './menus';
import { IGRPTemplateNavUser } from './nav-user';

interface IGRPTemplateSidebarProps extends React.ComponentProps<typeof IGRPSidebarPrimitive> {
  data?: IGRPSidebarDataArgs;
  baseUrl?: string;
}

function IGRPTemplateSidebar({ data, baseUrl, ...props }: IGRPTemplateSidebarProps) {
  if (!data) throw new Error('Dados de Sidebar é obrigatorio.');

  const { menuItems, user, showAppSwitcher, apps, appCode, appCenterUrl } = data;

  return (
    <IGRPSidebarPrimitive collapsible="icon" {...props}>
      <IGRPSidebarHeaderPrimitive>
        {showAppSwitcher && (
          <IGRPTemplateAppSwitcher apps={apps} appCode={appCode} appCenterUrl={appCenterUrl} />
        )}
      </IGRPSidebarHeaderPrimitive>

      <IGRPSidebarContentPrimitive>
        <IGRPTemplateMenus menus={menuItems} />
      </IGRPSidebarContentPrimitive>

      <IGRPSidebarFooterPrimitive>
        <IGRPTemplateNavUser user={user} />
      </IGRPSidebarFooterPrimitive>

      <IGRPSidebarRailPrimitive />
    </IGRPSidebarPrimitive>
  );
}

export { IGRPTemplateSidebar, type IGRPTemplateSidebarProps };
