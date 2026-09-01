// packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPTemplateSidebar } from '@igrp/framework-next-ui';

import { IgrpLayoutDataError } from '../../errors';
import { igrpSetAccessClientConfig } from '../../lib/api-config';
import { fetchAppsByUser } from '../../hooks/use-applications';
import { fetchMenus } from '../../hooks/use-menus';
import { fetchCurrentUser } from '../../hooks/use-user';

type SidebarDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'appCode' | 'layoutMockData' | 'previewMode'>;
  // See header-data-provider.tsx: re-applied here rather than relied on from
  // the caller's AsyncLocalStorage context, since this component also renders
  // inside its own <Suspense> boundary in IGRPLayoutFull.
  token: string;
  baseUrl: string;
};

export async function SidebarDataProvider({ config, token, baseUrl }: SidebarDataProviderProps) {
  const { appCode, previewMode, layoutMockData } = config;

  if (!previewMode) {
    igrpSetAccessClientConfig({ token, baseUrl });
  }

  const sidebarData = await layoutMockData.getSidebarData();

  if (previewMode) {
    return <IGRPTemplateSidebar data={sidebarData} />;
  }

  if (!appCode) {
    throw new IgrpLayoutDataError(
      'IGRP_APP_CODE_MISSING',
      '[igrp-layout]: Código da aplicação não encontrada.',
    );
  }

  const [menuItems, user, apps] = await Promise.all([
    fetchMenus(appCode),
    fetchCurrentUser(),
    fetchAppsByUser(),
  ]);

  return (
    <IGRPTemplateSidebar
      data={{
        ...sidebarData,
        user: user ?? undefined,
        menuItems,
        apps,
        appCode,
        showPreviewMode: previewMode,
      }}
    />
  );
}
