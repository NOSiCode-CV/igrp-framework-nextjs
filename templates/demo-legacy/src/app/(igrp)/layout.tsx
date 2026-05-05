import { IGRPLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@igrp/template-config";

import { configLayout } from "@/actions/igrp/layout";
import { verifySession } from "@/lib/dal";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Auth enforcement: redirects to /login if unauthenticated, /logout if token expired.
  // React cache() ensures getSession() runs only once per request even if other
  // server components also call verifySession().
  await verifySession();

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
