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

  if (!previewMode) {
    if (!apiManagementConfig || !apiManagementConfig.baseUrl) {
      throw new Error(
        '[igrp-layout]: Modo de pré-visualização desativado. É necessária a configuração da gestão de acesso',
      );
    }

    igrpSetAccessClientConfig({
      token: session?.accessToken || '',
      baseUrl: apiManagementConfig?.baseUrl || '',
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
