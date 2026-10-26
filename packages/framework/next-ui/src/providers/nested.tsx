'use client';

import { type Session } from '@igrp/framework-next-auth';
import type { SessionProviderProps } from '@igrp/framework-next-auth/client';
import type { IGRPBranding } from '@igrp/framework-next-types';
import { TooltipProvider } from '@igrp/igrp-framework-react-design-system';

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
};

export function IGRPNestedProviders({
  session,
  branding = null,
  sessionArgs,
  checkSession,
  children,
}: IGRPNestedProvidersArgs) {
  return (
    <IGRPSessionProvider {...sessionArgs} session={session}>
      <TooltipProvider>
        <IGRPThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <IGRPBrandingProvider branding={branding}>
            <IGRPSessionWatcher checkSession={checkSession}>{children}</IGRPSessionWatcher>
          </IGRPBrandingProvider>
        </IGRPThemeProvider>
      </TooltipProvider>
    </IGRPSessionProvider>
  );
}
