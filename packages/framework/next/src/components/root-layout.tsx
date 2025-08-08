import { Suspense } from 'react';
import { IGRPNestedProviders, IGRPRootProviders } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { setAccessClientConfig } from '../lib/api-config';
import { cn } from '../lib/utils';
import { fetchAppByCode } from '../services/applications/use-applications';
import { fetchLayoutData } from '../services/layout/use-layout';

type IGRPRootLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

export async function IGRPRootLayout({ children, config }: IGRPRootLayoutArgs) {
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

  let app;

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
  }

  const { headerData, sidebarData } = await fetchLayoutData(
    layoutMockData.getHeaderData,
    layoutMockData.getSidebarData,
    previewMode,
    appCode,
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
        <Suspense fallback={<div>Loading API Data...</div>}>
          <IGRPNestedProviders
            session={session}
            activeThemeValue={activeThemeValue}
            progressiveBarArgs={undefined}
            sessionArgs={undefined}
            themeArgs={undefined}
          >
            <IGRPRootProviders
              defaultOpen={true}
              sidebarData={sidebarData}
              headerData={headerData}
              showSidebar={showSidebar}
              showHeader={showHeader}
              toasterConfig={toasterConfig}
            >
              {children}
            </IGRPRootProviders>
          </IGRPNestedProviders>
        </Suspense>
      </body>
    </html>
  );
}
