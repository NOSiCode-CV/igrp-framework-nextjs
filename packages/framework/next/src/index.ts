// IMPORTANT: this file cannot use any wildcard exports because it is wrapped in a `use client` boundary
// IMPORTANT: do _not_ alias any of the exports in this file, this will cause a mismatch between the unbundled exports

export { IGRPGlobalLoading } from './components/glabal-loading';

export { IGRPLayout, type IGRPLayoutArgs } from './components/igrp-layout';

export { IGRPRootLayout, type IGRPRootLayoutArgs } from './components/root-layout';

export { buildConfig } from './config/build';

export { getIGRPAccessClient } from './lib/api-client';

export {
  type IGRPClientRuntimeConfig,
  setIGRPAccessClientConfig,
  getIGRPAccessClientConfig,
  resetIGRPAccessClientConfig,
} from './lib/api-config';

export { igrpBuildQueryString } from './lib/build-query-string';
