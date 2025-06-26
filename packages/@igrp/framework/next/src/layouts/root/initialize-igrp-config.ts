/* eslint-disable @typescript-eslint/no-explicit-any */
import { type IGRPConfig } from '../../types/globals';

let config: IGRPConfig | null = null;

export function initializeIGRPConfig(customConfig?: Partial<IGRPConfig>): IGRPConfig {
  if (config) return config;

  const defaultConfig: IGRPConfig = {
    appCode:
      typeof window !== 'undefined' ? (window as any).IGRP_PUBLIC_APP_CODE || 'demo' : 'demo',
    previewMode:
      typeof window !== 'undefined' ? (window as any).IGRP_PUBLIC_PREVIEW_MODE === 'true' : false,
    mockDataProvider: undefined,
  };

  config = { ...defaultConfig, ...customConfig };
  return config;
}


export function getIGRPConfig(): IGRPConfig {
  if (!config) {
    throw new Error('IGRP config not initialized. Call initializeIGRPConfig() first.');
  }
  return config;
}

export function isPreviewMode(): boolean {
  return getIGRPConfig().previewMode;
}

export function getAppCode(): string {
  return getIGRPConfig().appCode;
}

export function getMockDataProvider() {
  return getIGRPConfig().mockDataProvider;
}
