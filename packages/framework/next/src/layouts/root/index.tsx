import { IGRPRootProviders, } from '@igrp/framework-next-ui';

import { setAccessClientConfig } from '../../lib/api-config';
import { cn } from '../../lib/utils';
import type { IGRPConfigArgs } from '../../types';
import { fetchAppByCode } from '../../services/applications/use-applications';
import { fetchLayoutData } from '../../services/layout/use-layout';


type IGRPRootLocaleLayoutArgs = {
  readonly children: React.ReactNode;
  languageSelector?: React.ReactNode;
  readonly config: Promise<IGRPConfigArgs>;
};


export async function IGRPRootLayout({
  children,
  languageSelector,
  config
}: IGRPRootLocaleLayoutArgs) {

  const layoutConfig = await config;

  const {
    appCode,
    previewMode,
    layoutMockData,
    font,
    showSidebar,
    showHeader,    
    layout,
    apiManagementConfig
  } = layoutConfig;

  const {
    locale,
    session,
    activeThemeValue,
    isScaled,
    messages,
  } = layout;
  
  let app;
  let appId;

  if (!previewMode) {
    setAccessClientConfig({
      token: session?.accessToken || '',
      baseUrl: apiManagementConfig?.baseUrl || '',
    });

    app = await fetchAppByCode(appCode);
    appId = app?.[0]?.id;
  }  

  const { headerData, sidebarData } = await fetchLayoutData(
    layoutMockData.getHeaderData,
    layoutMockData.getSidebarData,
    previewMode,
    appId
  );  

  return (
    <html
      lang={locale}
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
          languageSelector={languageSelector}
          sidebarData={sidebarData}
          headerData={headerData}
          locale={locale}
          messages={messages}
          showSidebar={showSidebar}
          showHeader={showHeader}
        >
          {children}
        </IGRPRootProviders>
      </body>
    </html>
  );
}
