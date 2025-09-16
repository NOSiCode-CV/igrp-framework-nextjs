import type { IGRPConfigArgs } from '@igrp/framework-next-types';

// TODO: create Sanitizer for config

export async function igrpBuildConfig(config: IGRPConfigArgs): Promise<IGRPConfigArgs> {
  if (!config)
    throw new Error('[igrp-template-config]: A configuração do IGRP não foi inicializada.');
  return config;
}
