import { cn } from "@/lib/utils";
import { IGRPProviders } from "@/providers";
import type { Session } from "next-auth";

type IGRPRootLocaleLayoutArgs = {
  readonly locale: string;
  readonly session: Session | null;
  readonly activeThemeValue?: string;
  readonly children: React.ReactNode;
  readonly isScaled?: boolean;
  readonly fontVariables: string;
}

export function IGRPRootLocaleLayout({
  locale,
  session,
  activeThemeValue,
  children,
  isScaled,
  fontVariables
}: IGRPRootLocaleLayoutArgs) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body
        className={cn(
          'bg-background overscroll-none h-screen font-sans antialiased',
          activeThemeValue && `theme-${activeThemeValue}`,
          isScaled && 'theme-scaled',
          fontVariables,
        )}
      >
        <IGRPProviders
          session={session}
          activeThemeValue={activeThemeValue}
        >
          {children}
        </IGRPProviders>
      </body>
    </html>
  );
}