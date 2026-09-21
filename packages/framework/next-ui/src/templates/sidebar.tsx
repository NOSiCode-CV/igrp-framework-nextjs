'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPSidebarDataArgs } from '@igrp/framework-next-types';

import { IGRPTemplateAppSwitcher } from './app-switcher.js';
import { IGRPTemplateMenus } from './menus.js';
import type { IGRPMenuLabels } from './menus.js';
import { IGRPTemplateNavUser, type IGRPNavUserLabels } from './nav-user.js';
import { IGRPSidebarError } from './sidebar-error.js';

interface IGRPTemplateSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data?: IGRPSidebarDataArgs;
  /** Partial override of the pt-PT menu strings. */
  menuLabels?: Partial<IGRPMenuLabels>;
  /** Partial override of the pt-PT nav-user strings. */
  navUserLabels?: Partial<IGRPNavUserLabels>;
}

function IGRPTemplateSidebar({
  data,
  menuLabels,
  navUserLabels,
  ...props
}: IGRPTemplateSidebarProps) {
  // Render the retry surface rather than throwing. A throw from a client
  // component's render escapes to the nearest error boundary and takes the
  // whole segment with it — for a sidebar whose data simply has not arrived,
  // that is a page-level failure for a pane-level problem. IGRPSidebarError
  // already exists for exactly this and offers a router refresh.
  if (!data) return <IGRPSidebarError />;

  const {
    // Optional, and defaulted here: SidebarDataProvider replaces it with
    // fetchMenus(appCode) whenever previewMode is false, so the authored value
    // only matters in preview / auth-bypass mode.
    menuItems = [],
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
      <SidebarHeader>
        {showAppSwitcher && (
          <IGRPTemplateAppSwitcher apps={apps} appCode={appCode} appCenterUrl={appCenterUrl} />
        )}
      </SidebarHeader>

      <SidebarContent>
        <IGRPTemplateMenus menus={menuItems} showSearch={showMenuSearch} labels={menuLabels} />
      </SidebarContent>

      <SidebarFooter>
        <IGRPTemplateNavUser
          user={user}
          showNotifications={showNotifications}
          labels={navUserLabels}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export { IGRPTemplateSidebar, type IGRPTemplateSidebarProps };
