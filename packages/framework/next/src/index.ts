// IMPORTANT: this file cannot use any wildcard exports because it is wrapped in a `use client` boundary
// IMPORTANT: do _not_ alias any of the exports in this file, this will cause a mismatch between the unbundled exports

export { IGRPGlobalLoading } from './components/glabal-loading';

export { IGRPLayout, type IGRPLayoutArgs } from './layouts/igrp-layout';

export { IGRPRootLayout, type IGRPRootLayoutArgs } from './layouts/igrp-root-layout';

export { igrpBuildConfig } from './lib/build';

export { igrpGetAccessClient, igrpResetAccessClient } from './lib/api-client';

export {
  type IGRPClientRuntimeConfig,
  igrpGetAccessClientConfig,
  igrpResetAccessClientConfig,
  igrpSetAccessClientConfig,
} from './lib/api-config';

export { igrpBuildQueryString } from './lib/build-query-string';

export { igrpDeleteAuthCookies } from './lib/delete-auth-cookies';
