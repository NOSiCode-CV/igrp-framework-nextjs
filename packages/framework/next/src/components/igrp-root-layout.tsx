import { IGRPNestedProviders } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { cn } from '../lib/utils';

export type IGRPRootLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

export function IGRPRootLayout({ children, config }: IGRPRootLayoutArgs) {
  const layoutConfig = config;

  const { font, layout } = layoutConfig;

  const { session, activeThemeValue, isScaled } = layout;

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
        <IGRPNestedProviders
          session={session}
          activeThemeValue={activeThemeValue}
          sessionArgs={undefined}
          themeArgs={undefined}
        >
          {children}
        </IGRPNestedProviders>
      </body>
    </html>
  );
}
