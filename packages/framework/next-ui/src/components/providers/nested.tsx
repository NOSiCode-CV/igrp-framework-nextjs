'use client';

import { type Session } from '@igrp/framework-next-auth';
import type { SessionProviderProps } from '@igrp/framework-next-auth/client';

import { IGRPActiveThemeProvider } from './active-theme';
import { IGRPSessionProvider } from './session';
import { IGRPThemeProvider } from './theme';
import { IGRPSessionWatcher } from '../templates/session-watcher';

export type IGRPNestedProvidersArgs = {
  session?: Session | null;
  activeThemeValue?: string;
  children: React.ReactNode;
  sessionArgs?: Partial<SessionProviderProps>;
  themeArgs?: React.ComponentProps<typeof IGRPThemeProvider>;
  className?: string;
};

export function IGRPNestedProviders({
  session,
  activeThemeValue,
  sessionArgs,
  themeArgs,
  children,
}: IGRPNestedProvidersArgs) {
  return (
    <IGRPSessionProvider {...sessionArgs} session={session}>
      <IGRPThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
        {...themeArgs}
      >
        <IGRPActiveThemeProvider initialTheme={activeThemeValue}>
          <IGRPSessionWatcher>{children}</IGRPSessionWatcher>
        </IGRPActiveThemeProvider>
      </IGRPThemeProvider>
    </IGRPSessionProvider>
  );
}
