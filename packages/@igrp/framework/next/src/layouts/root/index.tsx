import { cn } from '@/lib/utils';
import { IGRPRootProviders } from '@/providers';
import type { Session } from 'next-auth';
// import type { NextIntlClientProvider } from "next-intl";

type IGRPRootLocaleLayoutArgs = {
  readonly locale: string;
  readonly session: Session | null;
  readonly activeThemeValue?: string;
  readonly children: React.ReactNode;
  readonly isScaled?: boolean;
  readonly fontVariables: string;
  // readonly messages?: React.ComponentProps<typeof NextIntlClientProvider>['messages'];
};

export function IGRPRootLocaleLayout({
  locale,
  session,
  activeThemeValue,
  children,
  isScaled,
  fontVariables,
  // messages
}: IGRPRootLocaleLayoutArgs) {
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={fontVariables}
    >
      <head>
        <link
          href='/favicon.ico'
          rel='icon'
          sizes='32x32'
        />
        <link
          href='/favicon.svg'
          rel='icon'
          type='image/svg+xml'
        />
      </head>
      <body
        className={cn(
          'bg-background overscroll-none h-screen font-sans antialiased',
          activeThemeValue && `theme-${activeThemeValue}`,
          isScaled && 'theme-scaled',
        )}
      >
        <IGRPRootProviders
          session={session}
          activeThemeValue={activeThemeValue}
          // locale={locale}
          // messages={messages}
        >
          {children}
        </IGRPRootProviders>
      </body>
    </html>
  );
}
