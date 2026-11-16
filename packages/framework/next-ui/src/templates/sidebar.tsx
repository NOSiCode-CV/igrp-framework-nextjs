'use client';

import { createContext, use } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPSidebarDataArgs } from '@igrp/framework-next-types';

import { IGRPChromeI18nProvider, type IGRPChromeStringsOverrides } from '../i18n/context.js';
import { IGRPTemplateAppSwitcher } from './app-switcher.js';
import { IGRPTemplateMenus } from './menus.js';
import type { IGRPMenuLabels } from './menus.js';
import { IGRPTemplateNavUser, type IGRPNavUserLabels } from './nav-user.js';
import { IGRPSidebarError } from './sidebar-error.js';

const SidebarDataContext = createContext<IGRPSidebarDataArgs | undefined>(undefined);

/** The surrounding `IGRPSidebarDataProvider`'s data, or `undefined` outside one. */
export function useIGRPSidebarData(): IGRPSidebarDataArgs | undefined {
  return use(SidebarDataContext);
}

export interface IGRPSidebarLabelProps {
  /** Partial override of the chrome catalog's `menus` group. */
  menuLabels?: Partial<IGRPMenuLabels>;
  /** Partial override of the chrome catalog's `navUser` group. */
  navUserLabels?: Partial<IGRPNavUserLabels>;
}

export interface IGRPSidebarDataProviderProps extends IGRPSidebarLabelProps {
  /** Sidebar data; inherited from an enclosing provider when omitted. */
  data?: IGRPSidebarDataArgs;
  children: React.ReactNode;
}

/**
 * Supplies sidebar data to the `IGRPSidebar*` parts below it.
 * `IGRPLayoutSidebar` (in `@igrp/framework-next`) mounts it with the fetched data.
 */
export function IGRPSidebarDataProvider({
  data,
  menuLabels,
  navUserLabels,
  children,
}: IGRPSidebarDataProviderProps) {
  const parent = use(SidebarDataContext);
  const content = (
    <SidebarDataContext value={data ?? parent}>{children}</SidebarDataContext>
  );
  if (!menuLabels && !navUserLabels) return content;
  const overrides: IGRPChromeStringsOverrides = { menus: menuLabels, navUser: navUserLabels };
  return <IGRPChromeI18nProvider overrides={overrides}>{content}</IGRPChromeI18nProvider>;
}

// ── Parts ──────────────────────────────────────────────────────────────────
// Header / content / footer regions are the design system's `SidebarHeader`,
// `SidebarContent` and `SidebarFooter`: they need no data, so there are no
// framework copies of them.

/** The sidebar frame (icon-collapsible, with its rail). */
export function IGRPSidebarRoot({ children, ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      {children}
      <SidebarRail />
    </Sidebar>
  );
}

/** Application switcher, from the sidebar data's `apps`, `appCode` and `appCenterUrl`. */
export function IGRPSidebarAppSwitcher() {
  const data = useIGRPSidebarData();
  return (
    <IGRPTemplateAppSwitcher
      apps={data?.apps}
      appCode={data?.appCode}
      appCenterUrl={data?.appCenterUrl}
    />
  );
}

/** The menu tree. `showSearch` defaults to the data's `showMenuSearch`. */
export function IGRPSidebarMenus({ showSearch }: { showSearch?: boolean }) {
  const data = useIGRPSidebarData();
  return (
    <IGRPTemplateMenus
      menus={data?.menuItems ?? []}
      showSearch={showSearch ?? data?.showMenuSearch}
    />
  );
}

/** The user menu, with the sidebar data's user and URLs. */
export function IGRPSidebarUser({
  items,
  showNotifications,
}: {
  /** Extra menu entries (`IGRPNavUserItem`), before sign-out. */
  items?: React.ReactNode;
  /** Show the menu's Notifications entry. Defaults to the data's `showNotifications`. */
  showNotifications?: boolean;
}) {
  const data = useIGRPSidebarData();
  return (
    <IGRPTemplateNavUser
      variant="sidebar"
      user={data?.user}
      profileUrl={data?.profileUrl || undefined}
      notificationsUrl={data?.notificationsUrl || undefined}
      settingsUrl={data?.settingsUrl || undefined}
      logoutUrl={data?.logoutUrl || undefined}
      showNotifications={showNotifications ?? data?.showNotifications}
      items={items}
    />
  );
}

interface IGRPTemplateSidebarProps
  extends React.ComponentProps<typeof Sidebar>, IGRPSidebarLabelProps {
  /** Sidebar data. Optional inside `IGRPSidebarDataProvider`, whose data is used. */
  data?: IGRPSidebarDataArgs;
}

/**
 * The framework sidebar: the default composition of the `IGRPSidebar*` parts.
 * For a custom layout, compose the parts inside `IGRPSidebarDataProvider`, or
 * pass them as `children` of `IGRPLayoutSidebar`.
 */
function IGRPTemplateSidebar({
  data: dataProp,
  menuLabels,
  navUserLabels,
  ...props
}: IGRPTemplateSidebarProps) {
  const inherited = useIGRPSidebarData();
  const data = dataProp ?? inherited;
  // Render the retry surface rather than throwing. A throw from a client
  // component's render escapes to the nearest error boundary and takes the
  // whole segment with it — for a sidebar whose data simply has not arrived,
  // that is a page-level failure for a pane-level problem. IGRPSidebarError
  // already exists for exactly this and offers a router refresh.
  if (!data) return <IGRPSidebarError />;

  return (
    <IGRPSidebarDataProvider data={data} menuLabels={menuLabels} navUserLabels={navUserLabels}>
      <IGRPSidebarRoot {...props}>
        <SidebarHeader>{data.showAppSwitcher && <IGRPSidebarAppSwitcher />}</SidebarHeader>
        <SidebarContent>
          <IGRPSidebarMenus />
        </SidebarContent>
        <SidebarFooter>
          <IGRPSidebarUser />
        </SidebarFooter>
      </IGRPSidebarRoot>
    </IGRPSidebarDataProvider>
  );
}

export { IGRPTemplateSidebar, type IGRPTemplateSidebarProps };
