import { IGRPLayoutFull } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@/igrp.template.config";

import { configLayout } from "@/actions/igrp/layout";
import { verifySession } from "@/lib/dal";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await verifySession();

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  return (
    <IGRPLayoutFull config={config} showSidebar={false}>
      {children}
    </IGRPLayoutFull>
  );
}
