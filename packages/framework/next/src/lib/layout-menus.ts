import 'server-only';

import { cache } from 'react';
import type {
  IGRPConfigArgs,
  IGRPLayoutDataSource,
  IGRPMenuItemArgs,
} from '@igrp/framework-next-types';

import { IgrpLayoutDataError } from '../errors.js';
import { fetchMenus } from '../hooks/use-menus.js';
import { igrpResolveLayoutDataSource } from './layout-data-source.js';

type LayoutMenusConfig = Pick<IGRPConfigArgs, 'appCode' | 'layoutData' | 'previewMode'>;

// Keyed on the data source and primitives, not the config: apps usually build a
// new config object per call, while `layoutData` is a module-level object.
const getMenus = cache(async function getMenus(
  layoutData: IGRPLayoutDataSource,
  appCode: string,
  previewMode: boolean,
): Promise<IGRPMenuItemArgs[]> {
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

/**
 * The application menus, from the same source the sidebar uses:
 * `layoutData.getMenus(appCode)` when supplied; otherwise the data's
 * `menuItems` in preview mode and the Access Management menus outside it.
 *
 * Cached per request on `layoutData`, `appCode` and `previewMode`, so the
 * sidebar, the header palette and an app page share one fetch even when each
 * builds its own config object. Outside preview mode it needs the access-client
 * store seeded (the layout does that; a Server Action calls
 * `igrpEnsureAccessClientConfig()` first).
 */
export async function igrpGetLayoutMenus(config: LayoutMenusConfig): Promise<IGRPMenuItemArgs[]> {
  return getMenus(
    igrpResolveLayoutDataSource(config),
    config.appCode ?? '',
    Boolean(config.previewMode),
  );
}
