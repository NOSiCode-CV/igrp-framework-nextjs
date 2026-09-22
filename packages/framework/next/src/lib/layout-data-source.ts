import 'server-only';

import type { IGRPConfigArgs, IGRPLayoutDataSource } from '@igrp/framework-next-types';

import { IgrpConfigError } from '../errors.js';

/**
 * Resolve the config's header/sidebar data source across the rename.
 *
 * `layoutMockData` is production configuration wearing a preview-mode name: the
 * providers call it on every render in both modes and keep most of what it
 * returns, so an app author who read the name and stubbed it in production lost
 * the entire header and sidebar configuration with no error and no type
 * complaint. `layoutData` is the honest name; `layoutMockData` stays readable
 * for one release.
 *
 * Both set is a conflict, not a merge — the two could disagree and there is no
 * principled winner — so it throws rather than silently picking one.
 */
export function igrpResolveLayoutDataSource(
  config: Pick<IGRPConfigArgs, 'layoutData' | 'layoutMockData'>,
): IGRPLayoutDataSource {
  const { layoutData, layoutMockData } = config;

  if (layoutData && layoutMockData) {
    throw new IgrpConfigError(
      'IGRP_CONFIG_INVALID',
      '[igrp-template-config]: defina `layoutData` OU `layoutMockData` (descontinuado), não ambos.',
      { field: 'layoutData' },
    );
  }

  const source = layoutData ?? layoutMockData;
  if (!source) {
    throw new IgrpConfigError(
      'IGRP_CONFIG_INVALID',
      '[igrp-template-config]: `layoutData` é obrigatório (fonte de dados do cabeçalho e da barra lateral).',
      { field: 'layoutData' },
    );
  }

  return source;
}
