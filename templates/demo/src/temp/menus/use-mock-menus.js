import { IGRP_DEFAULT_MENU } from '@/temp/menus/menus';
export const getMockMenus = (appCode) => {
    console.log({ appCode });
    return {
        mockMenus: IGRP_DEFAULT_MENU,
    };
};
