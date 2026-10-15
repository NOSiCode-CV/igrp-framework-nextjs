import type { IGRPBranding } from '@igrp/framework-next-types';

import { igrpBrandingToCss } from './css.js';

/**
 * `<style>` carrying the Brand tokens, rendered first in `<body>` so the
 * overrides are in the HTML before any content (no flash). Deliberately not a
 * hoisted `href`/`precedence` resource: React dedupes those by `href` and would
 * keep the old tokens after `router.refresh()` delivers a new Brand. No hooks
 * and no browser APIs: this file stays server-safe and carries no directive.
 */
export function IGRPBrandingStyle({ branding }: { branding: IGRPBranding | null }) {
  const css = igrpBrandingToCss(branding);
  if (!css) return null;
  return <style data-igrp-branding="">{css}</style>;
}
