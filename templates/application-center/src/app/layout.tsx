import '@/styles/globals.css';
import '@igrp/framework-next-ui/dist/styles.css';
import '@igrp/igrp-framework-react-design-system/dist/styles.css';

import type { Metadata } from 'next';
import { IGRPRootLayout } from '@igrp/framework-next';

import { configLayout } from '@/actions/igrp/layout';
import { createConfig } from '@/igrp.template.config';

export const metadata: Metadata = {
  title: 'IGRP | Applications Center',
  description: 'IGRP | Applications Center',
  icons: { icon: '/igrp/logo-no-text.png' },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);

  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
