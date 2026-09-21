'use client';

import { type Session } from '@igrp/framework-next-auth';
import type { SessionProviderProps } from '@igrp/framework-next-auth/client';
import { TooltipProvider } from '@igrp/igrp-framework-react-design-system';

import { IGRPActiveThemeProvider } from './active-theme.js';
import { IGRPSessionProvider } from './session.js';
import { IGRPThemeProvider } from './theme.js';
import { IGRPSessionWatcher } from '../templates/session-watcher.js';

export type IGRPNestedProvidersArgs = {
  session?: Session | null;
  activeThemeValue?: string;
  children: React.ReactNode;
  sessionArgs?: Partial<SessionProviderProps>;
};

export function IGRPNestedProviders({
  session,
  activeThemeValue,
  sessionArgs,
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
          <IGRPActiveThemeProvider initialTheme={activeThemeValue}>
            <IGRPSessionWatcher>{children}</IGRPSessionWatcher>
          </IGRPActiveThemeProvider>
        </IGRPThemeProvider>
      </TooltipProvider>
    </IGRPSessionProvider>
  );
}
