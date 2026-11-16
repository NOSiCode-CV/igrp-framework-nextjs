import 'server-only';

import { cache } from 'react';
import type { IGRPConfigArgs, IGRPMenuItemArgs } from '@igrp/framework-next-types';

import { IgrpLayoutDataError } from '../errors.js';
import { fetchMenus } from '../hooks/use-menus.js';
import { igrpResolveLayoutDataSource } from './layout-data-source.js';

type LayoutMenusConfig = Pick<IGRPConfigArgs, 'appCode' | 'layoutData' | 'previewMode'>;

/**
 * The application menus, from the same source the sidebar uses:
 * `layoutData.getMenus(appCode)` when supplied; otherwise the data's
 * `menuItems` in preview mode and the Access Management menus outside it.
 *
 * Cached per request and per config object, so the sidebar, the header palette
 * and an app page asking for the menus share one fetch. Outside preview mode it
 * needs the access-client store seeded (the layout does that; a Server Action
 * calls `igrpEnsureAccessClientConfig()` first).
 */
export const igrpGetLayoutMenus = cache(async function igrpGetLayoutMenus(
  config: LayoutMenusConfig,
): Promise<IGRPMenuItemArgs[]> {
  const { appCode = '', previewMode } = config;
  const layoutData = igrpResolveLayoutDataSource(config);

  if (layoutData.getMenus) return layoutData.getMenus(appCode);
  if (previewMode) return (await layoutData.getSidebarData()).menuItems ?? [];
  if (!appCode) {
    throw new IgrpLayoutDataError(
      'IGRP_APP_CODE_MISSING',
      '[igrp-layout]: Código da aplicação não encontrada.',
    );
  }
  return fetchMenus(appCode);
});
