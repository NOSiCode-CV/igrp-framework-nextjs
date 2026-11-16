// packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx
import { unstable_rethrow } from 'next/navigation';
import type {
  IGRPApplicationArgs,
  IGRPConfigArgs,
  IGRPMenuItemArgs,
} from '@igrp/framework-next-types';
import { IGRPTemplateSidebar } from '@igrp/framework-next-ui';

import { IgrpLayoutDataError } from '../../errors.js';
import { igrpSetAccessClientConfig } from '../../lib/api-config.js';
import { igrpResolveLayoutDataSource } from '../../lib/layout-data-source.js';
import { fetchAppsByUser } from '../../hooks/use-applications.js';
import { fetchMenus } from '../../hooks/use-menus.js';
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

type SidebarDataProviderProps = {
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
};

export async function SidebarDataProvider({
  config,
  token,
  baseUrl,
  timeout,
  locale,
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

  if (previewMode) {
    return <IGRPTemplateSidebar data={await layoutData.getSidebarData()} />;
  }

  if (!appCode) {
    throw new IgrpLayoutDataError(
      'IGRP_APP_CODE_MISSING',
      '[igrp-layout]: Código da aplicação não encontrada.',
    );
  }

  // Started alongside the AM calls, but awaited outside their try so its
  // failures still propagate unwrapped, as before.
  const sidebarDataPromise = layoutData.getSidebarData();
  // Observed now so a rejection while the AM calls are pending is not reported unhandled.
  sidebarDataPromise.catch(() => {});

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

  const sidebarData = await sidebarDataPromise;

  return (
    <IGRPTemplateSidebar
      data={{
        ...sidebarData,
        user: user ?? undefined,
        menuItems: menuItems.map(toSidebarMenu),
        apps: apps.map(toSidebarApp),
        appCode,
        // No `showPreviewMode`: the field was removed from `next-types` because
        // nothing read it. A preview-mode badge, if wanted, belongs on an
        // explicit `IGRPTemplateSidebar` prop.
      }}
    />
  );
}
