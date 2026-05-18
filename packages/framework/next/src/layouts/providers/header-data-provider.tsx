// packages/framework/next/src/layouts/providers/header-data-provider.tsx
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPTemplateHeader } from '@igrp/framework-next-ui';
import type { BreadcrumbItem } from '@igrp/framework-next-ui';

import { fetchCurrentUser } from '../../hooks/use-user';

type HeaderDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'layoutMockData' | 'previewMode'>;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbRouteLabels?: Record<string, string>;
};

export async function HeaderDataProvider({
  config,
  breadcrumbs,
  breadcrumbRouteLabels,
}: HeaderDataProviderProps) {
  const { previewMode, layoutMockData } = config;

  if (previewMode) {
    const headerData = await layoutMockData.getHeaderData();
    return (
      <IGRPTemplateHeader
        data={headerData}
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
        ...(user !== null && { user }),
      }}
      breadcrumbs={breadcrumbs}
      breadcrumbRouteLabels={breadcrumbRouteLabels}
    />
  );
}
