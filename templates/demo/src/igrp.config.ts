import { buildConfig, IGRPLayoutConfig } from "@igrp/framework-next";
import { igrpMockDataProvider } from "@/lib/mock-provider";
import { fontVariables } from "@/lib/fonts";


export function createConfig(config: IGRPLayoutConfig) {
  return buildConfig({
    appCode: process.env.IGRP_APP_CODE || 'demoTestFDL',
    previewMode: process.env.IGRP_PREVIEW_MODE === 'true',
    layoutMockData: igrpMockDataProvider,
    font: fontVariables,
    showSidebar: true,
    showHeader: true,
    defaultOpen: true,
    showLanguageSelector: true,
    layout: {
      ...config,
    },
  });
}
