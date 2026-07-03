import { Suspense } from 'react';
import {
  IGRPRootProvidersFull,
  IGRPLayoutErrorBoundary,
  IGRPHeaderSkeleton,
  IGRPSidebarSkeleton,
  IGRPHeaderError,
  IGRPSidebarError,
  type BreadcrumbItem,
} from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { igrpSetAccessClientConfig } from '../lib/api-config';
import { HeaderDataProvider } from './providers/header-data-provider';
import { SidebarDataProvider } from './providers/sidebar-data-provider';

export type IGRPLayoutFullArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
  readonly showSidebar?: boolean;
  readonly breadcrumbs?: BreadcrumbItem[];
  readonly breadcrumbRouteLabels?: Record<string, string>;
};

export async function IGRPLayoutFull({
  children,
  config,
  showSidebar = true,
  breadcrumbs,
  breadcrumbRouteLabels,
}: IGRPLayoutFullArgs) {
  const { previewMode, layout, apiManagementConfig, toasterConfig } = config;
  const { session } = layout;

  const accessToken = session?.accessToken || '';
  const accessBaseUrl = apiManagementConfig?.baseUrl || '';

  if (!previewMode && accessBaseUrl) {
    igrpSetAccessClientConfig({
      token: accessToken,
      baseUrl: accessBaseUrl,
    });
  }

  // token/baseUrl are also passed explicitly to the two providers below —
  // each renders inside its own <Suspense> boundary, which resumes on a later
  // tick that doesn't reliably inherit the AsyncLocalStorage store seeded by
  // `igrpSetAccessClientConfig` above. They re-apply it themselves.
  const sidebarSlot = showSidebar ? (
    <IGRPLayoutErrorBoundary fallback={<IGRPSidebarError />}>
      <Suspense fallback={<IGRPSidebarSkeleton />}>
        <SidebarDataProvider config={config} token={accessToken} baseUrl={accessBaseUrl} />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  ) : undefined;

  const headerSlot = (
    <IGRPLayoutErrorBoundary fallback={<IGRPHeaderError />}>
      <Suspense fallback={<IGRPHeaderSkeleton />}>
        <HeaderDataProvider
          config={config}
          token={accessToken}
          baseUrl={accessBaseUrl}
          showSidebar={showSidebar}
          breadcrumbs={breadcrumbs}
          breadcrumbRouteLabels={breadcrumbRouteLabels}
        />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  );

  return (
    <IGRPRootProvidersFull
      defaultOpen={true}
      toasterConfig={toasterConfig}
      sidebar={sidebarSlot}
      header={headerSlot}
    >
      {children}
    </IGRPRootProvidersFull>
  );
}
