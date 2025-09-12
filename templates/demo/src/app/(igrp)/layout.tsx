import { IGRPLayout } from '@igrp/framework-next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { configLayout } from '@/actions/igrp/layout';
import { createConfig } from '@igrp/template-config';

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);

  /*** use this when use session from next-auth and use login ***/

  const { layout, previewMode, loginUrl, logoutUrl } = config;
  const { session } = layout ?? {};

  const headersList = await headers();
  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-next-url') ||
    headersList.get('referer') ||
    '';

  const baseUrl = process.env.NEXTAUTH_URL;

  const login = loginUrl || '/';
  const loginPath = new URL(login, baseUrl).pathname;
  const isAlreadyOnLogin = currentPath.startsWith(loginPath);

  if (!previewMode && session === null && login && !isAlreadyOnLogin) {
    redirect(logoutUrl || login);
  }

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
