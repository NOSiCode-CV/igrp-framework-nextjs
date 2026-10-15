'use client';

import { type Session } from '@igrp/framework-next-auth';
import type { SessionProviderProps } from '@igrp/framework-next-auth/client';
import type { IGRPBranding } from '@igrp/framework-next-types';
import { TooltipProvider } from '@igrp/igrp-framework-react-design-system';

import { IGRPBrandingProvider } from '../branding/provider.js';
import { IGRPSessionWatcher } from '../templates/session-watcher.js';
import { IGRPSessionProvider } from './session.js';
import { IGRPThemeProvider } from './theme.js';

export type IGRPNestedProvidersArgs = {
  session?: Session | null;
  branding?: IGRPBranding | null;
  children: React.ReactNode;
  sessionArgs?: Partial<SessionProviderProps>;
};

export function IGRPNestedProviders({ session, branding = null, sessionArgs, children }: IGRPNestedProvidersArgs) {
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
            <IGRPSessionWatcher>{children}</IGRPSessionWatcher>
          </IGRPBrandingProvider>
        </IGRPThemeProvider>
      </TooltipProvider>
    </IGRPSessionProvider>
  );
}
