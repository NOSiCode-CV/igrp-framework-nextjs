import { Suspense } from 'react';
import { IGRPRootProviders } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { setAccessClientConfig } from '../lib/api-config';
import { fetchAppByCode } from '../services/applications/use-applications';
import { fetchLayoutData } from '../services/layout/use-layout';

export type IGRPLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

export async function IGRPLayout({ children, config }: IGRPLayoutArgs) {
  const layoutConfig = config;

  const {
    appCode,
    previewMode,
    layoutMockData,
    showSidebar,
    showHeader,
    layout,
    apiManagementConfig,
    toasterConfig,
  } = layoutConfig;

  const { session } = layout;

  let app;

  console.log({ session });

  if (!previewMode) {
    if (!apiManagementConfig || !apiManagementConfig.baseUrl) {
      throw new Error(
        'Preview Mode is not enabled, when not enabled, API Management config is required.',
      );
    }

    setAccessClientConfig({
      token: session?.accessToken || '',
      baseUrl: apiManagementConfig?.baseUrl || '',
    });

    app = await fetchAppByCode(appCode);
  }

  const { headerData, sidebarData } = await fetchLayoutData(
    layoutMockData.getHeaderData,
    layoutMockData.getSidebarData,
    previewMode,
    appCode,
  );

  return (
    <Suspense fallback={<div>Loading API Data...</div>}>
      <IGRPRootProviders
        defaultOpen={true}
        sidebarData={sidebarData}
        headerData={headerData}
        showSidebar={showSidebar}
        showHeader={showHeader}
        toasterConfig={toasterConfig}
      >
        {children}
      </IGRPRootProviders>
    </Suspense>
  );
}
