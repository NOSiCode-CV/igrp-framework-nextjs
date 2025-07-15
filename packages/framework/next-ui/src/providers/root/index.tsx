'use client';

import type { Session } from 'next-auth';
import type { IGRPHeaderDataArgs, IGRPSidebarDataArgs } from '@igrp/framework-next-types';

import { IGRPActiveThemeProvider } from './active-theme';
import { IGRPProgressBar } from './progress-bar';
import { IGRPSessionProvider } from './session-provider';
import { IGRPThemeProvider } from './theme-provider';
import { SidebarInset, SidebarProvider } from '../../components/primitives/sidebar';
import { IGRPHeader } from '../../components/horizon/header';
import { IGRPSidebar } from '../../components/horizon/sidebar';
import { Toaster } from '../../components/primitives/sonner';

export type IGRPRootProvidersArgs = {
  session?: Session | null;
  activeThemeValue?: string;
  children: React.ReactNode;
  showProgressBar?: boolean;
  progressiveBarArgs?: React.ComponentProps<typeof IGRPProgressBar>;
  sessionArgs?: React.ComponentProps<typeof IGRPSessionProvider>;
  themeArgs?: React.ComponentProps<typeof IGRPThemeProvider>;
  className?: string;
  showSidebar?: boolean;
  defaultOpen?: boolean;
  showHeader?: boolean;
  locale?: string;
  sidebarData?: IGRPSidebarDataArgs;
  headerData?: IGRPHeaderDataArgs;
};

export const IGRPRootProviders: React.FC<IGRPRootProvidersArgs> = ({
  session,
  activeThemeValue,
  progressiveBarArgs,
  sessionArgs,
  themeArgs,
  children,
  defaultOpen,
  showSidebar,
  showHeader,
  sidebarData,
  headerData,
}) => {
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
          <IGRPProgressBar {...progressiveBarArgs}>
            <IGRPActiveThemeProvider initialTheme={activeThemeValue}>
              <SidebarProvider defaultOpen={defaultOpen}>
                {showSidebar && <IGRPSidebar data={sidebarData} />}

                <SidebarInset>
                  {showHeader && (
                    <IGRPHeader
                      data={headerData}
                    />
                  )}
                  <main className="flex flex-col flex-1 px-6 py-8">{children}</main>
                </SidebarInset>
              </SidebarProvider>
              <Toaster richColors />
            </IGRPActiveThemeProvider>
          </IGRPProgressBar>
        </IGRPThemeProvider>
    </IGRPSessionProvider>
  );
};
