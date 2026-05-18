import { cache } from 'react';

export type IGRPClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
};

const DEFAULT_TIMEOUT = 10_000;

// React.cache creates a fresh instance per RSC request, giving each concurrent
// request its own isolated config. This prevents token cross-contamination
// between concurrent requests during RSC renders.
//
// ⚠️  Server Actions have a separate React.cache scope from the page render.
// They inherit whatever token was most recently set in their own execution
// context. This is a known limitation for Server Action callers; the typical
// data-refresh actions (revalidateMenusAction, revalidateAppsAction) do not
// need the auth token and are unaffected.
const getPerRequestConfig = cache(
  (): IGRPClientRuntimeConfig => ({ token: '', baseUrl: '', timeout: DEFAULT_TIMEOUT }),
);

export function igrpSetAccessClientConfig(config: IGRPClientRuntimeConfig): void {
  Object.assign(getPerRequestConfig(), config);
}

export function igrpGetAccessClientConfig(): IGRPClientRuntimeConfig {
  return getPerRequestConfig();
}

export function igrpResetAccessClientConfig(): void {
  Object.assign(getPerRequestConfig(), { token: '', baseUrl: '', timeout: DEFAULT_TIMEOUT });
}
