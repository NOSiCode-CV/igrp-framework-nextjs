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

  const {
    menuItems,
    user,
    showAppSwitcher,
    apps,
    appCode,
    appCenterUrl,
    showMenuSearch,
    showNotifications,
  } = data;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex-row items-center gap-0">
        <SidebarTrigger className="shrink-0 group-data-[state=expanded]:order-2 group-data-[state=expanded]:ml-auto" />
        {showAppSwitcher && (
          <IGRPTemplateAppSwitcher apps={apps} appCode={appCode} appCenterUrl={appCenterUrl} />
        )}
      </SidebarHeader>

      <SidebarContent>
        <IGRPTemplateMenus menus={menuItems} showSearch={showMenuSearch} />
      </SidebarContent>

      <SidebarFooter>
        <IGRPTemplateNavUser user={user} showNotifications={showNotifications} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export { IGRPTemplateSidebar, type IGRPTemplateSidebarProps };
