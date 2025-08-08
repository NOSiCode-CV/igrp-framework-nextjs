import '@/styles/globals.css';
import '@igrp/framework-next-ui/dist/styles.css';
import '@igrp/igrp-framework-react-design-system/dist/styles.css';

import type { Metadata } from 'next';
import { IGRPLoginLayout } from '@igrp/framework-next';

import { configLayout } from '@/actions/igrp/layout';
import { createConfig } from '@/igrp.template.config';

export const metadata: Metadata = {
  title: 'IGRP | Login - Applications Center',
  description: 'IGRP | Login - Applications Center',
  icons: { icon: '/igrp/logo-no-text.png' },
};

export default async function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);

  return <IGRPLoginLayout config={config}>{children}</IGRPLoginLayout>;
}
