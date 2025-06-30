import { cn } from '@/lib/utils';
import type { HeaderData, IGRPConfigClient, SidebarData } from '@/types/globals';
import type { Session } from 'next-auth';
import { IGRPRootProviders } from '@igrp/framework-next-ui';

type IGRPRootLocaleLayoutArgs = {
  readonly locale: string;
  readonly session: Session | null;
  readonly activeThemeValue?: string;
  readonly children: React.ReactNode;
  readonly isScaled?: boolean;
  readonly fontVariables: string;
  serverFunction: IGRPConfigClient;
  messages?: Record<string, string>;
  showSidebar?: boolean;  
  showHeader?: boolean;
  defaultOpen?: boolean;
  sidebarData?: SidebarData;
  headerData?: HeaderData;
  showLanguageSelector?: boolean;
};

export async function IGRPRootLayout({
  locale,
  session,
  activeThemeValue,
  children,
  isScaled,
  fontVariables,
  serverFunction,
  messages,
  showSidebar,
  showHeader,
  defaultOpen,
  showLanguageSelector
}: IGRPRootLocaleLayoutArgs) {
  const config = await serverFunction();
  console.log({ config, session });
  const { mockDataProvider } = config;

  const sidebarData = await mockDataProvider?.getSidebarData();
  const headerData = await mockDataProvider?.getHeaderData();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={fontVariables}
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
          defaultOpen={defaultOpen}
          languageSelector={undefined}
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
