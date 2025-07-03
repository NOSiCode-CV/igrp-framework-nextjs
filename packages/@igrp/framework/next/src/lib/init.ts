/* eslint-disable @typescript-eslint/no-explicit-any */
import { type IGRPConfigArgs } from '@/types/globals';

export function initializeIGRPConfig(customConfig?: IGRPConfigArgs) {
  if (!customConfig) throw new Error('IGRP config not initialized. Call initializeIGRPConfig() first.');  
  return customConfig;
}