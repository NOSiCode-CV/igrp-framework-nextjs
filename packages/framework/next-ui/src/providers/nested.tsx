'use client';

import { type Session } from '@igrp/framework-next-auth';
import type { SessionProviderProps } from '@igrp/framework-next-auth/client';
import type { IGRPBranding } from '@igrp/framework-next-types';
import { IGRPTooltipProvider } from '@igrp/igrp-framework-react-design-system';
import type { ThemeProviderProps } from 'next-themes';

import { IGRPBrandingProvider } from '../branding/provider.js';
import { type IGRPCheckSession, IGRPSessionWatcher } from '../templates/session-watcher.js';
import { IGRPSessionProvider } from './session.js';
import { IGRPThemeProvider } from './theme.js';

export type IGRPNestedProvidersArgs = {
  session?: Session | null;
  branding?: IGRPBranding | null;
  children: React.ReactNode;
  sessionArgs?: Partial<SessionProviderProps>;
  /** Forwarded to `IGRPSessionWatcher`: the AM session check run when a tab regains focus. */
  checkSession?: IGRPCheckSession;
  /** CSP nonce for the theme boot script next-themes inlines in the HTML. */
  nonce?: string;
  /**
   * next-themes props merged over the defaults (`attribute="class"`,
   * `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`,
   * `enableColorScheme`). `nonce` above wins over a `nonce` given here.
   */
  themeProps?: Partial<Omit<ThemeProviderProps, 'children'>>;
};

export function IGRPNestedProviders({
  session,
  branding = null,
  sessionArgs,
  checkSession,
  nonce,
  themeProps,
  children,
}: IGRPNestedProvidersArgs) {
  return (
    <IGRPSessionProvider {...sessionArgs} session={session}>
      {/* IGRPTooltipProvider so every IGRPTooltip in the app shares it instead of mounting its own. */}
      <IGRPTooltipProvider delayDuration={0}>
        <IGRPThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
          {...themeProps}
          nonce={nonce ?? themeProps?.nonce}
        >
          <IGRPBrandingProvider branding={branding}>
            <IGRPSessionWatcher checkSession={checkSession}>{children}</IGRPSessionWatcher>
          </IGRPBrandingProvider>
        </IGRPThemeProvider>
      </IGRPTooltipProvider>
    </IGRPSessionProvider>
  );
}
