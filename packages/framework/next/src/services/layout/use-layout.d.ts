import type { IGRPHeaderDataArgs, IGRPSidebarDataArgs } from '@igrp/framework-next-types';
export declare function fetchLayoutData(getHeaderData: () => Promise<IGRPHeaderDataArgs>, getSidebarData: () => Promise<IGRPSidebarDataArgs>, previewMode: boolean, appCode: number | undefined): Promise<{
    headerData: IGRPHeaderDataArgs;
    sidebarData: IGRPSidebarDataArgs;
}>;
