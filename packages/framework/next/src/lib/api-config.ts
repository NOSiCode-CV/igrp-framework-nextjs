export type IGRPClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
};

// Module-level mutable object — intentionally shared across the module lifetime.
// React.cache is NOT used here because it does not work across Server Actions
// (each call returns a fresh instance, breaking set-then-read patterns).
// This is an internal enterprise framework; the call pattern is always
// "igrpSetAccessClientConfig() then synchronous reads in the same request handler".
const _config: IGRPClientRuntimeConfig = {
  token: '',
  baseUrl: '',
  timeout: 10_000,
};

export function igrpSetAccessClientConfig(config: IGRPClientRuntimeConfig): void {
  Object.assign(_config, config);
}

export function igrpGetAccessClientConfig(): IGRPClientRuntimeConfig {
  return _config;
}

export function igrpResetAccessClientConfig(): void {
  Object.assign(_config, { token: '', baseUrl: '', timeout: 10_000 });
}
