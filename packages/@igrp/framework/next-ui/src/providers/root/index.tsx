"use client";

import type { Session } from "next-auth";
import { NextIntlClientProvider } from "next-intl";

import { IGRPSessionProvider } from "./session-provider";
import { IGRPThemeProvider } from "./theme-provider";
import { IGRPActiveThemeProvider } from "./active-theme";
import { IGRPProgressBar } from "./progress-bar";
import { SidebarInset, SidebarProvider } from "../../components/primitives/sidebar";
import { Toaster } from "../../components/primitives/sonner";
import { IGRPAppSidebar } from "../../components/horizon/app-sidebar";
import { IGRPHeader } from "../../components/horizon/header";
import type { HeaderData, SidebarData } from "../../../types/globals";

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
  messages?: Record<string, string>;
  showLanguageSelector?: boolean;
  languageSelector?: React.ReactNode;
  sidebarData?: SidebarData;
  headerData?: HeaderData;
};

export const IGRPRootProviders: React.FC<IGRPRootProvidersArgs> = ({
  session,
  activeThemeValue,
  progressiveBarArgs,
  sessionArgs,
  themeArgs,
  children,
  locale,
  messages,
  defaultOpen,
  showSidebar,
  showHeader,
  sidebarData,
  headerData,
  showLanguageSelector,
  languageSelector,
}) => {
  return (
    <IGRPSessionProvider session={session} {...sessionArgs}>
      <NextIntlClientProvider locale={locale} messages={messages}>
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
                {showSidebar && <IGRPAppSidebar data={sidebarData} />}

                <SidebarInset>
                  {showHeader && (
                    <IGRPHeader
                      data={headerData}
                      showLanguageSelector={showLanguageSelector}
                      languageSelector={languageSelector}
                      locale={locale}
                    />
                  )}
                  <main className="flex flex-col flex-1 px-6 py-8">
                    {children}
                  </main>
                </SidebarInset>
              </SidebarProvider>
              <Toaster richColors />
            </IGRPActiveThemeProvider>
          </IGRPProgressBar>
        </IGRPThemeProvider>
      </NextIntlClientProvider>
    </IGRPSessionProvider>
  );
};
