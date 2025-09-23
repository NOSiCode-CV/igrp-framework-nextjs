import { IGRPLayout } from '@igrp/framework-next';

import { configLayout } from '@/actions/igrp/layout';
import { createConfig } from '@igrp/template-config';

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);  

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
