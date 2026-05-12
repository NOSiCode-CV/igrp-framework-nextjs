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
  const headerData = await layoutMockData.getHeaderData();

  if (previewMode) {
    return (
      <IGRPTemplateHeader
        data={headerData}
        breadcrumbs={breadcrumbs}
        breadcrumbRouteLabels={breadcrumbRouteLabels}
      />
    );
  }

  const user = await fetchCurrentUser();

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
