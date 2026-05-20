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

  if (!previewMode && apiManagementConfig?.baseUrl) {
    igrpSetAccessClientConfig({
      token: session?.accessToken || '',
      baseUrl: apiManagementConfig.baseUrl,
    });
  }

  const sidebarSlot = showSidebar ? (
    <IGRPLayoutErrorBoundary fallback={<IGRPSidebarError />}>
      <Suspense fallback={<IGRPSidebarSkeleton />}>
        <SidebarDataProvider config={config} />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  ) : undefined;

  const headerSlot = (
    <IGRPLayoutErrorBoundary fallback={<IGRPHeaderError />}>
      <Suspense fallback={<IGRPHeaderSkeleton />}>
        <HeaderDataProvider
          config={config}
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
