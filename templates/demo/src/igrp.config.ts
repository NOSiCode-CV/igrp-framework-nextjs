import { buildConfig } from "@igrp/framework-next";
import { IGRPLayoutConfigArgs } from '@igrp/framework-next-types';
import { igrpMockDataProvider } from "@/lib/mock-provider";
import { fontVariables } from "@/lib/fonts";


export function createConfig(config: IGRPLayoutConfigArgs) {
  return buildConfig({
    appCode: process.env.IGRP_APP_CODE || 'demoTestFDL',
    previewMode: process.env.IGRP_PREVIEW_MODE === 'true' ? true : false,
    layoutMockData: igrpMockDataProvider,
    font: fontVariables,
    showSidebar: true,
    showHeader: true,
    showLanguageSelector: true,
    layout: {
      ...config,
    },
  });
}