import {
  IGRPLayoutFull,
  IGRPLayoutHeader,
  igrpGetClaims,
} from "@igrp/framework-next";
import { IGRPLocaleSwitcher } from "@igrp/framework-next/i18n/client";
import { IGRPSectionPermissions } from "@igrp/framework-next-ui";

import { setLocale } from "@/i18n/actions";
import { createConfig } from "@/igrp.template.config";
import { getLayoutConfig, verifySession } from "@/lib/dal";
import { IGRPQueryProvider } from "@/providers/query-provider";

// Every route under this layout is authenticated and reads the session
// (cookies/headers) per request, so it can never be statically prerendered.
// Declaring it dynamic skips the build-time prerender attempt that would
// otherwise trip Next's `headers()` bailout.
export const dynamic = "force-dynamic";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Independent: verifySession() gates the request, getLayoutConfig() reads the
  // (cached) session + theme the root layout already requested.
  const [, layoutConfig] = await Promise.all([
    verifySession(),
    getLayoutConfig(),
  ]);
  const config = await createConfig(layoutConfig);
  // verifySession() above seeds the per-request access-client config that igrpGetClaims() reads.
  const claims = await igrpGetClaims();

  // The framework fetches and owns all header data; a slot only adds what
  // renders in its position. The command palette needs no slot: the framework
  // fills it from the same menus the sidebar shows.
  return (
    <IGRPSectionPermissions state={claims}>
      <IGRPQueryProvider>
        <IGRPLayoutFull
          config={config}
          header={
            <IGRPLayoutHeader
              config={config}
              slots={{
                // Language selector. The server action crosses to the client
                // component as a prop; no next-auth coupling (cookie-first app).
                actions: <IGRPLocaleSwitcher action={setLocale} />,
              }}
            />
          }
        >
          {children}
        </IGRPLayoutFull>
      </IGRPQueryProvider>
    </IGRPSectionPermissions>
  );
}
