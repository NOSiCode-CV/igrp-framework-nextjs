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

  const _mockAcessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJPZGlURXFBa2tqTE9pNjR5S0hQOEc2aHBzN19qcDRSRTlSdnVIemQ1RElFIn0.eyJleHAiOjE3NTIwODkwNzQsImlhdCI6MTc1MjA2MDI3NCwiYXV0aF90aW1lIjoxNzUyMDYwMjcwLCJqdGkiOiJvbnJ0YWM6NDZkODM2M2EtYjI4Yy00NGY2LWI0ZTYtMzhkODA3MmJmOGVmIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy1zdGFnZS5pbnNzLmd3L3JlYWxtcy9pZ3JwIiwic3ViIjoiYTY2N2Y2MjctNTYwMi00YWMyLTRhYzItMWZiNjA3MmM3MWM4IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYWNjZXNzLW1hbmFnZW1lbnQiLCJzaWQiOiI2ZWJiYjY0YS05YzE5LTRiOGYtODg0Yi0wYWVjNGE2NWViYzMiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vYXBwcy1zdGFnZS5pbnNzLmd3IiwiaHR0cDovL2xvY2FsaG9zdDozMDAwIl0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6ImlHUlAgU3VwZXIgQWRtaW4iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzdXBlcmFkbWluIiwiZ2l2ZW5fbmFtZSI6ImlHUlAgU3VwZXIiLCJmYW1pbHlfbmFtZSI6IkFkbWluIiwiZW1haWwiOiJzdXBlcmFkbWluQGlncnAuY3YifQ.WADC6kLW73zpQZSY93kzlg_8uukwjpR1cTAJUHoIda9mlbQ1euh4bVD9TqPqq2cv6Yqdr6Z9nKuw4a1Um7gc-n58hjb0GW0wFcIPsOmIbh9fipPAtnuUk2OFWlDTag3E2r8f4SNjkeK6Tt368J3HtLdu0QLlMas9B683cK00LQ-Lw_qRM0lahSxOit9ENJc7mf0E4shdcW9sapCLBgz3z0rBiiu6U8rK1UlT7WWyfjsc0yDVh9bfer-u34gl_RS3uxONGlMHtfelGYSJozeKZQqaNMPac3XFpbX1-Anm8MmY0JEnm1DwXcbKYEA89WBBYVgAKgJkIIgnvVlBYCjFzg'


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

  console.log({ headerData, sidebarData });

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
