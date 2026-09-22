import { Suspense } from 'react';
import {
  IGRPRootProvidersFull,
  IGRPLayoutErrorBoundary,
  IGRPHeaderSkeleton,
  IGRPSidebarSkeleton,
  IGRPHeaderError,
  IGRPSidebarError,
  type BreadcrumbItem,
  type IGRPHeaderSlots,
} from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { igrpSetAccessClientConfig } from '../lib/api-config.js';
import { HeaderDataProvider } from './providers/header-data-provider.js';
import { SidebarDataProvider } from './providers/sidebar-data-provider.js';

export type IGRPLayoutFullArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
  readonly showSidebar?: boolean;
  readonly breadcrumbs?: BreadcrumbItem[];
  readonly breadcrumbRouteLabels?: Record<string, string>;
  /**
   * Consumer-injected header content. The framework still fetches and owns all
   * header data (user, logo, breadcrumbs, sidebar trigger) — a slot only decides
   * what renders in its position. Slots must be elements, not components: they
   * cross the Server→Client boundary into IGRPTemplateHeader.
   */
  readonly headerSlots?: IGRPHeaderSlots;
  /**
   * Initial open state of the sidebar shell.
   *
   * It cannot be read from the sidebar data source: that is fetched inside
   * `SidebarDataProvider`, behind a `<Suspense>` boundary nested in the shell
   * this value configures — the shell has to render before the data exists.
   * Hence an explicit prop. Defaults to `true`, the value that was previously
   * hardcoded here.
   */
  readonly defaultSidebarOpen?: boolean;
  rootProviderClassName?: string;
};

export async function IGRPLayoutFull({
  children,
  config,
  showSidebar = true,
  breadcrumbs,
  breadcrumbRouteLabels,
  headerSlots,
  defaultSidebarOpen = true,
  rootProviderClassName,
}: IGRPLayoutFullArgs) {
  const { previewMode, layout, apiManagementConfig, toasterConfig } = config;
  const { session } = layout;

  const accessToken = session?.accessToken || '';
  const accessBaseUrl = apiManagementConfig?.baseUrl || '';
  // Threaded explicitly: `igrpSetAccessClientConfig` only defaults `timeout`
  // when it CREATES the store, so omitting it here left every read-path client
  // on the 10s default and made `apiManagementConfig.timeout` dead config.
  const accessTimeout = apiManagementConfig?.timeout;

  if (!previewMode && accessBaseUrl) {
    igrpSetAccessClientConfig({
      token: accessToken,
      baseUrl: accessBaseUrl,
      ...(accessTimeout !== undefined ? { timeout: accessTimeout } : {}),
    });
  }

  // token/baseUrl are also passed explicitly to the two providers below —
  // each renders inside its own <Suspense> boundary, which resumes on a later
  // tick that doesn't reliably inherit the AsyncLocalStorage store seeded by
  // `igrpSetAccessClientConfig` above. They re-apply it themselves.
  const sidebarSlot = showSidebar ? (
    <IGRPLayoutErrorBoundary fallback={<IGRPSidebarError />}>
      <Suspense fallback={<IGRPSidebarSkeleton />}>
        <SidebarDataProvider
          config={config}
          token={accessToken}
          baseUrl={accessBaseUrl}
          timeout={accessTimeout}
        />
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
          timeout={accessTimeout}
          showSidebar={showSidebar}
          breadcrumbs={breadcrumbs}
          breadcrumbRouteLabels={breadcrumbRouteLabels}
          headerSlots={headerSlots}
        />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  );

  return (
    <IGRPRootProvidersFull
      defaultOpen={defaultSidebarOpen}
      toasterConfig={toasterConfig}
      sidebar={sidebarSlot}
      header={headerSlot}
      className={rootProviderClassName}
    >
      {children}
    </IGRPRootProvidersFull>
  );
}
