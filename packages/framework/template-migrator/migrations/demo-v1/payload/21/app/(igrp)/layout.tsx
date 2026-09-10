import { IGRPLayoutFull, igrpGetClaims } from "@igrp/framework-next";
import { IGRPSectionPermissions } from "@igrp/framework-next-ui";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";

import { configLayout } from "@/actions/igrp/layout";
import { createConfig } from "@/igrp.template.config";
import { verifySession } from "@/lib/dal";

// Every route under this layout is authenticated and reads the session
// (cookies/headers) per request, so it can never be statically prerendered.
// Declaring it dynamic skips the build-time prerender attempt that would
// otherwise trip Next's `headers()` bailout.
export const dynamic = "force-dynamic";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await verifySession();

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);
  // verifySession() above seeds the per-request access-client config that igrpGetClaims() reads.
  const claims = await igrpGetClaims();

  return (
    <IGRPSectionPermissions state={claims}>
      <IGRPLayoutFull config={config}>{children}</IGRPLayoutFull>
    </IGRPSectionPermissions>
  );
}
