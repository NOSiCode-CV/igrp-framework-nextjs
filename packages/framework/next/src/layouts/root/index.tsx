import { IGRPRootProviders, } from '@igrp/framework-next-ui';

import { cn } from '../../lib/utils';
import { mapHeaderData } from '../../services/header/mapper';
import { mapSidebarData } from '../../services/sidebar/mapper';
import type { IGRPHeaderDataArgs, IGRPConfigArgs, IGRPSidebarDataArgs } from '@igrp/framework-next-types';


type IGRPRootLocaleLayoutArgs = {
  readonly children: React.ReactNode;
  // readonly serverFunction: IGRPConfigClient;  
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
    showLanguageSelector,
    layout,
  } = layoutConfig;

  const {
    locale,
    session,
    activeThemeValue,
    isScaled,
    messages,
  } = layout;

  let headerData: IGRPHeaderDataArgs | undefined;
  let sidebarData: IGRPSidebarDataArgs | undefined;

  if (layoutMockData) {
    headerData = await mapHeaderData(layoutMockData.getHeaderData);
    sidebarData = await mapSidebarData(layoutMockData.getSidebarData);
  }

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
          showLanguageSelector={showLanguageSelector}
        >
          {children}
        </IGRPRootProviders>
      </body>
    </html>
  );
}
