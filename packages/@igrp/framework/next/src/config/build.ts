import type { IGRPConfigArgs } from "@/types/globals"

// TODO: create Sanitizer for config

export async function buildConfig(config: IGRPConfigArgs): Promise<IGRPConfigArgs> {
  if (!config) throw new Error('IGRP config not initialized.');    
  return config;
}