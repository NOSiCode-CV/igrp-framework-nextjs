import { IGRP_DEFAULT_MENU } from './menus';

export const getMockMenus = (appCode?: string) => {
  console.log({ appCode });
  return {
    mockMenus: IGRP_DEFAULT_MENU,
  };
};
