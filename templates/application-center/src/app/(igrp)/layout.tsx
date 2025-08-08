import '@/styles/globals.css';
import '@igrp/framework-next-ui/dist/styles.css';
import '@igrp/igrp-framework-react-design-system/dist/styles.css';

import type { Metadata, Viewport } from 'next';
import { IGRPRootLayout } from '@igrp/framework-next';
import { IGRP_META_THEME_COLORS } from '@igrp/igrp-framework-react-design-system';

import { configLayout } from '@/actions/igrp/layout';
import { createConfig } from '@igrp/template-config';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'IGRP | Applications Center',
  description: 'IGRP | Applications Center',
  icons: { icon: '/igrp/logo-no-text.png' },
};

export const viewport: Viewport = {
  themeColor: IGRP_META_THEME_COLORS.light,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);

  const { layout, previewMode, loginUrl } = config;
  const { session } = layout ?? {};

  const headersList = await headers();
  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-next-url') ||
    headersList.get('referer') ||
    '';

  const loginPath = new URL(loginUrl || '/', 'http://localhost').pathname;
  const isAlreadyOnLogin = currentPath.startsWith(loginPath);  

  if (!previewMode && session === null && loginUrl && !isAlreadyOnLogin) {
    console.log(" IN ROOT LAYOUT");
    redirect(loginUrl);
  }

  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
