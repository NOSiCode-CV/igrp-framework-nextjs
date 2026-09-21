// IMPORTANT: this is the SERVER entry of @igrp/framework-next. Do NOT add a
// `'use client'` directive here — it re-exports React Server Components
// (IGRPRootLayout), `server-only` modules, and server-side helpers; marking it
// client would pull server-only code into client bundles and break the build.
// IMPORTANT: keep explicit named re-exports (no wildcard `export *`, no
// aliasing) so the emitted unbundled exports match the source 1:1.

export { IGRPGlobalLoading } from './components/global-loading.js';

export { IGRPLayoutFull, type IGRPLayoutFullArgs } from './layouts/igrp-layout-full.js';
export { IGRPLayoutBlank, type IGRPLayoutBlankArgs } from './layouts/igrp-layout-blank.js';
// @deprecated Use IGRPLayoutFull instead.
export { IGRPLayout, type IGRPLayoutArgs } from './layouts/igrp-layout.js';

export { IGRPRootLayout, type IGRPRootLayoutArgs } from './layouts/igrp-root-layout.js';

export { igrpBuildConfig } from './lib/build.js';

export { igrpGetAccessClient, igrpResetAccessClient } from './lib/api-client.js';

export {
  type IGRPClientRuntimeConfig,
  igrpGetAccessClientConfig,
  igrpResetAccessClientConfig,
  igrpSetAccessClientConfig,
} from './lib/api-config.js';

export {
  isIgrpAuthBypass,
  igrpGetClaims,
  igrpAuthorize,
  igrpAssertAuthorize,
} from './lib/permissions.js';

export { igrpBuildQueryString } from './lib/build-query-string.js';

export { igrpDeleteAuthCookies } from './lib/delete-auth-cookies.js';

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
} from './errors.js';
