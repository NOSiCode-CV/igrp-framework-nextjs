import type { Metadata } from 'next';

import type { IGRPBranding } from '@igrp/framework-next-types';

/** Favicon from the Brand, or the app's own icon. Safe to call with `null`. */
export function igrpBrandingMetadata(branding: IGRPBranding | null, fallbackIcon: string): Metadata['icons'] {
  const favicon = branding?.logos.favicon;
  if (!favicon) return { icon: fallbackIcon };
  return {
    icon: [
      { url: favicon.light },
      ...(favicon.dark ? [{ url: favicon.dark, media: '(prefers-color-scheme: dark)' }] : []),
    ],
  };
}
