// packages/framework/next/src/layouts/igrp-layout.tsx
import { Suspense } from 'react';
import {
  IGRPRootProviders,
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

export type IGRPLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
  /** Pre-resolved breadcrumb items. Forwarded to the header. */
  readonly breadcrumbs?: BreadcrumbItem[];
  /** App-level route → label map. Forwarded to the header. */
  readonly breadcrumbRouteLabels?: Record<string, string>;
};

export async function IGRPLayout({
  children,
  config,
  breadcrumbs,
  breadcrumbRouteLabels,
}: IGRPLayoutArgs) {
  const { previewMode, showSidebar, showHeader, layout, apiManagementConfig, toasterConfig } =
    config;

  const { session } = layout;

  if (!previewMode && apiManagementConfig?.baseUrl) {
    igrpSetAccessClientConfig({
      token: session?.accessToken || '',
      baseUrl: apiManagementConfig.baseUrl,
    });
  }

  // Only create slots when the section is enabled — avoids executing the async
  // server component when showSidebar/showHeader is false.
  const sidebarSlot = showSidebar ? (
    <IGRPLayoutErrorBoundary fallback={<IGRPSidebarError />}>
      <Suspense fallback={<IGRPSidebarSkeleton />}>
        <SidebarDataProvider config={config} />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  ) : null;

  const headerSlot = showHeader ? (
    <IGRPLayoutErrorBoundary fallback={<IGRPHeaderError />}>
      <Suspense fallback={<IGRPHeaderSkeleton />}>
        <HeaderDataProvider
          config={config}
          breadcrumbs={breadcrumbs}
          breadcrumbRouteLabels={breadcrumbRouteLabels}
        />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  ) : null;

  return (
    <IGRPRootProviders
      defaultOpen={true}
      showSidebar={showSidebar}
      showHeader={showHeader}
      toasterConfig={toasterConfig}
      sidebar={sidebarSlot}
      header={headerSlot}
    >
      {children}
    </IGRPRootProviders>
  );
}
