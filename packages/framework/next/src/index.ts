// IMPORTANT: this file cannot use any wildcard exports because it is wrapped in a `use client` boundary
// IMPORTANT: do _not_ alias any of the exports in this file, this will cause a mismatch between the unbundled exports

export { IGRPGlobalLoading } from './components/global-loading';

export { IGRPLayoutFull, type IGRPLayoutFullArgs } from './layouts/igrp-layout-full';
export { IGRPLayoutBlank, type IGRPLayoutBlankArgs } from './layouts/igrp-layout-blank';
// @deprecated Use IGRPLayoutFull instead.
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

// Typed errors — also importable via `@igrp/framework-next/errors` for
// consumers who want to isolate error imports from the server entry.
export {
  IgrpError,
  IgrpConfigError,
  IgrpAuthConfigError,
  IgrpLayoutDataError,
  isIgrpError,
  type IgrpErrorCode,
  type IgrpErrorContext,
  type IgrpErrorShape,
} from './errors';
