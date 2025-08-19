export type IGRPClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
};

let runtimeConfig: IGRPClientRuntimeConfig | null = null;

export function setIGRPAccessClientConfig(config: IGRPClientRuntimeConfig) {
  runtimeConfig = config;
}

export function getIGRPAccessClientConfig(): IGRPClientRuntimeConfig {
  if (!runtimeConfig)
    throw new Error('[igrp-framework-next] a configuração do cliente de acesso nao foi definida.');
  return runtimeConfig;
}

export function resetIGRPAccessClientConfig() {
  runtimeConfig = null;
}
