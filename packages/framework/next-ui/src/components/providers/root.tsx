'use client';

import type {
  IGRPConfigArgs,
  IGRPHeaderDataArgs,
  IGRPSidebarDataArgs,
} from '@igrp/framework-next-types';
import {
  IGRPToaster,
  IGRPSidebarInsetPrimitive,
  IGRPSidebarProviderPrimitive,
} from '@igrp/igrp-framework-react-design-system';

import { IGRPActiveThemeProvider } from './active-theme';
import { IGRPProgressBarProvider } from './progress-bar';
import { IGRPSessionProvider } from './session';
import { IGRPThemeProvider } from './theme';
import { IGRPTemplateHeader } from '../templates/header';
import { IGRPTemplateSidebar } from '../templates/sidebar';
import { type ExtendedSession } from '../../types/globals';

export type IGRPRootProvidersArgs = {
  session?: ExtendedSession | null;
  activeThemeValue?: string;
  children: React.ReactNode;
  showProgressBar?: boolean;
  progressiveBarArgs?: React.ComponentProps<typeof IGRPProgressBarProvider>;
  sessionArgs?: React.ComponentProps<typeof IGRPSessionProvider>;
  themeArgs?: React.ComponentProps<typeof IGRPThemeProvider>;
  className?: string;
  showSidebar?: boolean;
  defaultOpen?: boolean;
  showHeader?: boolean;
  locale?: string;
  sidebarData: IGRPSidebarDataArgs;
  headerData: IGRPHeaderDataArgs;
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
        <IGRPProgressBarProvider {...progressiveBarArgs}>
          <IGRPActiveThemeProvider initialTheme={activeThemeValue}>
            <IGRPSidebarProviderPrimitive defaultOpen={defaultOpen}>
              {showSidebar && <IGRPTemplateSidebar data={sidebarData} />}

              <IGRPSidebarInsetPrimitive>
                {showHeader && <IGRPTemplateHeader data={headerData} />}

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
              </IGRPSidebarInsetPrimitive>
            </IGRPSidebarProviderPrimitive>
          </IGRPActiveThemeProvider>
        </IGRPProgressBarProvider>
      </IGRPThemeProvider>
    </IGRPSessionProvider>
  );
}
