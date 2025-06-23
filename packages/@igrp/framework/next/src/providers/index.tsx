import type { Session } from 'next-auth';

import { IGRPSessionProvider } from './session-provider';
import { IGRPThemeProvider } from './theme-provider';
import { IGRPActiveThemeProvider } from './active-theme';
import { IGRPProgressBar } from './progress-bar';
// import { NextIntlClientProvider, } from 'next-intl';

type IGRPProvidersArgs = {
  session?: Session | null;
  activeThemeValue?: string;
  children: React.ReactNode;
  showProgressBar?: boolean;
  progressiveBarArgs?: React.ComponentProps<typeof IGRPProgressBar>;
  sessionArgs?: React.ComponentProps<typeof IGRPSessionProvider>;
  themeArgs?: React.ComponentProps<typeof IGRPThemeProvider>;
  // messages?: React.ComponentProps<typeof NextIntlClientProvider>['messages'];
  // locale?: string;
};

export function IGRPRootProviders({
  session,
  activeThemeValue,
  progressiveBarArgs,
  sessionArgs,
  themeArgs,
  children,
  // messages,
  // locale = 'pt',
}: IGRPProvidersArgs) {
  return (
    <IGRPSessionProvider
      session={session}
      {...sessionArgs}
    >
      {/* <NextIntlClientProvider messages={messages} locale={locale}> */}
      <IGRPThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
        enableColorScheme
        {...themeArgs}
      >
        <IGRPProgressBar {...progressiveBarArgs}>
          <IGRPActiveThemeProvider initialTheme={activeThemeValue}>
            {children}
          </IGRPActiveThemeProvider>
        </IGRPProgressBar>
      </IGRPThemeProvider>
      {/* </NextIntlClientProvider> */}
    </IGRPSessionProvider>
  );
}
