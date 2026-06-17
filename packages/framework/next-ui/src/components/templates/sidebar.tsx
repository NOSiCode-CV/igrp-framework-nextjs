import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
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

  const { menuItems, user, showAppSwitcher, apps, appCode, appCenterUrl, showMenuSearch } = data;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex-row items-center gap-0">
        {showAppSwitcher && (
          <IGRPTemplateAppSwitcher apps={apps} appCode={appCode} appCenterUrl={appCenterUrl} />
        )}
        <SidebarTrigger className="ml-auto shrink-0" />
      </SidebarHeader>

      <SidebarContent>
        <IGRPTemplateMenus menus={menuItems} showSearch={showMenuSearch} />
      </SidebarContent>

      <SidebarFooter>
        <IGRPTemplateNavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export { IGRPTemplateSidebar, type IGRPTemplateSidebarProps };
