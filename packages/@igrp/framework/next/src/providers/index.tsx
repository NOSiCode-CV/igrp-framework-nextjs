import type { Session } from "next-auth";

import { IGRPSessionProvider } from "./session-provider";
import { IGRPThemeProvider } from "./theme-provider";
import { IGRPActiveThemeProvider } from "./active-theme";
import { IGRPProgressBar } from "./progress-bar";

type IGRPProvidersArgs = {
  session?: Session | null;
  activeThemeValue?: string;
  children: React.ReactNode;
  showProgressBar?: boolean;
  progressiveBarProps?: React.ComponentProps<typeof IGRPProgressBar>;
}

export function IGRPProviders({ 
  session, 
  activeThemeValue,
  showProgressBar = true, 
  progressiveBarProps,
  children 
}: IGRPProvidersArgs) {
  return (
    <IGRPSessionProvider session={session}>
      <IGRPActiveThemeProvider initialTheme={activeThemeValue}>
        <IGRPThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {showProgressBar 
            ? <IGRPProgressBar {...progressiveBarProps}>{children}</IGRPProgressBar>
            : children
          }            
        </IGRPThemeProvider>
      </IGRPActiveThemeProvider>
    </IGRPSessionProvider>
  )
}