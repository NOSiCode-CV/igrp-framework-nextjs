'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPSidebarDataArgs } from '@igrp/framework-next-types';

import { IGRPTemplateAppSwitcher } from './app-switcher';
import { IGRPTemplateMenus } from './menus';
import { IGRPTemplateNavUser } from './nav-user';

interface IGRPTemplateSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data?: IGRPSidebarDataArgs;
  baseUrl?: string;
}

function IGRPTemplateSidebar({ data, baseUrl, ...props }: IGRPTemplateSidebarProps) {
  if (!data) throw new Error('Dados de Sidebar é obrigatorio.');

  const { menuItems, user, showAppSwitcher, apps, appCode, appCenterUrl } = data;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {showAppSwitcher && (
          <IGRPTemplateAppSwitcher apps={apps} appCode={appCode} appCenterUrl={appCenterUrl} />
        )}
      </SidebarHeader>

      <SidebarContent>
        <IGRPTemplateMenus menus={menuItems} />
      </SidebarContent>

      <SidebarFooter>
        <IGRPTemplateNavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export { IGRPTemplateSidebar, type IGRPTemplateSidebarProps };
