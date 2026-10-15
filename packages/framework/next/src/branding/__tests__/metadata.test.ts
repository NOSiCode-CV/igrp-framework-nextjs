import { describe, expect, it } from 'vitest';

import type { IGRPBranding } from '@igrp/framework-next-types';

import { igrpBrandingMetadata } from '../metadata.js';

const withFavicon = (favicon: NonNullable<IGRPBranding['logos']['favicon']>): IGRPBranding => ({
  version: 1,
  tokens: {},
  logos: { favicon },
});

describe('igrpBrandingMetadata', () => {
  it('returns the app fallback icon when there is no Brand', () => {
    expect(igrpBrandingMetadata(null, '/logo-no-text.png')).toEqual({ icon: '/logo-no-text.png' });
  });

  it('returns the fallback icon when the Brand has no favicon', () => {
    expect(igrpBrandingMetadata({ version: 1, tokens: {}, logos: {} }, '/f.png')).toEqual({ icon: '/f.png' });
  });

  it('uses the Brand favicon, with a dark variant behind a colour-scheme media query', () => {
    expect(
      igrpBrandingMetadata(
        withFavicon({ light: 'https://cdn.example/f.png', dark: 'https://cdn.example/f-dark.png' }),
        '/f.png',
      ),
    ).toEqual({
      icon: [
        { url: 'https://cdn.example/f.png' },
        { url: 'https://cdn.example/f-dark.png', media: '(prefers-color-scheme: dark)' },
      ],
    });
  });
});
