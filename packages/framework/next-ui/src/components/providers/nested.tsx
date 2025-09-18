'use client';

import { type Session } from '@igrp/framework-next-auth';

import {} from '../templates/header';
import { IGRPActiveThemeProvider } from './active-theme';
import { IGRPSessionProvider } from './session';
import { IGRPThemeProvider } from './theme';

export type IGRPNestedProvidersArgs = {
  session?: Session | null;
  activeThemeValue?: string;
  children: React.ReactNode;
  showProgressBar?: boolean;
  sessionArgs?: React.ComponentProps<typeof IGRPSessionProvider>;
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
          {children}
        </IGRPActiveThemeProvider>
      </IGRPThemeProvider>
    </IGRPSessionProvider>
  );
}
