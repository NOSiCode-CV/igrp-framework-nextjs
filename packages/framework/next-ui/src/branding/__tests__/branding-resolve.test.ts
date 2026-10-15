import { describe, expect, it } from 'vitest';

import type { IGRPBranding } from '@igrp/framework-next-types';

import { resolveHeaderLogo, resolveWideLogo } from '../resolve.js';

const brand: IGRPBranding = {
  version: 1,
  tokens: {},
  logos: {
    header: { light: 'https://cdn.example/h.png', dark: 'https://cdn.example/h-dark.png' },
    wide: { light: 'https://cdn.example/w.svg', width: 320, height: 96 },
  },
};

const fallback = { src: '/logo.png', width: 100, height: 60 };

describe('resolveHeaderLogo', () => {
  it('prefers the Brand header slot, with its dark variant', () => {
    expect(resolveHeaderLogo({ branding: brand, headerLogo: '/app.png', fallback: '/x.png' })).toEqual({
      light: 'https://cdn.example/h.png',
      dark: 'https://cdn.example/h-dark.png',
    });
  });

  it('uses headerLogo when the Brand has no header slot', () => {
    expect(resolveHeaderLogo({ branding: null, headerLogo: '/app.png', fallback: '/x.png' })).toEqual({
      light: '/app.png',
    });
  });

  it('uses the fallback last', () => {
    expect(resolveHeaderLogo({ branding: null, fallback: '/x.png' })).toEqual({ light: '/x.png' });
  });
});

describe('resolveWideLogo', () => {
  it('uses the Brand wide slot with its size', () => {
    expect(resolveWideLogo({ branding: brand, fallback })).toEqual({
      src: 'https://cdn.example/w.svg',
      srcDark: undefined,
      width: 320,
      height: 96,
    });
  });

  it('keeps the app logo when no Brand wide slot exists', () => {
    expect(resolveWideLogo({ branding: null, fallback })).toEqual({
      src: '/logo.png',
      srcDark: undefined,
      width: 100,
      height: 60,
    });
  });
});
