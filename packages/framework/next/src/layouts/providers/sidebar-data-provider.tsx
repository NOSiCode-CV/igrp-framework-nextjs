// packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPTemplateSidebar } from '@igrp/framework-next-ui';

import { IgrpLayoutDataError } from '../../errors';
import { fetchAppsByUser } from '../../hooks/use-applications';
import { fetchMenus } from '../../hooks/use-menus';
import { fetchCurrentUser } from '../../hooks/use-user';

type SidebarDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'appCode' | 'layoutMockData' | 'previewMode'>;
};

export async function SidebarDataProvider({ config }: SidebarDataProviderProps) {
  const { appCode, previewMode, layoutMockData } = config;
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
