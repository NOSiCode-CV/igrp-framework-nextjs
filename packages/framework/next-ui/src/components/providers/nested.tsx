'use client';

import { type Session } from '@igrp/framework-next-auth';

import {} from '../templates/header';
import { IGRPActiveThemeProvider } from './active-theme';
import { IGRPProgressBarProvider } from './progress-bar';
import { IGRPSessionProvider } from './session';
import { IGRPThemeProvider } from './theme';

export type IGRPNestedProvidersArgs = {
  session?: Session | null;
  activeThemeValue?: string;
  children: React.ReactNode;
  showProgressBar?: boolean;
  progressiveBarArgs?: React.ComponentProps<typeof IGRPProgressBarProvider>;
  sessionArgs?: React.ComponentProps<typeof IGRPSessionProvider>;
  themeArgs?: React.ComponentProps<typeof IGRPThemeProvider>;
  className?: string;
};

export function IGRPNestedProviders({
  session,
  activeThemeValue,
  progressiveBarArgs,
  sessionArgs,
  themeArgs,
  children,
}: IGRPNestedProvidersArgs) {
  return (
    <IGRPSessionProvider session={session} {...sessionArgs}>
      <IGRPThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
        {...themeArgs}
      >
        <IGRPActiveThemeProvider initialTheme={activeThemeValue}>
          <IGRPProgressBarProvider {...progressiveBarArgs}>{children}</IGRPProgressBarProvider>
        </IGRPActiveThemeProvider>
      </IGRPThemeProvider>
    </IGRPSessionProvider>
  );
}
