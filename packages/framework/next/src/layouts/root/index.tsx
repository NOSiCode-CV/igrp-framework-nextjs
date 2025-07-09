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

  const _mockAcessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJPZGlURXFBa2tqTE9pNjR5S0hQOEc2aHBzN19qcDRSRTlSdnVIemQ1RElFIn0.eyJleHAiOjE3NTIwMDMyNjksImlhdCI6MTc1MTk3NDQ2OSwiYXV0aF90aW1lIjoxNzUxOTc0NDUxLCJqdGkiOiJvbnJ0YWM6OTQwOGM5MWYtMGQzMC00NDM3LTgwMzUtZDIyNGZkNWNiZGE5IiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy1zdGFnZS5pbnNzLmd3L3JlYWxtcy9pZ3JwIiwic3ViIjoiYTY2N2Y2MjctNTYwMi00YWMyLTRhYzItMWZiNjA3MmM3MWM4IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYWNjZXNzLW1hbmFnZW1lbnQiLCJzaWQiOiI5ZGUxMDQ2ZS1kMjYxLTQxMzctYjNmNy0yZjcyODAzNjkzNGMiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vYXBwcy1zdGFnZS5pbnNzLmd3IiwiaHR0cDovL2xvY2FsaG9zdDozMDAwIl0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6ImlHUlAgU3VwZXIgQWRtaW4iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzdXBlcmFkbWluIiwiZ2l2ZW5fbmFtZSI6ImlHUlAgU3VwZXIiLCJmYW1pbHlfbmFtZSI6IkFkbWluIiwiZW1haWwiOiJzdXBlcmFkbWluQGlncnAuY3YifQ.MfHi2Jp_H03omkg_bXDjZV4SAm-d6T703xG-Nqw1baLm5gD6BFXQQuVOk94eTRqF8Hr2IsZ8opvkMI8RoNE0FyIm2D8AmOIUF5wSVcxB-M6BOEv2rxhwTH-bvNabYqazFJ3epgAykb_4x7CEDlp6rZeFS0qkmcd1--iFIp323KMdwY8dHqlntK2YBynrVvo5oeWWVEAg9JeCMSPOmzIrXRgle8GonUmX7AiQxBLmxAlQfcPX0--koGjHmZcRR1Gz89XW4ekYPu2aLULoSuYFZCNBwY7LAHBNoyPlKRrv8ULtaoaJz6KGMInF4GFY825lcH6x9dm64tIo0AnB8lQarw'


  setAccessClientConfig({
    token: session?.accessToken || _mockAcessToken,
    baseUrl: apiManagementConfig?.baseUrl || '',
  });

  // DELETE CODE 

  const app = await fetchAppByCode(appCode);

  console.log(app);

  const appId = app?.[0]?.id;

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
