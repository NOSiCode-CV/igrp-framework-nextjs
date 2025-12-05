import { IGRPNestedProviders } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { igrpStartupSync } from '../lib/startup-sync';

export type IGRPRootLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

export async function IGRPRootLayout({ children, config }: IGRPRootLayoutArgs) {
  const layoutConfig = config;
  const {
    font,
    layout,
    sessionArgs,
    syncAccess,
    appInformation,
    apiManagementConfig,
    appCode,
    layoutMockData,
  } = layoutConfig;

  const { session, activeThemeValue, isScaled } = layout;

  const sidebarData = await layoutMockData.getSidebarData();

  await igrpStartupSync({
    syncEnabled: syncAccess,
    appInformation,
    baseUrl: apiManagementConfig?.baseUrl || '',
    appCode,
    menus: sidebarData.menuItems || [],
    m2mServiceId: apiManagementConfig?.m2mServiceId || '',
    m2mToken: apiManagementConfig?.m2mToken || '',
    appRoutesContent: apiManagementConfig?.appRoutesContent,
    appRoutesMatch: apiManagementConfig?.appRoutesMatch,
  });

  return (
    <html lang="pt" suppressHydrationWarning className={font}>
      <body
        className={`bg-background overscroll-none h-screen font-sans antialiased 
          ${activeThemeValue ? ` theme-${activeThemeValue}` : ''} 
          ${isScaled ? ' theme-scaled' : ''}`}
      >
        <IGRPNestedProviders
          session={session}
          activeThemeValue={activeThemeValue}
          sessionArgs={sessionArgs}
          themeArgs={undefined}
        >
          {children}
        </IGRPNestedProviders>
      </body>
    </html>
  );
}
