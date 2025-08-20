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
    throw new Error('[access-client]: Configuração do cliente de acesso não definida.');
  return runtimeConfig;
}

export function resetIGRPAccessClientConfig() {
  runtimeConfig = null;
}
