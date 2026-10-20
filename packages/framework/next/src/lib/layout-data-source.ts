import 'server-only';

import type { IGRPConfigArgs, IGRPLayoutDataSource } from '@igrp/framework-next-types';

import { IgrpConfigError } from '../errors.js';

/**
 * Return the config's header/sidebar data source, throwing a framework error
 * when it is missing (runtime configs can be looser than the declared type).
 */
export function igrpResolveLayoutDataSource(
  config: Pick<IGRPConfigArgs, 'layoutData'>,
): IGRPLayoutDataSource {
  const source = config.layoutData;
  if (!source) {
    throw new IgrpConfigError(
      'IGRP_CONFIG_INVALID',
      '[igrp-template-config]: `layoutData` é obrigatório (fonte de dados do cabeçalho e da barra lateral).',
      { field: 'layoutData' },
    );
  }

  return source;
}
