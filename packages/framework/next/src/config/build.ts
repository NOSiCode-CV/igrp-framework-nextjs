import type { IGRPConfigArgs } from '@igrp/framework-next-types';

// TODO: create Sanitizer for config

export async function buildConfig(config: IGRPConfigArgs): Promise<IGRPConfigArgs> {
  if (!config) throw new Error('IGRP config not initialized.');
  return config;
}
