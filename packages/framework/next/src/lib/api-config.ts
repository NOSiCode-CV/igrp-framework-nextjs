import { AsyncLocalStorage } from 'async_hooks';

export type IGRPClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
};

const DEFAULT_TIMEOUT = 10_000;

// AsyncLocalStorage propagates context through async call chains in both RSC
// renders and Server Actions. React.cache only memoizes inside an active React
// render tree, which means it returns a fresh default object in Server Actions
// (which run as plain Node.js handlers outside any render context).
//
// enterWith() establishes a new store for the current async context and all
// async operations that originate from it — set once per request/action, read
// anywhere downstream in the same async chain.
const storage = new AsyncLocalStorage<IGRPClientRuntimeConfig>();

function getPerRequestConfig(): IGRPClientRuntimeConfig {
  return storage.getStore() ?? { token: '', baseUrl: '', timeout: DEFAULT_TIMEOUT };
}

export function igrpSetAccessClientConfig(config: IGRPClientRuntimeConfig): void {
  const current = storage.getStore();
  if (current) {
    // Store already established in this async context — update in place.
    Object.assign(current, config);
  } else {
    // No store yet (e.g. first call in a Server Action or RSC render).
    // enterWith propagates to all downstream async calls in this context.
    storage.enterWith({ timeout: DEFAULT_TIMEOUT, ...config });
  }
}

export function igrpGetAccessClientConfig(): IGRPClientRuntimeConfig {
  return getPerRequestConfig();
}

export function igrpResetAccessClientConfig(): void {
  const current = storage.getStore();
  if (current) {
    Object.assign(current, { token: '', baseUrl: '', timeout: DEFAULT_TIMEOUT });
  }
}
