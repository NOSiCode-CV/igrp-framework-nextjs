import { isIgrpAuthBypass } from "@igrp/framework-next-auth/providers";

// The predicate is defined once, in `@igrp/framework-next-auth/providers`, so
// the middleware, the framework and the session callbacks cannot disagree.

/**
 * Returns true when the UI should bypass the auth flow entirely — either
 * because preview mode is on, or because AUTH_PROVIDER=none.
 *
 * Call sites use this single predicate wherever they previously checked
 * `isPreviewMode()` alone, so `AUTH_PROVIDER=none` gets the same UX path as
 * preview mode: no redirect to /login, /login itself routes back to /,
 * mock session in the layout, /api/auth/* blocked at the middleware.
 */
export function isAuthBypass(): boolean {
  return isIgrpAuthBypass(process.env);
}

// Defined in next-auth so the middleware decision and the app's pages share it.
export { sanitizeCallbackUrl } from "@igrp/framework-next-auth/sanitize";
