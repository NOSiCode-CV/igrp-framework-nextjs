// packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx
import { unstable_rethrow } from 'next/navigation';
import type {
  IGRPApplicationArgs,
  IGRPConfigArgs,
  IGRPMenuItemArgs,
  IGRPSidebarDataArgs,
} from '@igrp/framework-next-types';
import { IGRPSidebarDataProvider, IGRPTemplateSidebar } from '@igrp/framework-next-ui';
import type { IGRPSidebarLabelProps } from '@igrp/framework-next-ui';

import { IgrpLayoutDataError } from '../../errors.js';
import { igrpSetAccessClientConfig } from '../../lib/api-config.js';
import { igrpResolveLayoutDataSource } from '../../lib/layout-data-source.js';
import { fetchAppsByUser } from '../../hooks/use-applications.js';
import { igrpGetLayoutMenus } from '../../lib/layout-menus.js';
import { fetchCurrentUser } from '../../hooks/use-user.js';

// The sidebar is a client component, so every field here is serialized into the
// RSC payload. Keep only what next-ui's menus and app switcher read; the
// required-but-unread array fields are emptied rather than sent.
function toSidebarMenu(m: IGRPMenuItemArgs): IGRPMenuItemArgs {
  const { id, name, code, type, position, icon, status, target, url, pageSlug, parentCode } = m;
  return {
    id,
    name,
    code,
    type,
    position,
    icon,
    status,
    target,
    url,
    pageSlug,
    parentCode,
    applicationCode: m.applicationCode,
    roles: [],
  };
}

function toSidebarApp(a: IGRPApplicationArgs): IGRPApplicationArgs {
  const { id, code, name, description, status, type, picture, slug, url } = a;
  return { id, code, name, description, status, type, picture, slug, url, departments: [] };
}

export type SidebarDataProviderProps = IGRPSidebarLabelProps & {
  config: Pick<IGRPConfigArgs, 'appCode' | 'layoutData' | 'previewMode'>;
  // See header-data-provider.tsx: re-applied here rather than relied on from
  // the caller's AsyncLocalStorage context, since this component also renders
  // inside its own <Suspense> boundary in IGRPLayoutFull.
  token: string;
  baseUrl: string;
  /** Per-request AM client timeout; see igrp-layout-full.tsx. */
  timeout?: number;
  /** Base locale for `Accept-Language`; see igrp-layout-full.tsx. */
  locale?: string;
  /** A composition of `IGRPSidebar*` parts, rendered instead of the default sidebar. */
  children?: React.ReactNode;
};

export async function SidebarDataProvider({
  config,
  token,
  baseUrl,
  timeout,
  locale,
  menuLabels,
  navUserLabels,
  children,
}: SidebarDataProviderProps) {
  const { appCode, previewMode } = config;
  const layoutData = igrpResolveLayoutDataSource(config);

  if (!previewMode) {
    igrpSetAccessClientConfig({
      token,
      baseUrl,
      ...(timeout !== undefined ? { timeout } : {}),
      ...(locale ? { locale } : {}),
    });
  }

  const render = (data: IGRPSidebarDataArgs) => (
    <IGRPSidebarDataProvider data={data} menuLabels={menuLabels} navUserLabels={navUserLabels}>
      {children ?? <IGRPTemplateSidebar />}
    </IGRPSidebarDataProvider>
  );

  // Each `layoutData.get*` method replaces that data's source in both modes.
  // Without it, preview keeps the authored sidebar data and production asks
  // Access Management.
  const loadMenus = Boolean(layoutData.getMenus) || !previewMode;
  const getUser = layoutData.getUser ?? (previewMode ? undefined : fetchCurrentUser);
  const getApps = layoutData.getApps ?? (previewMode ? undefined : fetchAppsByUser);

  if (!loadMenus && !getUser && !getApps) {
    return render(await layoutData.getSidebarData());
  }

  if (!previewMode && !layoutData.getMenus && !appCode) {
    throw new IgrpLayoutDataError(
      'IGRP_APP_CODE_MISSING',
      '[igrp-layout]: Código da aplicação não encontrada.',
    );
  }

  // Started alongside the other calls, but awaited outside their try so its
  // failures still propagate unwrapped, as before.
  const sidebarDataPromise = layoutData.getSidebarData();
  // Observed now so a rejection while the other calls are pending is not reported unhandled.
  sidebarDataPromise.catch(() => {});

  // Wrapped so the boundary's `onError` reporter gets a stable `code` instead
  // of a bare transport error. `unstable_rethrow` FIRST: these helpers call
  // `redirect('/login')` on a 401/403, which signals by throwing, and wrapping
  // that would turn "send the user to login" into "render the sidebar error".
  let menuItems, user, apps;
  try {
    [menuItems, user, apps] = await Promise.all([
      loadMenus ? igrpGetLayoutMenus(config) : undefined,
      getUser?.(),
      getApps?.(),
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

  const sidebarData = await sidebarDataPromise;

  return render({
    ...sidebarData,
    ...(getUser && { user: user ?? undefined }),
    ...(menuItems && { menuItems: menuItems.map(toSidebarMenu) }),
    ...(apps && { apps: apps.map(toSidebarApp) }),
    ...(!previewMode && { appCode }),
    // No `showPreviewMode`: the field was removed from `next-types` because
    // nothing read it. A preview-mode badge, if wanted, belongs on an
    // explicit `IGRPTemplateSidebar` prop.
  });
}
