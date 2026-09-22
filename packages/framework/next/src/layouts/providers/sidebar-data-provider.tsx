// packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx
import { unstable_rethrow } from 'next/navigation';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPTemplateSidebar } from '@igrp/framework-next-ui';

import { IgrpLayoutDataError } from '../../errors.js';
import { igrpSetAccessClientConfig } from '../../lib/api-config.js';
import { igrpResolveLayoutDataSource } from '../../lib/layout-data-source.js';
import { fetchAppsByUser } from '../../hooks/use-applications.js';
import { fetchMenus } from '../../hooks/use-menus.js';
import { fetchCurrentUser } from '../../hooks/use-user.js';

type SidebarDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'appCode' | 'layoutData' | 'layoutMockData' | 'previewMode'>;
  // See header-data-provider.tsx: re-applied here rather than relied on from
  // the caller's AsyncLocalStorage context, since this component also renders
  // inside its own <Suspense> boundary in IGRPLayoutFull.
  token: string;
  baseUrl: string;
  /** Per-request AM client timeout; see igrp-layout-full.tsx. */
  timeout?: number;
};

export async function SidebarDataProvider({
  config,
  token,
  baseUrl,
  timeout,
}: SidebarDataProviderProps) {
  const { appCode, previewMode } = config;
  const layoutData = igrpResolveLayoutDataSource(config);

  if (!previewMode) {
    igrpSetAccessClientConfig({ token, baseUrl, ...(timeout !== undefined ? { timeout } : {}) });
  }

  const sidebarData = await layoutData.getSidebarData();

  if (previewMode) {
    return <IGRPTemplateSidebar data={sidebarData} />;
  }

  if (!appCode) {
    throw new IgrpLayoutDataError(
      'IGRP_APP_CODE_MISSING',
      '[igrp-layout]: Código da aplicação não encontrada.',
    );
  }

  // Wrapped so the boundary's `onError` reporter gets a stable `code` instead
  // of a bare transport error. `unstable_rethrow` FIRST: these helpers call
  // `redirect('/login')` on a 401/403, which signals by throwing, and wrapping
  // that would turn "send the user to login" into "render the sidebar error" —
  // the same defect `IGRPLayoutErrorBoundary` was just fixed for.
  let menuItems, user, apps;
  try {
    [menuItems, user, apps] = await Promise.all([
      fetchMenus(appCode),
      fetchCurrentUser(),
      fetchAppsByUser(),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    throw new IgrpLayoutDataError(
      'IGRP_LAYOUT_DATA_FAILED',
      '[igrp-layout]: Não foi possível carregar os dados da barra lateral.',
      { appCode },
      { cause: error },
    );
  }

  return (
    <IGRPTemplateSidebar
      data={{
        ...sidebarData,
        user: user ?? undefined,
        menuItems,
        apps,
        appCode,
        // `showPreviewMode` is deliberately NOT written: the field is
        // @deprecated in `next-types`, no component in `next-ui` or the design
        // system reads it, and the team's decision (repo KNOWN-ISSUES #3) is to
        // delete both ends rather than implement a reader. A preview-mode badge,
        // if wanted, belongs on an explicit `IGRPTemplateSidebar` prop.
      }}
    />
  );
}
