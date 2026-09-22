// packages/framework/next/src/layouts/providers/header-data-provider.tsx
import { unstable_rethrow } from 'next/navigation';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPTemplateHeader } from '@igrp/framework-next-ui';
import type { BreadcrumbItem, IGRPHeaderSlots } from '@igrp/framework-next-ui';

import { IgrpLayoutDataError } from '../../errors.js';
import { igrpSetAccessClientConfig } from '../../lib/api-config.js';
import { igrpResolveLayoutDataSource } from '../../lib/layout-data-source.js';
import { fetchCurrentUser } from '../../hooks/use-user.js';

type HeaderDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'layoutData' | 'layoutMockData' | 'previewMode'>;
  // Access-client credentials, re-applied at the top of this component rather
  // than relied on from the caller's AsyncLocalStorage context: this component
  // renders inside a <Suspense> boundary in IGRPLayoutFull, and Next.js resumes
  // Suspense-deferred Server Components on a later tick that does not reliably
  // inherit a store seeded by `enterWith()` earlier in the same render. See
  // igrp-layout-full.tsx for the matching `igrpSetAccessClientConfig` call.
  token: string;
  baseUrl: string;
  /** Per-request AM client timeout; see igrp-layout-full.tsx. */
  timeout?: number;
  // Whether IGRPLayoutFull is actually rendering a sidebar. `headerData` may
  // independently set `showIGRPSidebarTrigger: true` (it's app-configured,
  // unaware of the layout's `showSidebar` prop) — without this, a layout that
  // hides the sidebar still shows a trigger button with nothing to toggle.
  showSidebar: boolean;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbRouteLabels?: Record<string, string>;
  // Consumer-injected header content, forwarded verbatim. Header data is still
  // fetched here regardless — a slot replaces rendering, never the data.
  headerSlots?: IGRPHeaderSlots;
};

export async function HeaderDataProvider({
  config,
  token,
  baseUrl,
  timeout,
  showSidebar,
  breadcrumbs,
  breadcrumbRouteLabels,
  headerSlots,
}: HeaderDataProviderProps) {
  const { previewMode } = config;
  const layoutData = igrpResolveLayoutDataSource(config);

  if (!previewMode) {
    igrpSetAccessClientConfig({ token, baseUrl, ...(timeout !== undefined ? { timeout } : {}) });
  }

  if (previewMode) {
    const headerData = await layoutData.getHeaderData();
    return (
      <IGRPTemplateHeader
        data={{
          ...headerData,
          showIGRPSidebarTrigger: showSidebar && headerData.showIGRPSidebarTrigger,
        }}
        breadcrumbs={breadcrumbs}
        breadcrumbRouteLabels={breadcrumbRouteLabels}
        slots={headerSlots}
      />
    );
  }

  // Parallel fetch: both are independent of each other. Wrapped so the
  // boundary's `onError` reporter gets a stable `code` instead of a bare
  // transport error — `unstable_rethrow` FIRST, because `fetchCurrentUser`
  // signals a 401/403 by throwing `redirect('/login')`, and wrapping that would
  // turn "send the user to login" into "render the header error": the same
  // defect `IGRPLayoutErrorBoundary` was just fixed for.
  let headerData, user;
  try {
    [headerData, user] = await Promise.all([layoutData.getHeaderData(), fetchCurrentUser()]);
  } catch (error) {
    unstable_rethrow(error);
    throw new IgrpLayoutDataError(
      'IGRP_LAYOUT_DATA_FAILED',
      '[igrp-layout]: Não foi possível carregar os dados do cabeçalho.',
      {},
      { cause: error },
    );
  }

  return (
    <IGRPTemplateHeader
      data={{
        ...headerData,
        showIGRPSidebarTrigger: showSidebar && headerData.showIGRPSidebarTrigger,
        ...(user !== null && { user }),
      }}
      breadcrumbs={breadcrumbs}
      breadcrumbRouteLabels={breadcrumbRouteLabels}
      slots={headerSlots}
    />
  );
}
