import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';
import { IGRPRootLayout } from '@igrp/framework-next';
import { IGRP_META_THEME_COLORS } from '@igrp/framework-next-design-system';

import { configLayout } from '@/actions/igrp/layout';
import { createConfig } from '@igrp/template-config';

export const metadata: Metadata = {
  title: 'IGRP',
  description: 'IGRP',
  icons: { icon: '/igrp/logo-no-text.png' },
};

export const viewport: Viewport = {
  themeColor: IGRP_META_THEME_COLORS.light,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = createConfig(layoutConfig);

  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
