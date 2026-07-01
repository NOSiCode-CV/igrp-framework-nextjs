// packages/framework/next/src/layouts/providers/header-data-provider.tsx
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPTemplateHeader } from '@igrp/framework-next-ui';
import type { BreadcrumbItem } from '@igrp/framework-next-ui';

import { igrpSetAccessClientConfig } from '../../lib/api-config';
import { fetchCurrentUser } from '../../hooks/use-user';

type HeaderDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'layoutMockData' | 'previewMode'>;
  // Access-client credentials, re-applied at the top of this component rather
  // than relied on from the caller's AsyncLocalStorage context: this component
  // renders inside a <Suspense> boundary in IGRPLayoutFull, and Next.js resumes
  // Suspense-deferred Server Components on a later tick that does not reliably
  // inherit a store seeded by `enterWith()` earlier in the same render. See
  // igrp-layout-full.tsx for the matching `igrpSetAccessClientConfig` call.
  token: string;
  baseUrl: string;
  // Whether IGRPLayoutFull is actually rendering a sidebar. `headerData` may
  // independently set `showIGRPSidebarTrigger: true` (it's app-configured,
  // unaware of the layout's `showSidebar` prop) — without this, a layout that
  // hides the sidebar still shows a trigger button with nothing to toggle.
  showSidebar: boolean;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbRouteLabels?: Record<string, string>;
};

export async function HeaderDataProvider({
  config,
  token,
  baseUrl,
  showSidebar,
  breadcrumbs,
  breadcrumbRouteLabels,
}: HeaderDataProviderProps) {
  const { previewMode, layoutMockData } = config;

  if (!previewMode) {
    igrpSetAccessClientConfig({ token, baseUrl });
  }

  if (previewMode) {
    const headerData = await layoutMockData.getHeaderData();
    return (
      <IGRPTemplateHeader
        data={{
          ...headerData,
          showIGRPSidebarTrigger: showSidebar && headerData.showIGRPSidebarTrigger,
        }}
        breadcrumbs={breadcrumbs}
        breadcrumbRouteLabels={breadcrumbRouteLabels}
      />
    );
  }

  // Parallel fetch: both are independent of each other.
  const [headerData, user] = await Promise.all([
    layoutMockData.getHeaderData(),
    fetchCurrentUser(),
  ]);

  return (
    <IGRPTemplateHeader
      data={{
        ...headerData,
        showIGRPSidebarTrigger: showSidebar && headerData.showIGRPSidebarTrigger,
        ...(user !== null && { user }),
      }}
      breadcrumbs={breadcrumbs}
      breadcrumbRouteLabels={breadcrumbRouteLabels}
    />
  );
}
