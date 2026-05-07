import { cache } from 'react';

export type IGRPClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
};

const getRequestConfig = cache(
  (): IGRPClientRuntimeConfig => ({
    token: '',
    baseUrl: '',
    timeout: 10_000,
  }),
);

export function igrpSetAccessClientConfig(config: IGRPClientRuntimeConfig): void {
  Object.assign(getRequestConfig(), config);
}

export function igrpGetAccessClientConfig(): IGRPClientRuntimeConfig {
  return getRequestConfig();
}

export function igrpResetAccessClientConfig(): void {
  Object.assign(getRequestConfig(), { token: '', baseUrl: '', timeout: 10_000 });
}
