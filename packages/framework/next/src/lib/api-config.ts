export type ClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
};

let runtimeConfig: ClientRuntimeConfig | null = null;

export function setAccessClientConfig(config: ClientRuntimeConfig) {
  runtimeConfig = config;
}

export function getAccessClientConfig(): ClientRuntimeConfig {
  if (!runtimeConfig) throw new Error('Access client config not set.');
  return runtimeConfig;
}

export function resetAccessClientConfig() {
  runtimeConfig = null;
}
