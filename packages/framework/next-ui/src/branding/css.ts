import type { IGRPBranding, IGRPBrandingTokenMap } from '@igrp/framework-next-types';

function block(selector: string, map: IGRPBrandingTokenMap | undefined): string {
  if (!map) return '';
  const declarations = Object.keys(map)
    .sort()
    .map((name) => `${name}:${map[name]};`);
  return declarations.length ? `${selector}{${declarations.join('')}}` : '';
}

/**
 * CSS text for the Brand. `html:root:not(.dark)` and `html:root.dark` carry
 * specificity (0,2,1), above the `:root` and `.dark` declarations of the design
 * system and of the Application Center's local tokens, so the Brand wins
 * regardless of stylesheet order. The light block excludes `.dark` so a
 * light-only token never replaces a dark Default. Key order is sorted so the
 * same Brand yields the same bytes on the server and in the browser.
 */
export function igrpBrandingToCss(branding: IGRPBranding | null): string {
  if (!branding) return '';
  return (
    block('html:root:not(.dark)', branding.tokens.light) +
    block('html:root.dark', branding.tokens.dark)
  );
}
