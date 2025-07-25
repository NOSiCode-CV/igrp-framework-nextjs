import { IGRPRootProviders } from '@igrp/framework-next-design-system';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { setAccessClientConfig } from '../lib/api-config';
import { fetchAppByCode } from '../services/applications/use-applications';
import { fetchLayoutData } from '../services/layout/use-layout';
import { cn } from '../lib/utils';

type IGRPRootLocaleLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

export async function IGRPRootLayout({ children, config }: IGRPRootLocaleLayoutArgs) {
  const layoutConfig = config;

  const {
    appCode,
    previewMode,
    layoutMockData,
    font,
    showSidebar,
    showHeader,
    layout,
    apiManagementConfig,
    toasterConfig,
  } = layoutConfig;

  const { session, activeThemeValue, isScaled } = layout;

  console.log({ appCode, previewMode, showHeader, showSidebar });
  console.log({ session, activeThemeValue, isScaled });

  let app;
  let appId;

  if (!previewMode) {
    if (!apiManagementConfig || !apiManagementConfig.baseUrl) {
      throw new Error(
        'Preview Mode is not enabled, when not enabled, API Management config is required.',
      );
    }

    setAccessClientConfig({
      token: session?.accessToken || '',
      baseUrl: apiManagementConfig?.baseUrl || '',
    });

    app = await fetchAppByCode(appCode);
    appId = app?.id;
  }

  const { headerData, sidebarData } = await fetchLayoutData(
    layoutMockData.getHeaderData,
    layoutMockData.getSidebarData,
    previewMode,
    appId,
  );

  return (
    <html
      lang='pt'
      suppressHydrationWarning
      className={font}
    >
      <body
        className={cn(
          'bg-background overscroll-none h-screen font-sans antialiased',
          activeThemeValue && `theme-${activeThemeValue}`,
          isScaled && 'theme-scaled',
        )}
      >
        <IGRPRootProviders
          session={session}
          activeThemeValue={activeThemeValue}
          progressiveBarArgs={undefined}
          sessionArgs={undefined}
          themeArgs={undefined}
          defaultOpen={true}
          sidebarData={sidebarData}
          headerData={headerData}
          showSidebar={showSidebar}
          showHeader={showHeader}
          toasterConfig={toasterConfig}
        >
          {children}
        </IGRPRootProviders>
      </body>
    </html>
  );
}
