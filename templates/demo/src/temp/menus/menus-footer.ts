import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";

export const IGRP_DEFAULT_MENU_FOOTER: IGRPMenuItemArgs[] = [
  {
    id: 102025,
    name: "Settings",
    type: "MENU_PAGE",
    position: 0,
    icon: "Settings2",
    status: "ACTIVE",
    url: "/system-settings",
    application: {
      code: "APP_IGRP_CENTER",
      description: "Application IGRP Center",
    },
    code: "MENU_IGRP_SETTINGS",
    roles: [],
  },
];
