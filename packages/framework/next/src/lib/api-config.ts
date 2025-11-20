export type IGRPClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
};

let runtimeConfig: IGRPClientRuntimeConfig | null = null;

export function igrpSetAccessClientConfig(config: IGRPClientRuntimeConfig) {
  runtimeConfig = config;
}

export function igrpGetAccessClientConfig(): IGRPClientRuntimeConfig {
  if (!runtimeConfig)
    throw new Error('[access-client]: Configuração cliente de acesso não está definida.');
  return runtimeConfig;
}

export function igrpResetAccessClientConfig() {
  runtimeConfig = null;
}
