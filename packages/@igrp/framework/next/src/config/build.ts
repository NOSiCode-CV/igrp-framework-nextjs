import type { IGRPConfig } from "@/types/globals"

// TODO: create Sanitizer for config

export async function buildConfig(config?: IGRPConfig): Promise<IGRPConfig> {
  if (!config) throw new Error('IGRP config not initialized.');  
  
  return config;
}
