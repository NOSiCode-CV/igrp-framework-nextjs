// IMPORTANT: this is the SERVER entry of @igrp/framework-next. Do NOT add a
// `'use client'` directive here — it re-exports React Server Components
// (IGRPRootLayout), `server-only` modules, and server-side helpers; marking it
// client would pull server-only code into client bundles and break the build.
// IMPORTANT: keep explicit named re-exports (no wildcard `export *`, no
// aliasing) so the emitted unbundled exports match the source 1:1.

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

export {
  isIgrpAuthBypass,
  igrpGetClaims,
  igrpAuthorize,
  igrpAssertAuthorize,
} from './lib/permissions';

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
