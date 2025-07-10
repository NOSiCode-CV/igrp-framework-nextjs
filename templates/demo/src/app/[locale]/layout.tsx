import '@igrp/framework-next-ui/dist/styles.css';
import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';
import { IGRPRootLayout } from '@igrp/framework-next';
import { META_THEME_COLORS } from '@igrp/framework-next-ui';

import { configLayout } from '@/actions/igrp/layout';
import { LanguageSelector } from '@/components/language-selector';
import { routing } from '@/i18n/routing';
import { createConfig } from '@igrp/config';

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = createConfig(layoutConfig);

  return (
    <IGRPRootLayout languageSelector={<LanguageSelector />} config={config}>
      {children}
    </IGRPRootLayout>
  );
}
