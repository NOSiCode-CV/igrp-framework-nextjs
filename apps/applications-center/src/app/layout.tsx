import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';
import { IGRPRootLayout } from '@igrp/framework-next';
import { IGRP_META_THEME_COLORS } from '@igrp/igrp-framework-react-design-system';

import { configLayout } from '@/actions/igrp/layout';
import { createConfig } from '@/igrp.template.config';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'IGRP | Centro de Aplicações',
  description: 'IGRP | Centro de Aplicações',
  icons: { icon: '/igrp/logo-no-text.png' },
};

export const viewport: Viewport = {
  themeColor: IGRP_META_THEME_COLORS.light,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);

  const { layout, previewMode, loginUrl, logoutUrl } = config;
  const { session } = layout || {};

  const headersList = await headers();
  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-next-url') ||
    headersList.get('referer') ||
    '';

  const baseUrl = process.env.NEXTAUTH_URL;

  const loginPath = new URL(loginUrl || '/', baseUrl).pathname;
  const isAlreadyOnLogin = currentPath.startsWith(loginPath);

  if (!previewMode && session === null && loginUrl && !isAlreadyOnLogin) {
    redirect(logoutUrl || loginUrl);
  }

  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
