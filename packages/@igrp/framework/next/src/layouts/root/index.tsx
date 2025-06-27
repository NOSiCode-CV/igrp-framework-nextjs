import { cn } from '@/lib/utils';
import type { IGRPConfigClient } from '@/types/globals';
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
};

export async function IGRPRootLayout({
  locale,
  session,
  activeThemeValue,
  children,
  isScaled,
  fontVariables,
  serverFunction
}: IGRPRootLocaleLayoutArgs) {

  const config = await serverFunction();  
  console.log({ config});
  
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
          defaultOpen={undefined} 
          languageSelector={undefined} 
          sidebarData={undefined} 
          headerData={undefined}        
        >
          {children}
        </IGRPRootProviders>
      </body>
    </html>
  );
}
