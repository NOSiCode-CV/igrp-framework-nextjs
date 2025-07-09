import type { IGRPApplicationArgs, IGRPMenuItemArgs, IGRPUserArgs } from "./igrp";

export interface IGRPSidebarDataArgs {
  menuItems: IGRPMenuItemArgs[];
  defaultOpen?: boolean;
  user?: IGRPUserArgs;
  footerItems?: IGRPMenuItemArgs[];
  showAppSwitcher?: boolean;
  apps: IGRPApplicationArgs[];
  appCode?: number;
  showPreviewMode?: boolean;
  appCenterUrl: string;
}