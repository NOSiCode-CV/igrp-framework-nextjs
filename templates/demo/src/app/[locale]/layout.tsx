import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getSession } from '@/actions/auth';
import { getTheme } from '@/actions/theme';
import { META_THEME_COLORS } from '@igrp/framework-next';

import './globals.css';

import { IGRPRootLayout, initializeIGRPConfig } from '@igrp/framework-next/server';
import { IGRPConfigClient } from '@igrp/framework-next';
import { fontVariables } from '@/lib/fonts';
import { igrpMockDataProvider } from '@/lib/mock-provider';


export const metadata: Metadata = {
  title: 'IGRP',
  description: 'IGRP',
  icons: { icon: '/igrp/logo-no-text.png' },
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

  const serverFunction: IGRPConfigClient = async () => {
    'use server';  
  
    return initializeIGRPConfig({
      appCode: 'demo',
      previewMode: true,
      mockDataProvider: igrpMockDataProvider,
    })
  };
  

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  const session = await getSession();

  const { activeThemeValue, isScaled } = await getTheme(); 

  return (
    <IGRPRootLayout
      locale={locale}
      session={session}
      activeThemeValue={activeThemeValue}
      isScaled={isScaled}
      fontVariables={fontVariables} 
      serverFunction={serverFunction}   
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </IGRPRootLayout>
  );
}