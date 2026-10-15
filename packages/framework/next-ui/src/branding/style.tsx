import type { IGRPBranding } from '@igrp/framework-next-types';

import { igrpBrandingToCss } from './css.js';

/**
 * Hoisted `<style>` carrying the Brand tokens. React 19 moves a precedence
 * stylesheet into `<head>`, so the overrides apply before first paint. No hooks
 * and no browser APIs: this file stays server-safe and carries no directive.
 */
export function IGRPBrandingStyle({ branding }: { branding: IGRPBranding | null }) {
  const css = igrpBrandingToCss(branding);
  if (!css) return null;
  return (
    <style href="igrp-branding" precedence="igrp-branding">
      {css}
    </style>
  );
}
