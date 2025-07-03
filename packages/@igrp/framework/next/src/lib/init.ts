/* eslint-disable @typescript-eslint/no-explicit-any */
import { type IGRPConfig } from '@/types/globals';

export function initializeIGRPConfig(customConfig?: IGRPConfig) {
  if (!customConfig) throw new Error('IGRP config not initialized. Call initializeIGRPConfig() first.');  
  return customConfig;
}