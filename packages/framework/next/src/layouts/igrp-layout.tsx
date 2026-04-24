import { IGRPRootProviders } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { igrpSetAccessClientConfig } from '../lib/api-config';
import { fetchLayoutData } from '../hooks/use-layout';

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

  // Access-management config presence is validated upstream in
  // `igrpBuildConfig` (see ../lib/build.ts). By the time we reach here, either
  // `previewMode` is true OR `apiManagementConfig.baseUrl` is guaranteed to
  // be present — so no runtime throw is needed in this layout.
  if (!previewMode && apiManagementConfig?.baseUrl) {
    igrpSetAccessClientConfig({
      token: session?.accessToken || '',
      baseUrl: apiManagementConfig.baseUrl,
    });
  }

  const { headerData, sidebarData } = await fetchLayoutData(
    layoutMockData.getHeaderData,
    layoutMockData.getSidebarData,
    previewMode,
    appCode,
  );

  return (
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
  );
}
