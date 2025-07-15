import { IGRP_DEFAULT_MENU_FOOTER } from './menus-footer';
export const getMockMenusFooter = (appCode) => {
    console.log({ appCode });
    return {
        mockMenusFooter: IGRP_DEFAULT_MENU_FOOTER,
    };
};
