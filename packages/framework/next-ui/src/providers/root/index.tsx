'use client';

import type { Session } from 'next-auth';
import type {
  IGRPConfigArgs,
  IGRPHeaderDataArgs,
  IGRPSidebarDataArgs,
} from '@igrp/framework-next-types';

import { IGRPActiveThemeProvider } from './active-theme';
import { IGRPProgressBar } from './progress-bar';
import { IGRPSessionProvider } from './session-provider';
import { IGRPThemeProvider } from './theme-provider';
import { SidebarInset, SidebarProvider } from '../../components/primitives/sidebar';
import { IGRPHeader } from '../../components/horizon/header';
import { IGRPSidebar } from '../../components/horizon/sidebar';
import { IGRPToaster } from '@igrp/igrp-framework-react-design-system';

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
  toasterConfig?: IGRPConfigArgs['toasterConfig'];
};

export function IGRPRootProviders({
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
  toasterConfig,
}: IGRPRootProvidersArgs) {
  const {
    showToaster = true,
    position = 'bottom-right',
    theme = 'system',
    richColors = true,
    expand = false,
    duration = 3500,
  } = toasterConfig ?? {};

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
                {showHeader && <IGRPHeader data={headerData} />}

                <main className="flex flex-col flex-1 px-6 py-8">{children}</main>

                {showToaster && (
                  <IGRPToaster
                    position={position}
                    theme={theme}
                    richColors={richColors}
                    expand={expand}
                    duration={duration}
                  />
                )}
              </SidebarInset>
            </SidebarProvider>
          </IGRPActiveThemeProvider>
        </IGRPProgressBar>
      </IGRPThemeProvider>
    </IGRPSessionProvider>
  );
}
