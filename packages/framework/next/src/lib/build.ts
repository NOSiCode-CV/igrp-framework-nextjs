import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { IgrpConfigError } from '../errors';

// TODO: create Sanitizer for config

/**
 * Validates an assembled IGRP config. Invoked from {@link igrpBuildConfig}.
 *
 * Runs at the template's **root segment** (the template calls `createConfig`
 * from its root `app/layout.tsx` / `src/igrp.template.config.ts`), so any
 * `IgrpConfigError` thrown here bubbles to `app/global-error.tsx` — the only
 * boundary that can render when the root layout itself fails. See the
 * framework CLAUDE.md for the full error-handling contract.
 *
 * Throws `IgrpConfigError` with a stable `code`:
 *   • `IGRP_CONFIG_NOT_INITIALIZED` — `config` is null / undefined.
 *   • `IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING` — preview mode is off and the
 *     access-management API URL is not set.
 */
function validateConfig(
  config: IGRPConfigArgs | null | undefined,
): asserts config is IGRPConfigArgs {
  if (!config) {
    throw new IgrpConfigError(
      'IGRP_CONFIG_NOT_INITIALIZED',
      '[igrp-template-config]: A configuração do IGRP não foi inicializada.',
    );
  }

  if (!config.previewMode) {
    const baseUrl = config.apiManagementConfig?.baseUrl;
    if (!baseUrl) {
      throw new IgrpConfigError(
        'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING',
        '[igrp-template-config]: Modo de pré-visualização desativado. É necessária a configuração da gestão de acesso.',
        { previewMode: false, apiManagementBaseUrlPresent: false },
      );
    }
  }
}

export async function igrpBuildConfig(config: IGRPConfigArgs): Promise<IGRPConfigArgs> {
  validateConfig(config);
  return config;
}
